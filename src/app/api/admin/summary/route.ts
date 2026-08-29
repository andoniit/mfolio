import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/api-auth";

/**
 * Every count the dashboard shows, in one request.
 *
 * The app used to fetch seven list endpoints and count the rows client-side,
 * which meant downloading entire blog post bodies and base64 avatars — ~176KB
 * and seven token verifications — to render a handful of numbers.
 *
 * These are `head: true` queries, so Postgres returns the count and no rows at
 * all.
 */
export async function GET(req: Request) {
  const auth = await verifyAdmin(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const live = () => supabaseAdmin.from("outside_of_work_items").select("*", { count: "exact", head: true });
  const wall = () => supabaseAdmin.from("photo_wall_posts").select("*", { count: "exact", head: true });
  const recs = () => supabaseAdmin.from("recommendations").select("*", { count: "exact", head: true });
  const projects = () => supabaseAdmin.from("projects").select("*", { count: "exact", head: true });
  const posts = () => supabaseAdmin.from("posts").select("*", { count: "exact", head: true });
  const experiences = () => supabaseAdmin.from("experiences").select("*", { count: "exact", head: true });

  const [
    outsideLive, outsideHidden,
    wallPending, wallLive,
    recsPending, recsLive,
    projectsLive, projectsDraft,
    postsLive, postsDraft,
    work, volunteer,
  ] = await Promise.all([
    live().eq("is_published", true),
    live().eq("is_published", false),
    wall().eq("status", "pending"),
    wall().eq("status", "approved"),
    recs().eq("status", "pending"),
    recs().eq("status", "approved"),
    projects().is("trashed_at", null).eq("published", true),
    projects().is("trashed_at", null).eq("published", false),
    posts().is("trashed_at", null).eq("published", true),
    posts().is("trashed_at", null).eq("published", false),
    experiences().is("trashed_at", null).eq("category", "work"),
    experiences().is("trashed_at", null).eq("category", "volunteer"),
  ]);

  const n = (r: { count: number | null }) => r.count ?? 0;

  return NextResponse.json({
    outsideLive: n(outsideLive),
    outsideHidden: n(outsideHidden),
    photoWallPending: n(wallPending),
    photoWallLive: n(wallLive),
    recommendationsPending: n(recsPending),
    recommendationsLive: n(recsLive),
    projectsLive: n(projectsLive),
    projectsDraft: n(projectsDraft),
    postsLive: n(postsLive),
    postsDraft: n(postsDraft),
    workLive: n(work),
    volunteerLive: n(volunteer),
  });
}
