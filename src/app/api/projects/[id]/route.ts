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
  existingPublishedAt: string | null | undefined
): string | null {
  if (!published) return null;
  if (existingPublishedAt) return existingPublishedAt;
  if (projectDate) return `${projectDate}T12:00:00.000Z`;
  return new Date().toISOString();
}

async function syncProjectImages(projectId: string, images: GalleryImageInput[]) {
  const { error: delError } = await supabaseAdmin
    .from("project_images")
    .delete()
    .eq("project_id", projectId);

  if (delError) throw new Error(delError.message);

  if (!images.length) return;

  const rows = images.map((row, sort_order) => ({
    project_id: projectId,
    image_url: row.image_url,
    alt_text: row.alt_text?.trim() || null,
    sort_order,
  }));

  const { error: insError } = await supabaseAdmin.from("project_images").insert(rows);
  if (insError) throw new Error(insError.message);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;
  const { gallery_images = [], ...rest } = body;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("projects")
    .select("trashed_at, published_at")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (existing.trashed_at) {
    return NextResponse.json(
      { error: "Project is in trash. Restore it before editing." },
      { status: 400 }
    );
  }

  const published = Boolean(rest.published);
  const projectDate = rest.project_date || null;

  const projectData = {
    title: rest.title,
    slug: rest.slug,
    description: rest.description ?? null,
    content_json: rest.content_json ?? null,
    content_html: rest.content_html ?? null,
    project_date: projectDate,
    cover_image_url: rest.cover_image_url || null,
    published,
    published_at: publishedAtForSave(published, projectDate, existing.published_at),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update(projectData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await syncProjectImages(id, gallery_images as GalleryImageInput[]);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update gallery images" },
      { status: 400 }
    );
  }

  revalidateProjectCaches(data?.slug);
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: project, error: fetchError } = await supabaseAdmin
    .from("projects")
    .select("id, trashed_at, slug")
    .eq("id", id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.trashed_at) {
    const { error } = await supabaseAdmin
      .from("projects")
      .update({
        trashed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidateProjectCaches(project.slug);
    return NextResponse.json({ success: true, action: "trashed" });
  }

  const { error } = await supabaseAdmin.from("projects").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateProjectCaches(project.slug);
  return NextResponse.json({ success: true, action: "deleted_permanently" });
}
