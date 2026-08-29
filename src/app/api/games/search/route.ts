import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";

/**
 * Game lookup for the admin forms: type a title, get covers back.
 *
 * RAWG when `RAWG_API_KEY` is set, Steam otherwise. Steam needs no key but only
 * knows what it sells — searching "astro bot" there returns a Sackboy costume
 * and "ghost of yotei" returns nothing, so console exclusives need RAWG.
 *
 * Proxied rather than called from the client so the key stays on the server,
 * and admin-gated so this isn't an open search proxy for anyone who finds it.
 */

export type GameHit = {
  id: string;
  name: string;
  image: string | null;
  released: string | null;
  platforms: string[];
  source: "rawg" | "steam";
};

const RAWG_ENDPOINT = "https://api.rawg.io/api/games";
const STEAM_ENDPOINT = "https://store.steampowered.com/api/storesearch/";

type RawgGame = {
  id?: number;
  name?: string;
  background_image?: string | null;
  released?: string | null;
  platforms?: { platform?: { name?: string } }[] | null;
};

type SteamItem = { id?: number; name?: string; tiny_image?: string | null };

async function searchRawg(query: string, key: string): Promise<GameHit[]> {
  const url = `${RAWG_ENDPOINT}?key=${encodeURIComponent(key)}&search=${encodeURIComponent(
    query
  )}&page_size=8&search_precise=true`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`RAWG responded ${res.status}`);

  const body = (await res.json()) as { results?: RawgGame[] };
  return (body.results ?? []).flatMap((g) => {
    if (!g.name) return [];
    return [
      {
        id: `rawg-${g.id ?? g.name}`,
        name: g.name,
        image: g.background_image ?? null,
        released: g.released ?? null,
        platforms: (g.platforms ?? [])
          .map((p) => p?.platform?.name)
          .filter((n): n is string => Boolean(n)),
        source: "rawg" as const,
      },
    ];
  });
}

async function searchSteam(query: string): Promise<GameHit[]> {
  const url = `${STEAM_ENDPOINT}?term=${encodeURIComponent(query)}&cc=us&l=en`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Steam responded ${res.status}`);

  const body = (await res.json()) as { items?: SteamItem[] };
  return (body.items ?? []).flatMap((it) => {
    if (!it.name) return [];
    // The search payload only carries a thumbnail; the header image is a
    // predictable path off the app id and looks far better as cover art.
    const image = it.id
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${it.id}/header.jpg`
      : it.tiny_image ?? null;
    return [
      {
        id: `steam-${it.id ?? it.name}`,
        name: it.name,
        image,
        released: null,
        platforms: ["PC"],
        source: "steam" as const,
      },
    ];
  });
}

export async function GET(req: Request) {
  const auth = await verifyAdmin(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const query = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (query.length < 2) {
    return NextResponse.json({ results: [], source: null });
  }

  const key = process.env.RAWG_API_KEY?.trim();

  if (key) {
    try {
      const results = await searchRawg(query, key);
      // An empty RAWG answer is a real answer; only fall through on failure.
      return NextResponse.json({ results, source: "rawg" });
    } catch (error) {
      console.error("[games/search] RAWG failed, falling back to Steam", error);
    }
  }

  try {
    const results = await searchSteam(query);
    return NextResponse.json({
      results,
      source: "steam",
      note: key
        ? "RAWG was unavailable, so these came from Steam."
        : "Set RAWG_API_KEY for console titles — Steam only knows what it sells.",
    });
  } catch (error) {
    console.error("[games/search] Steam failed", error);
    return NextResponse.json(
      { error: "Game search is unavailable right now." },
      { status: 502 }
    );
  }
}
