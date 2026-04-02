"use client";

import { useState } from "react";
import slugify from "slugify";
import BlogEditor from "@/components/blog/BlogEditor";
import ImageUpload from "@/components/admin/ImageUpload";
import { PROJECT_IMAGES_BUCKET } from "@/lib/project-storage";

export type GalleryItem = {
  image_url: string;
  alt_text: string;
};

type ProjectFormProps = {
  initialData?: any;
  projectId?: string;
};

const getDateInputValue = (value?: string | null) => {
  if (!value) return new Date().toISOString().split("T")[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  return parsed.toISOString().split("T")[0];
};

export default function ProjectForm({ initialData, projectId }: ProjectFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || "");
  const [gallery, setGallery] = useState<GalleryItem[]>(
    initialData?.gallery_images || []
  );
  const [published, setPublished] = useState(initialData?.published || false);
  const [projectDate, setProjectDate] = useState(getDateInputValue(initialData?.project_date));
  const [contentJson, setContentJson] = useState(initialData?.content_json ?? null);
  const [contentHtml, setContentHtml] = useState(initialData?.content_html || "");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(projectId);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!initialData?.slug && !projectId) {
      setSlug(slugify(value, { lower: true, strict: true }));
    }
  };

  const clearCoverImage = () => setCoverImageUrl("");

  const removeGalleryAt = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const moveGallery = (index: number, dir: -1 | 1) => {
    setGallery((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const updateGalleryAlt = (index: number, alt_text: string) => {
    setGallery((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], alt_text };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please add a project title.");
      return;
    }

    if (!slug.trim()) {
      alert("Please add a slug.");
      return;
    }

    if (!contentHtml?.trim()) {
      alert("Please add project content.");
      return;
    }

    if (published && !projectDate) {
      alert("Please choose a project date when publishing.");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      cover_image_url: coverImageUrl || null,
      content_json: contentJson,
      content_html: contentHtml,
      published,
      project_date: projectDate || null,
      gallery_images: gallery.map((g) => ({
        image_url: g.image_url,
        alt_text: g.alt_text?.trim() || null,
      })),
    };

    try {
      const res = await fetch(
        isEditing ? `/api/projects/${projectId}` : "/api/projects",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        alert(result?.error || "Failed to save project");
        return;
      }

      window.location.href = "/admin/projects";
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving the project.");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!projectId) return;

    const ok = confirm("Are you sure you want to move this project to the trash?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const result = await res.json().catch(() => null);

      if (!res.ok) {
        alert(result?.error || "Failed to move project to trash");
        return;
      }

      window.location.href = "/admin/projects/trash";
    } catch (error) {
      console.error(error);
      alert("Something went wrong while moving the project to trash.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 pb-20">
      <div className="flex-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <input
            type="text"
            placeholder="Project title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-3xl font-bold text-gray-900 placeholder:text-gray-300 outline-none bg-transparent"
            required
          />

          <div className="flex items-center gap-2 mt-4 text-sm">
            <span className="text-gray-400">Slug:</span>
            <input
              type="text"
              placeholder="project-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-md border border-gray-200 outline-none focus:border-gray-400 transition-colors"
              required
            />
          </div>
        </div>

        <div className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
          <BlogEditor
            content={initialData?.content_json}
            onChange={({ json, html }) => {
              setContentJson(json);
              setContentHtml(html);
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Short description
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Shown on the projects grid and at the top of the project page.
          </p>
          <textarea
            placeholder="One or two sentences…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-4 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all min-h-[100px] resize-y"
          />
        </div>
      </div>

      <div className="w-full lg:w-[360px] space-y-6 flex-shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <h3 className="font-semibold text-gray-900">Publish</h3>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="font-medium text-sm text-gray-700">Published</span>
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
              Project date
            </label>
            <input
              type="date"
              value={projectDate}
              onChange={(e) => setProjectDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Cover image</h3>
          <ImageUpload
            bucket={PROJECT_IMAGES_BUCKET}
            folder="covers"
            onUploaded={setCoverImageUrl}
          />

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
              No cover image
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Gallery</h3>
          <p className="text-xs text-gray-500">
            Add images in order; optional alt text for accessibility.
          </p>
          <ImageUpload
            bucket={PROJECT_IMAGES_BUCKET}
            folder="gallery"
            onUploaded={(url) =>
              setGallery((prev) => [...prev, { image_url: url, alt_text: "" }])
            }
          />

          {gallery.length > 0 ? (
            <ul className="space-y-3 mt-4">
              {gallery.map((item, index) => (
                <li
                  key={`${item.image_url}-${index}`}
                  className="flex flex-col gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50/80"
                >
                  <div className="flex gap-2 items-start">
                    <img
                      src={item.image_url}
                      alt={item.alt_text || ""}
                      className="w-16 h-16 object-cover rounded-lg shrink-0 border border-gray-200"
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Alt text (optional)"
                        value={item.alt_text}
                        onChange={(e) => updateGalleryAlt(index, e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveGallery(index, -1)}
                          disabled={index === 0}
                          className="text-xs px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGallery(index, 1)}
                          disabled={index === gallery.length - 1}
                          className="text-xs px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                        >
                          Down
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGalleryAt(index)}
                      className="text-red-600 text-sm px-2 py-1 hover:bg-red-50 rounded self-start"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 mt-2">No gallery images yet.</p>
          )}
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : isEditing ? "Update project" : "Create project"}
          </button>

          {projectId && (
            <button
              type="button"
              onClick={handleMoveToTrash}
              className="w-full py-3 rounded-xl bg-white border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
            >
              Move to trash
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
