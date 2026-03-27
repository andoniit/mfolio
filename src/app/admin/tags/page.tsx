import { supabaseAdmin } from "@/lib/supabase-admin";
import TagManager from "@/components/admin/TagManager";

export default async function AdminTagsPage() { 
  const { data: tags } = await supabaseAdmin
    .from("tags")
    .select("*")
    .order("name");

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Manage Tags</h1>
      <TagManager tags={tags || []} />
    </main>
  );
}