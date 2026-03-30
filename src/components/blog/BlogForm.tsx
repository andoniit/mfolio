"use client";

import { useEffect, useMemo, useState } from "react";
import slugify from "slugify";
import BlogEditor from "@/components/blog/BlogEditor";
import ImageUpload from "@/components/admin/ImageUpload";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type BlogFormProps = {
  initialData?: any;
  postId?: string;
  categories?: Category[];
  tags?: Tag[];
  selectedTagIds?: string[];
};

export default function BlogForm({
  initialData,
  postId,
  categories = [],
  tags = [],
  selectedTagIds = [],
}: BlogFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url || ""
  );
  const [published, setPublished] = useState(initialData?.published || false);
  const [publishedAt, setPublishedAt] = useState(
    initialData?.published_at
      ? new Date(initialData.published_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [contentJson, setContentJson] = useState(
    initialData?.content_json || null
  );
  const [contentHtml, setContentHtml] = useState(
    initialData?.content_html || ""
  );
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(postId);

  useEffect(() => {
    setAvailableTags(tags);
  }, [tags]);

  const selectedCategoryName = useMemo(() => {
    return categories.find((category) => category.id === categoryId)?.name || "";
  }, [categories, categoryId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);

    if (!initialData?.slug && !postId) {
      setSlug(slugify(value, { lower: true, strict: true }));
    }
  };

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;

    setCreatingTag(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        alert(result?.error || "Failed to create tag");
        return;
      }

      const createdTag = result as Tag | null;
      if (!createdTag?.id) {
        alert("Tag created, but response was unexpected.");
        return;
      }

      setAvailableTags((prev) => {
        if (prev.some((t) => t.id === createdTag.id)) return prev;
        return [...prev, createdTag];
      });

      setTagIds((prev) => {
        if (prev.includes(createdTag.id)) return prev;
        return [...prev, createdTag.id];
      });

      setNewTagName("");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while creating the tag.");
    } finally {
      setCreatingTag(false);
    }
  };

  const clearCoverImage = () => {
    setCoverImageUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please add a post title.");
      return;
    }

    if (!slug.trim()) {
      alert("Please add a slug.");
      return;
    }

    if (!contentHtml?.trim()) {
      alert("Please add blog content.");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      cover_image_url: coverImageUrl || null,
      content_json: contentJson,
      content_html: contentHtml,
      published,
      published_at: published ? new Date(publishedAt).toISOString() : null,
      category_id: categoryId || null,
      tag_ids: tagIds,
    };

    try {
      const res = await fetch(
        isEditing ? `/api/posts/${postId}` : "/api/posts",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        alert(result?.error || "Failed to save post");
        return;
      }

      window.location.href = "/admin/blogs";
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving the post.");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!postId) return;

    const ok = confirm(
      "Are you sure you want to move this post to the trash?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        alert(result?.error || "Failed to move post to trash");
        return;
      }

      window.location.href = "/admin/blogs/trash";
    } catch (error) {
      console.error(error);
      alert("Something went wrong while moving the post to trash.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 pb-20">
      <div className="flex-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-3xl font-bold text-gray-900 placeholder:text-gray-300 outline-none bg-transparent"
            required
          />

          <div className="flex items-center gap-2 mt-4 text-sm">
            <span className="text-gray-400">Slug:</span>
            <input
              type="text"
              placeholder="post-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-md border border-gray-200 outline-none focus:border-gray-400 transition-colors"
              required
            />
          </div>
        </div>

        <div className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
          <BlogEditor
            content={initialData?.content_json || undefined}
            onChange={({ json, html }) => {
              setContentJson(json);
              setContentHtml(html);
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Short Excerpt
          </label>
          <p className="text-xs text-gray-500 mb-4">
            A brief summary of your post that appears on the blog grid.
          </p>
          <textarea
            placeholder="Write a captivating summary..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-4 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all min-h-[100px] resize-y"
          />
        </div>
      </div>

      <div className="w-full lg:w-[360px] space-y-6 flex-shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <h3 className="font-semibold text-gray-900">Publish Status</h3>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="font-medium text-sm text-gray-700">
              Make post live?
            </span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publish Date
            </label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="font-semibold text-gray-900">Organization</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full appearance-none border border-gray-200 bg-white rounded-xl px-4 py-2.5 outline-none focus:border-black transition-colors"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {selectedCategoryName && (
              <p className="mt-2 text-xs text-gray-500">
                Selected: {selectedCategoryName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>

            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = tagIds.includes(tag.id);

                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}

              {availableTags.length === 0 && (
                <span className="text-sm text-gray-400 italic">
                  No tags created yet.
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                Add a tag
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    #
                  </span>
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g. react, marketing..."
                    className="w-full bg-gray-50 text-gray-900 pl-8 pr-3 py-2 rounded-xl border border-gray-200 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={creatingTag}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={creatingTag || !newTagName.trim()}
                  className="px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {creatingTag ? "Adding..." : "Add Tag"}
                </button>
              </div>
            </div>

            {tagIds.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                {tagIds.length} tag{tagIds.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Cover Image</h3>

          <ImageUpload onUploaded={setCoverImageUrl} />

          {coverImageUrl ? (
            <div className="mt-4 relative rounded-xl overflow-hidden border border-gray-200 group">
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="w-full h-auto object-cover"
              />
              <button
                type="button"
                onClick={clearCoverImage}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                aria-label="Remove cover image"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="mt-4 w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-sm text-gray-400">
              No cover image selected
            </div>
          )}
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving
              ? "Saving Changes..."
              : isEditing
              ? "Update Post"
              : "Publish Post"}
          </button>

          {postId && (
            <button
              type="button"
              onClick={handleMoveToTrash}
              className="w-full py-3 rounded-xl bg-white border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
            >
              Move to Trash
            </button>
          )}
        </div>
      </div>
    </form>
  );
}