import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/api-auth";
import { revalidateProjectCaches } from "@/lib/revalidate-project";

type GalleryImageInput = {
  image_url: string;
  alt_text?: string | null;
};

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    return url.toString();
  } catch {
    throw new Error("Project link must be a valid http or https URL");
  }
}

function normalizeHomeFeatureOrder(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 4) {
    throw new Error("Home feature order must be 1, 2, 3, 4, or empty");
  }
  return parsed;
}

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

/**
 * One project in full — body, gallery and all — for the iOS project editor.
 * The web edit page reads Supabase directly, so nothing exposed this before.
 * Owner-only, since it returns drafts. `gallery_images` comes back in exactly
 * the shape PUT takes, so a load-then-save round trip can't reorder or drop
 * images.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const [{ data: project, error }, { data: images, error: imagesError }] = await Promise.all([
    supabaseAdmin.from("projects").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin
      .from("project_images")
      .select("image_url, alt_text, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (error || imagesError) {
    return NextResponse.json({ error: (error ?? imagesError)?.message }, { status: 400 });
  }
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...project,
    gallery_images: (images ?? []).map((row) => ({
      image_url: row.image_url,
      alt_text: row.alt_text || "",
    })),
  });
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

  // These throw on bad input. Uncaught, that surfaced as a bare 500 instead of
  // the sentence explaining what to fix.
  let externalUrl: string | null;
  let homeFeatureOrder: number | null;
  try {
    externalUrl = normalizeExternalUrl(rest.external_url);
    homeFeatureOrder = normalizeHomeFeatureOrder(rest.home_feature_order);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid project details" },
      { status: 400 }
    );
  }

  const projectData = {
    title: rest.title,
    slug: rest.slug,
    description: rest.description ?? null,
    external_url: externalUrl,
    home_feature_order: homeFeatureOrder,
    content_json: rest.content_json ?? null,
    content_html: rest.content_html ?? null,
    tech_stack: normalizeStringList(rest.tech_stack),
    collaborators: normalizeStringList(rest.collaborators),
    workplace: typeof rest.workplace === "string" ? rest.workplace.trim() || null : null,
    client_name: typeof rest.client_name === "string" ? rest.client_name.trim() || null : null,
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

/**
 * Partial update — the publish flag only. Separate from PUT, which rewrites the
 * gallery from the request body and would drop every image if used to flip one
 * boolean.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { published?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.published !== "boolean") {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const update: Record<string, unknown> = { published: body.published };

  // Stamp the publish date only the first time. Re-publishing something that
  // already has a date must keep it, or the ordering silently changes.
  if (body.published) {
    const { data: current } = await supabaseAdmin
      .from("projects")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (!current?.published_at) update.published_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update(update)
    .eq("id", id)
    .is("trashed_at", null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
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
