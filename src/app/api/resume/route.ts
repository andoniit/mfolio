import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { RESUME_BUCKET, RESUME_OBJECT_PATH } from "@/lib/resume-storage";

export async function GET() {
  const folder = RESUME_OBJECT_PATH.split("/")[0];
  const fileName = RESUME_OBJECT_PATH.split("/")[1];

  const { data: files, error: listError } = await supabaseAdmin.storage
    .from(RESUME_BUCKET)
    .list(folder, { limit: 100 });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 400 });
  }

  const exists = files?.some((f) => f.name === fileName);
  if (!exists) {
    return NextResponse.json({ url: null });
  }

  const { data } = supabaseAdmin.storage.from(RESUME_BUCKET).getPublicUrl(RESUME_OBJECT_PATH);
  const updated = files?.find((f) => f.name === fileName)?.updated_at;
  const cacheBust = updated ? `?v=${encodeURIComponent(updated)}` : "";
  return NextResponse.json({ url: `${data.publicUrl}${cacheBust}` });
}

export async function DELETE() {
  const { error } = await supabaseAdmin.storage.from(RESUME_BUCKET).remove([RESUME_OBJECT_PATH]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
