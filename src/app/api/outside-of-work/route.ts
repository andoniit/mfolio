import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRequest } from "@/lib/api-auth";
import {
  groupOutsideItems,
  parseOutsideItemInput,
  type PublicOutsideItem,
} from "@/lib/outside-of-work";

const PUBLIC_COLUMNS =
  "id, kind, title, subtitle, description, image_url, link_url, rating, game_status, tags";

// Public: everything published, grouped into the three bento tiles.
// `?all=1` with an admin token also returns hidden items, for the dashboard and
// the iOS app — the public site never asks for it.
export async function GET(req: Request) {
  const wantsAll = new URL(req.url).searchParams.get("all") === "1";
  const asAdmin = wantsAll && (await isAdminRequest(req));

  // Widened to `string` so supabase-js does not try to parse the column list
  // as a literal type (it cannot handle a conditional one).
  const columns: string = asAdmin ? "*" : PUBLIC_COLUMNS;
  let query = supabaseAdmin.from("outside_of_work_items").select(columns);

  if (!asAdmin) query = query.eq("is_published", true);

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // The column list is dynamic, so supabase-js cannot infer the row type here.
  const items = (data ?? []) as unknown as PublicOutsideItem[];
  return NextResponse.json(groupOutsideItems(items));
}

// Admin: add a photo, food spot, or game.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseOutsideItemInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("outside_of_work_items")
    .insert(parsed.value)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/outside-of-work");
  revalidatePath("/admin");
  revalidatePath("/");

  return NextResponse.json(data);
}
