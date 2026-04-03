import type { PostgrestError } from "@supabase/supabase-js";

/** Log full Supabase error for server debugging (Vercel / local terminal). */
export function logNewsletterDbError(context: string, err: PostgrestError | null) {
  if (!err) return;
  console.error(`[newsletter] ${context}:`, err.code, err.message, err.details, err.hint);
}

export function newsletterTableMissingMessage(err: PostgrestError | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  if (err.code === "PGRST205") return true;
  if (err.code === "42P01") return true;
  if (msg.includes("newsletter_subscribers") && (msg.includes("does not exist") || msg.includes("schema cache"))) {
    return true;
  }
  return false;
}

export function userFacingNewsletterError(err: PostgrestError | null): string {
  if (newsletterTableMissingMessage(err)) {
    return "Newsletter isn’t set up yet. In Supabase, run the SQL migration that creates the newsletter_subscribers table.";
  }
  return "Something went wrong. Please try again.";
}
