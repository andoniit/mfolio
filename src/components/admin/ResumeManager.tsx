"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RESUME_BUCKET, RESUME_OBJECT_PATH } from "@/lib/resume-storage";
import { adminFetch } from "@/lib/admin-fetch";

// --- Icons ---
const PdfIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <path d="M16 13H8"></path>
    <path d="M16 17H8"></path>
    <path d="M10 9H8"></path>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function ResumeManager() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resume");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUrl(null);
        return;
      }
      setUrl(typeof data.url === "string" ? data.url : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    const maxMb = 8;
    if (file.size > maxMb * 1024 * 1024) {
      alert(`File is too large. Max size is ${maxMb} MB.`);
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.storage.from(RESUME_BUCKET).upload(RESUME_OBJECT_PATH, file, {
        upsert: true,
        cacheControl: "60",
        contentType: "application/pdf",
      });

      if (error) {
        alert(error.message);
        return;
      }

      await refresh();
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!url) return;
    if (!confirm("Remove the resume from the site? Visitors will no longer see the download link.")) {
      return;
    }

    setRemoving(true);
    try {
      const res = await adminFetch("/api/resume", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || "Failed to remove resume");
        return;
      }
      setUrl(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-8 max-w-2xl">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Resume Management</h2>
        <p className="text-[14px] text-gray-500 mt-1.5 leading-relaxed">
          Upload a PDF version of your resume. The <span className="font-medium text-gray-700">"View My Resume"</span> button will automatically appear on your site's header when a file is active.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-sm font-medium text-gray-500">Loading your resume...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Status Area */}
          {url ? (
            <div className="flex items-center justify-between bg-gray-50/80 border border-gray-200 rounded-xl p-4 transition-all hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <PdfIcon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Active Resume.pdf</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Live on website
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <ExternalLinkIcon />
                  View
                </a>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removing ? <Spinner /> : <TrashIcon />}
                  {removing ? "Removing" : "Remove"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50/50 border border-dashed border-gray-300 rounded-xl">
              <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-3">
                <PdfIcon />
              </div>
              <p className="text-sm font-medium text-gray-900">No resume uploaded</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[250px] text-center">
                Your website header currently does not display a resume button.
              </p>
            </div>
          )}

          {/* Upload Action */}
          <div className="pt-4 border-t border-gray-100">
            <label 
              className={`relative flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-gray-800 transition-all shadow-sm ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-2">
                {uploading ? <Spinner /> : <UploadIcon />}
                <span>{uploading ? "Uploading PDF..." : url ? "Replace with new PDF" : "Upload PDF Resume"}</span>
              </div>
              
              {/* Hidden file input */}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFile}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </label>
            <p className="text-xs text-gray-400 mt-3 sm:text-left text-center">
              Maximum file size: 8MB. Only .pdf files are supported.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}