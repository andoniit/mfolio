import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateProjectCaches } from "@/lib/revalidate-project";

type GalleryImageInput = {
  image_url: string;
  alt_text?: string | null;
};

function publishedAtForSave(
  published: boolean,
  projectDate: string | null | undefined,
  existingPublishedAt?: string | null
): string | null {
  if (!published) return null;
  if (existingPublishedAt) return existingPublishedAt;
  if (projectDate) return `${projectDate}T12:00:00.000Z`;
  return new Date().toISOString();
}

async function insertProjectImages(projectId: string, images: GalleryImageInput[]) {
  if (!images.length) return;
  const rows = images.map((row, sort_order) => ({
    project_id: projectId,
    image_url: row.image_url,
    alt_text: row.alt_text?.trim() || null,
    sort_order,
  }));
  const { error } = await supabaseAdmin.from("project_images").insert(rows);
  if (error) throw new Error(error.message);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { gallery_images = [], ...projectFields } = body;

  const published = Boolean(projectFields.published);
  const projectDate = projectFields.project_date || null;

  const payload = {
    title: projectFields.title,
    slug: projectFields.slug,
    description: projectFields.description ?? null,
    content_json: projectFields.content_json ?? null,
    content_html: projectFields.content_html ?? null,
    project_date: projectDate,
    cover_image_url: projectFields.cover_image_url || null,
    published,
    published_at: publishedAtForSave(published, projectDate, null),
    updated_at: new Date().toISOString(),
  };

  const { data: project, error } = await supabaseAdmin
    .from("projects")
    .insert([payload])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await insertProjectImages(project.id, gallery_images as GalleryImageInput[]);
  } catch (e: unknown) {
    await supabaseAdmin.from("projects").delete().eq("id", project.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save gallery images" },
      { status: 400 }
    );
  }

  revalidateProjectCaches(project?.slug);
  return NextResponse.json(project);
}
