"use client";

import { useEffect, useState } from "react";
import slugify from "slugify";
import AdminDateField from "@/components/admin/AdminDateField";
import BlogEditor from "@/components/blog/BlogEditor";
import ImageUpload from "@/components/admin/ImageUpload";
import { PROJECT_IMAGES_BUCKET } from "@/lib/project-storage";
import { adminFetch } from "@/lib/admin-fetch";

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

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProjectForm({ initialData, projectId }: ProjectFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [externalUrl, setExternalUrl] = useState(initialData?.external_url || "");
  const [homeFeatureOrder, setHomeFeatureOrder] = useState(
    initialData?.home_feature_order ? String(initialData.home_feature_order) : ""
  );
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || "");
  const [gallery, setGallery] = useState<GalleryItem[]>(
    initialData?.gallery_images || []
  );
  const [published, setPublished] = useState(initialData?.published || false);
  const [projectDate, setProjectDate] = useState(getDateInputValue(initialData?.project_date));
  const [contentJson, setContentJson] = useState(initialData?.content_json ?? null);
  const [contentHtml, setContentHtml] = useState(initialData?.content_html || "");
  const [techStack, setTechStack] = useState<string[]>(() =>
    parseStringList(initialData?.tech_stack)
  );
  const [techStackInput, setTechStackInput] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>(() =>
    parseStringList(initialData?.collaborators)
  );
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [workplace, setWorkplace] = useState(initialData?.workplace || "");
  const [clientName, setClientName] = useState(initialData?.client_name || "");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(projectId);

  useEffect(() => {
    if (published && !projectDate) {
      setProjectDate(getDateInputValue());
    }
  }, [published, projectDate]);

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

  const addTechStackItem = () => {
    const t = techStackInput.trim();
    if (!t) return;
    setTechStack((prev) => [...prev, t]);
    setTechStackInput("");
  };

  const removeTechStackAt = (index: number) => {
    setTechStack((prev) => prev.filter((_, i) => i !== index));
  };

  const moveTechStack = (index: number, dir: -1 | 1) => {
    setTechStack((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const addCollaborator = () => {
    const t = collaboratorInput.trim();
    if (!t) return;
    setCollaborators((prev) => [...prev, t]);
    setCollaboratorInput("");
  };

  const removeCollaboratorAt = (index: number) => {
    setCollaborators((prev) => prev.filter((_, i) => i !== index));
  };

  const moveCollaborator = (index: number, dir: -1 | 1) => {
    setCollaborators((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
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
      external_url: externalUrl.trim() || null,
      home_feature_order: homeFeatureOrder ? Number(homeFeatureOrder) : null,
      cover_image_url: coverImageUrl || null,
      content_json: contentJson,
      content_html: contentHtml,
      tech_stack: techStack,
      collaborators,
      workplace: workplace.trim() || null,
      client_name: clientName.trim() || null,
      published,
      project_date: projectDate || null,
      gallery_images: gallery.map((g) => ({
        image_url: g.image_url,
        alt_text: g.alt_text?.trim() || null,
      })),
    };

    try {
      const res = await adminFetch(
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
      const res = await adminFetch(`/api/projects/${projectId}`, { method: "DELETE" });
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

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Project link
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Optional: add either a GitHub URL or a live site URL. The frontend will show a button automatically.
          </p>
          <input
            type="url"
            placeholder="https://github.com/... or https://your-live-site.com"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Tech stack</label>
          <p className="text-xs text-gray-500 mb-4">
            Add one technology or tool at a time (e.g. Next.js, Supabase). Order is preserved on the project page.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTechStackItem();
                }
              }}
              placeholder="e.g. TypeScript"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
            <button
              type="button"
              onClick={addTechStackItem}
              className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 shrink-0"
            >
              Add
            </button>
          </div>
          {techStack.length > 0 ? (
            <ul className="space-y-2">
              {techStack.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50/80 text-sm text-gray-800"
                >
                  <span className="flex-1 min-w-0 truncate">{item}</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveTechStack(index, -1)}
                      disabled={index === 0}
                      className="text-xs px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTechStack(index, 1)}
                      disabled={index === techStack.length - 1}
                      className="text-xs px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTechStackAt(index)}
                      className="text-xs text-red-600 px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No tech stack items yet.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-gray-900">Collaboration &amp; context</h3>
          <p className="text-xs text-gray-500 -mt-2">
            Optional: where the work happened, client name, and people you collaborated with.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workplace / organization</label>
            <input
              type="text"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              placeholder="e.g. Acme Studio, Freelance"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="If this was client work"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Collaborators</label>
            <p className="text-xs text-gray-500 mb-3">Add one name at a time.</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={collaboratorInput}
                onChange={(e) => setCollaboratorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCollaborator();
                  }
                }}
                placeholder="Name"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
              <button
                type="button"
                onClick={addCollaborator}
                className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 shrink-0"
              >
                Add
              </button>
            </div>
            {collaborators.length > 0 ? (
              <ul className="space-y-2">
                {collaborators.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50/80 text-sm text-gray-800"
                  >
                    <span className="flex-1 min-w-0 truncate">{item}</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveCollaborator(index, -1)}
                        disabled={index === 0}
                        className="text-xs px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCollaborator(index, 1)}
                        disabled={index === collaborators.length - 1}
                        className="text-xs px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCollaboratorAt(index)}
                        className="text-xs text-red-600 px-2 py-1 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No collaborators listed.</p>
            )}
          </div>
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

          <AdminDateField
            label="Project Date"
            value={projectDate}
            onChange={setProjectDate}
            helperText="Choose the date that should be shown for this project."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Home feature order
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Optional: choose `1`, `2`, `3`, or `4` to show this project on the home page. Leave empty to hide it there.
            </p>
            <select
              value={homeFeatureOrder}
              onChange={(e) => setHomeFeatureOrder(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-black transition-colors bg-white"
            >
              <option value="">Not featured on home</option>
              <option value="1">Home slot 1</option>
              <option value="2">Home slot 2</option>
              <option value="3">Home slot 3</option>
              <option value="4">Home slot 4</option>
            </select>
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
