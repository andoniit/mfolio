"use client";

import { useState } from "react";
import slugify from "slugify";
import BlogEditor from "@/components/blog/BlogEditor";
import ImageUpload from "@/components/admin/ImageUpload";

type BlogFormProps = {
  initialData?: any;
  postId?: string;
};

export default function BlogForm({ initialData, postId }: BlogFormProps) {
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
  const [contentJson, setContentJson] = useState(initialData?.content_json || null);
  const [contentHtml, setContentHtml] = useState(initialData?.content_html || "");
  const [saving, setSaving] = useState(false);

  const handleTitleChange = (value: string) => {
    setTitle(value);

    if (!initialData?.slug && !postId) {
      setSlug(slugify(value, { lower: true, strict: true }));
    }
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
        alert(result?.error || "Failed to delete post");
        return;
      }

      if (result?.action === "trashed") {
        window.location.href = "/admin/blogs";
      }
    }}
    className="px-5 py-3 rounded-lg border border-red-400 text-red-600"
  >
    Move to Trash
  </button>
)}
    </form>
  );
}