import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRequest } from "@/lib/api-auth";
import {
  parsePhotoWallInput,
  parsePhotoDataUrl,
  PHOTO_WALL_BUCKET,
  PHOTO_WALL_PREFIX,
  type PublicPhotoWallPost,
} from "@/lib/photo-wall";

const PUBLIC_COLUMNS = "id, image_url, message, author_name, created_at";

function missingConfig() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

// Public: approved Polaroids for the home page wall.
// `?status=all` with an admin token returns every submission so the owner can
// review what is still pending.
export async function GET(req: Request) {
  const wantsAll = new URL(req.url).searchParams.get("status") === "all";
  const asAdmin = wantsAll && (await isAdminRequest(req));

  const columns: string = asAdmin ? "*" : PUBLIC_COLUMNS;
  let query = supabaseAdmin.from("photo_wall_posts").select(columns);

  if (!asAdmin) query = query.eq("status", "approved");

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json((data ?? []) as unknown as PublicPhotoWallPost[]);
}

// Public: submit a Polaroid + caption. Stored as 'pending' until approved.
// The photo is uploaded server-side with the service role key, so visitors never
// touch storage directly and the bucket needs no public-write policy.
export async function POST(req: Request) {
  if (missingConfig()) {
    return NextResponse.json(
      {
        ok: false,
        error: "config",
        message: "Server configuration error. Please try again later.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = parsePhotoWallInput(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: "invalid_input", message: parsed.error },
      { status: 400 }
    );
  }

  const photo = parsePhotoDataUrl(parsed.value.photo);
  if (!photo.ok) {
    return NextResponse.json(
      { ok: false, error: "invalid_input", message: photo.error },
      { status: 400 }
    );
  }

  const storagePath = `${PHOTO_WALL_PREFIX}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${photo.value.ext}`;

  const upload = await supabaseAdmin.storage
    .from(PHOTO_WALL_BUCKET)
    .upload(storagePath, photo.value.bytes, {
      contentType: photo.value.mime,
      cacheControl: "31536000",
      upsert: false,
    });

  if (upload.error) {
    console.error("[photo-wall] upload failed", upload.error);
    return NextResponse.json(
      { ok: false, error: "server", message: "Could not upload your photo. Please try again." },
      { status: 500 }
    );
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from(PHOTO_WALL_BUCKET)
    .getPublicUrl(storagePath);

  const { data, error } = await supabaseAdmin
    .from("photo_wall_posts")
    .insert({
      image_url: publicUrl.publicUrl,
      storage_path: storagePath,
      message: parsed.value.message,
      author_name: parsed.value.author_name,
      status: "pending",
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    console.error("[photo-wall] insert failed", error);
    // Don't leave the uploaded file orphaned if the row never landed.
    await supabaseAdmin.storage.from(PHOTO_WALL_BUCKET).remove([storagePath]);
    return NextResponse.json(
      { ok: false, error: "server", message: "Could not save your photo. Please try again." },
      { status: 500 }
    );
  }

  revalidatePath("/admin/photo-wall");
  revalidatePath("/admin");

  return NextResponse.json({
    ok: true,
    message: "Thanks! Your Polaroid is pending review and goes up once approved.",
    post: data as PublicPhotoWallPost,
  });
}
