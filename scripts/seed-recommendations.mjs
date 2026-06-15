import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const now = new Date().toISOString();

// Transcribed from the user's LinkedIn recommendations. Seeded as 'approved'
// so they appear on the home page wall immediately.
const seed = [
  {
    name: "Rohan Juvali",
    role: "Managing Director at Mynex Alloys Private Limited",
    message:
      "I had the pleasure of working with Anirudha while he developed the website for our company Mynex Alloys Private Limited. From the very beginning, he demonstrated exceptional technical expertise, creativity, and professionalism.\n\nAnirudha not only understood our requirements thoroughly but also provided valuable insights to enhance the user experience and functionality of our website.",
    color: "purple",
    sort_order: 0,
  },
  {
    name: "Abhishek Deshmukh",
    role: "Assistant Professor at Gogte Institute of Technology, Senior Member IEEE",
    message:
      "Anirudha is a perfect example of an extraordinary student and a volunteer. He was my Student Executive Committee Team member for two years and was the Webmaster and Joint-Secretary. He really changed the way the student chapter website was being handled compared to the earlier years. This volunteering experience also gave him a chance to manage the State level IEEE Bangalore Section Young Professionals Group website for the whole year. He was also the winner of the State Level Website contest. Due to his support to the Student Branch website, we won the state award of the outstanding student branch website for that year.",
    color: "lime",
    sort_order: 1,
  },
  {
    name: "Ar. Deepa Devangmath",
    role: "LEED Green Associate | AIAs | Architect | Researcher | NOMA",
    message:
      "I had a great experience working with Anirudha on my architectural website. I wanted clean graphics and dynamic animations for an interactive user experience, and he delivered brilliantly. The front-end development, often the toughest part, was executed flawlessly. His expertise in blending design with functionality made the website truly stand out. Highly recommend him for top-notch front-end development!",
    color: "red",
    sort_order: 2,
  },
];

async function main() {
  let inserted = 0;
  let skipped = 0;

  for (const rec of seed) {
    // Idempotent: skip if a recommendation with this name already exists.
    const { data: existing, error: findErr } = await supabase
      .from("recommendations")
      .select("id")
      .eq("name", rec.name)
      .maybeSingle();

    if (findErr) {
      console.error(`✗ Lookup failed for "${rec.name}":`, findErr.message);
      process.exitCode = 1;
      return;
    }

    if (existing) {
      console.log(`• Skipped "${rec.name}" (already exists)`);
      skipped++;
      continue;
    }

    const { error: insertErr } = await supabase.from("recommendations").insert({
      ...rec,
      status: "approved",
      approved_at: now,
    });

    if (insertErr) {
      console.error(`✗ Insert failed for "${rec.name}":`, insertErr.message);
      process.exitCode = 1;
      return;
    }

    console.log(`✓ Added "${rec.name}"`);
    inserted++;
  }

  console.log(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
}

main();
