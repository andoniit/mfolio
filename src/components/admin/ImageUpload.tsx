"use client";

import { supabase } from "@/lib/supabase";

type Props = {
  onUploaded: (url: string) => void;
};

export default function ImageUpload({ onUploaded }: Props) {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("blog-images")
      .getPublicUrl(filePath);

    onUploaded(data.publicUrl);
  };

  return (
    <input
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      onChange={handleUpload}
    />
  );
}