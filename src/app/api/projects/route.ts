import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRequest } from "@/lib/api-auth";
import { revalidateProjectCaches } from "@/lib/revalidate-project";

type GalleryImageInput = {
  image_url: string;
  alt_text?: string | null;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured");
  const limit = parsePositiveInt(searchParams.get("limit"), 50);
  // `?all=1` with an admin token also returns drafts, for the iOS app.
  const asAdmin = searchParams.get("all") === "1" && (await isAdminRequest(req));

  let query = supabaseAdmin
    .from("projects")
    .select(
      "id, title, slug, description, cover_image_url, project_date, workplace, client_name, home_feature_order, tech_stack, published"
    )
    .is("trashed_at", null);

  if (!asAdmin) query = query.eq("published", true);

  if (featured === "home") {
    query = query
      .not("home_feature_order", "is", null)
      .order("home_feature_order", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false });
  } else {
    query = query.order("project_date", { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
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
    external_url: normalizeExternalUrl(projectFields.external_url),
    home_feature_order: normalizeHomeFeatureOrder(projectFields.home_feature_order),
    content_json: projectFields.content_json ?? null,
    content_html: projectFields.content_html ?? null,
    tech_stack: normalizeStringList(projectFields.tech_stack),
    collaborators: normalizeStringList(projectFields.collaborators),
    workplace: typeof projectFields.workplace === "string" ? projectFields.workplace.trim() || null : null,
    client_name: typeof projectFields.client_name === "string" ? projectFields.client_name.trim() || null : null,
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
