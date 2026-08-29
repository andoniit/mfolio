"use client";

import { supabase } from "./supabase";

/**
 * `fetch` for admin endpoints. Attaches the signed-in user's Supabase access
 * token, which `src/middleware.ts` requires for any write to `/api`.
 *
 * Public reads and visitor submissions should keep using plain `fetch` — they
 * are allowed through without a token.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
