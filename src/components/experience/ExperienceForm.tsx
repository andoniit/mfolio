"use client";

import { useState } from "react";
import AdminDateField from "@/components/admin/AdminDateField";
import { EMPLOYMENT_TYPES } from "@/lib/experience-payload";

type ExperienceFormProps = {
  initialData?: any;
  experienceId?: string;
  category?: "work" | "volunteer";
  listPath?: string;
  trashPath?: string;
  noun?: string;
};

const getDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ExperienceForm({
  initialData,
  experienceId,
  category,
  listPath = "/admin/experience",
  trashPath = "/admin/experience/trash",
  noun = "experience",
}: ExperienceFormProps) {
  const effectiveCategory: "work" | "volunteer" =
    initialData?.category || category || "work";
  const isVolunteer = effectiveCategory === "volunteer";
  const [title, setTitle] = useState(initialData?.title || "");
  const [company, setCompany] = useState(initialData?.company || "");
  const [companyUrl, setCompanyUrl] = useState(initialData?.company_url || "");
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || "");
  const [sortOrder, setSortOrder] = useState(
    initialData?.sort_order != null ? String(initialData.sort_order) : "0"
  );
  const [location, setLocation] = useState(initialData?.location || "");
  const [employmentType, setEmploymentType] = useState(initialData?.employment_type || "");
  const [startDate, setStartDate] = useState(getDateInputValue(initialData?.start_date));
  const [endDate, setEndDate] = useState(getDateInputValue(initialData?.end_date));
  const [isCurrent, setIsCurrent] = useState(Boolean(initialData?.is_current));
  const [description, setDescription] = useState(initialData?.description || "");
  const [highlights, setHighlights] = useState<string[]>(() =>
    parseStringList(initialData?.highlights)
  );
  const [highlightInput, setHighlightInput] = useState("");
  const [skills, setSkills] = useState<string[]>(() => parseStringList(initialData?.skills));
  const [skillInput, setSkillInput] = useState("");
  const [published, setPublished] = useState(Boolean(initialData?.published));
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(experienceId);

  const addHighlight = () => {
    const t = highlightInput.trim();
    if (!t) return;
    setHighlights((prev) => [...prev, t]);
    setHighlightInput("");
  };

  const removeHighlightAt = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const moveHighlight = (index: number, dir: -1 | 1) => {
    setHighlights((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const addSkill = () => {
    const t = skillInput.trim();
    if (!t) return;
    setSkills((prev) => [...prev, t]);
    setSkillInput("");
  };

  const removeSkillAt = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please add a role / job title.");
      return;
    }
    if (!company.trim()) {
      alert("Please add a company / organization.");
      return;
    }
    if (!isVolunteer && !startDate) {
      alert("Please choose a start date.");
      return;
    }
    if (!isCurrent && startDate && endDate && endDate < startDate) {
      alert("End date cannot be before the start date.");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      company: company.trim(),
      company_url: companyUrl.trim() || null,
      logo_url: logoUrl.trim() || null,
      sort_order: sortOrder,
      location: location.trim() || null,
      employment_type: employmentType || null,
      start_date: startDate || null,
      end_date: isCurrent ? null : endDate || null,
      is_current: isCurrent,
      description: description.trim() || null,
      highlights,
      skills,
      category: effectiveCategory,
      published,
    };

    try {
      const res = await fetch(
        isEditing ? `/api/experiences/${experienceId}` : "/api/experiences",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        alert(result?.error || `Failed to save ${noun}`);
        return;
      }

      window.location.href = listPath;
    } catch (error) {
      console.error(error);
      alert(`Something went wrong while saving the ${noun}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!experienceId) return;

    const ok = confirm(`Are you sure you want to move this ${noun} to the trash?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/experiences/${experienceId}`, { method: "DELETE" });
      const result = await res.json().catch(() => null);

      if (!res.ok) {
        alert(result?.error || `Failed to move ${noun} to trash`);
        return;
      }

      window.location.href = trashPath;
    } catch (error) {
      console.error(error);
      alert(`Something went wrong while moving the ${noun} to trash.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 pb-20">
      <div className="flex-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <input
            type="text"
            placeholder="Role / job title (e.g. Senior Frontend Developer)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl font-bold text-gray-900 placeholder:text-gray-300 outline-none bg-transparent"
            required
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company / organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Inc."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, Berlin, Germany"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-black transition-colors bg-white text-gray-800"
              >
                <option value="">Not specified</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company link</label>
              <input
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://company.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company logo</label>
            <p className="text-xs text-gray-500 mb-2">
              A full URL or a local path like <code>/logo/company.jpeg</code>.
            </p>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0 bg-gray-50"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border border-dashed border-gray-200 shrink-0 flex items-center justify-center text-gray-300 text-xs">
                  Logo
                </div>
              )}
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/logo/company.jpeg"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
          <p className="text-xs text-gray-500 mb-4">
            A short summary of the role and what you did.
          </p>
          <textarea
            placeholder="Describe your role, responsibilities, and impact…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-4 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all min-h-[120px] resize-y"
          />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Highlights</label>
          <p className="text-xs text-gray-500 mb-4">
            Add key achievements or responsibilities one at a time. Order is preserved.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={highlightInput}
              onChange={(e) => setHighlightInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHighlight();
                }
              }}
              placeholder="e.g. Led migration to Next.js, cutting load time by 40%"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
            <button
              type="button"
              onClick={addHighlight}
              className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 shrink-0"
            >
              Add
            </button>
          </div>
          {highlights.length > 0 ? (
            <ul className="space-y-2">
              {highlights.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50/80 text-sm text-gray-800"
                >
                  <span className="flex-1 min-w-0">{item}</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveHighlight(index, -1)}
                      disabled={index === 0}
                      className="text-xs px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHighlight(index, 1)}
                      disabled={index === highlights.length - 1}
                      className="text-xs px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHighlightAt(index)}
                      className="text-xs text-red-600 px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No highlights yet.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Skills / tools</label>
          <p className="text-xs text-gray-500 mb-4">
            Add one skill or tool at a time (e.g. React, Figma, AWS).
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. TypeScript"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 shrink-0"
            >
              Add
            </button>
          </div>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="inline-flex items-center gap-1.5 border border-gray-200 rounded-full pl-3 pr-2 py-1 bg-gray-50 text-sm text-gray-800"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeSkillAt(index)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label={`Remove ${item}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No skills yet.</p>
          )}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Display order</label>
            <p className="text-xs text-gray-500 mb-2">
              Lower numbers appear first on your site.
            </p>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <h3 className="font-semibold text-gray-900">Dates</h3>

          <AdminDateField
            label="Start date"
            value={startDate}
            onChange={setStartDate}
            helperText="When you started this role."
          />

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="font-medium text-sm text-gray-700">I currently work here</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black" />
            </label>
          </div>

          {!isCurrent ? (
            <AdminDateField
              label="End date"
              value={endDate}
              onChange={setEndDate}
              helperText="When this role ended."
            />
          ) : (
            <p className="text-sm text-gray-500 px-1">
              End date is hidden while &ldquo;currently work here&rdquo; is on.
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : isEditing ? `Update ${noun}` : `Create ${noun}`}
          </button>

          {experienceId && (
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
