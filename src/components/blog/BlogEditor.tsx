"use client";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

type Props = {
  content?: any;
  onChange: (data: { json: any; html: string }) => void;
};

export default function BlogEditor({ content, onChange }: Props) {
  return (
    // FIX: Removed `overflow-hidden` so dropdowns aren't clipped.
    // FIX: Added `min-h-[500px]`, `relative`, and `z-10` for proper layout.
    <div className="w-full relative z-10 min-h-[500px] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SimpleEditor content={content} onChange={onChange} />
    </div>
  );
}