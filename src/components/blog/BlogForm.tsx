"use client";

import { useState } from "react";
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
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || "");
  const [published, setPublished] = useState(initialData?.published || false);
  const [publishedAt, setPublishedAt] = useState(
    initialData?.published_at
      ? new Date(initialData.published_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [contentJson, setContentJson] = useState(initialData?.content_json || null);
  const [contentHtml, setContentHtml] = useState(initialData?.content_html || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);
  const [saving, setSaving] = useState(false);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!initialData?.slug && !postId) {
      setSlug(slugify(value, { lower: true, strict: true }));
    }
  };

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      slug,
      excerpt,
      cover_image_url: coverImageUrl,
      content_json: contentJson,
      content_html: contentHtml,
      published,
      published_at: published ? new Date(publishedAt).toISOString() : null,
      category_id: categoryId || null,
      tag_ids: tagIds,
    };

    const isEditing = Boolean(postId);

    const res = await fetch(isEditing ? `/api/posts/${postId}` : "/api/posts", {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      alert(errorData?.error || "Failed to save post");
      return;
    }

    window.location.href = "/admin/blogs";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="w-full border rounded-lg p-3"
        required
      />

      <input
        type="text"
        placeholder="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="w-full border rounded-lg p-3"
        required
      />

      <textarea
        placeholder="Short excerpt"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        className="w-full border rounded-lg p-3 min-h-[120px]"
      />

      <div>
        <label className="block mb-2 font-medium">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border rounded-lg p-3"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 font-medium">Tags</p>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 border rounded-full px-3 py-2">
              <input
                type="checkbox"
                checked={tagIds.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              <span>{tag.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-medium">Cover image</p>
        <ImageUpload onUploaded={setCoverImageUrl} />
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt="Cover preview"
            className="mt-4 w-full max-w-md rounded-lg"
          />
        )}
      </div>

      <div>
        <label className="block mb-2 font-medium">Publish date</label>
        <input
          type="date"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          className="border rounded-lg p-3"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        <label htmlFor="published">Published</label>
      </div>

      <div>
        <p className="mb-2 font-medium">Content</p>
        <BlogEditor
          content={initialData?.content_json || undefined}
          onChange={({ json, html }) => {
            setContentJson(json);
            setContentHtml(html);
          }}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-lg bg-black text-white"
        >
          {saving ? "Saving..." : postId ? "Update Post" : "Create Post"}
        </button>

        {postId && (
          <button
            type="button"
            onClick={async () => {
              const ok = confirm("Move this post to trash?");
              if (!ok) return;

              const res = await fetch(`/api/posts/${postId}`, {
                method: "DELETE",
              });

              const result = await res.json().catch(() => null);

              if (!res.ok) {
                alert(result?.error || "Failed to move post to trash");
                return;
              }

              window.location.href = "/admin/blogs";
            }}
            className="px-5 py-3 rounded-lg border border-red-400 text-red-600"
          >
            Move to Trash
          </button>
        )}
      </div>
    </form>
  );
}