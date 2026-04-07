"use client";

import { useMemo, useRef } from "react";

type AdminDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
};

const formatDisplayDate = (value: string) => {
  if (!value) {
    return "No date selected";
  }

  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

export default function AdminDateField({
  label,
  value,
  onChange,
  helperText,
}: AdminDateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = useMemo(() => formatDisplayDate(value), [value]);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={() => onChange(new Date().toISOString().split("T")[0])}
          className="text-xs font-medium text-gray-500 hover:text-black transition-colors"
        >
          Use today
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={openPicker}
          className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left hover:bg-gray-50 transition-colors"
          aria-label={`Select ${label.toLowerCase()}`}
        >
          <div>
            <p className="text-sm font-medium text-gray-900">{displayValue}</p>
            {helperText ? (
              <p className="text-xs text-gray-500 mt-1">{helperText}</p>
            ) : null}
          </div>

          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M3 10h18" />
            </svg>
          </span>
        </button>

        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm outline-none focus:border-black transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
