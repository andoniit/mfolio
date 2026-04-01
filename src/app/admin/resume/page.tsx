import ResumeManager from "@/components/admin/ResumeManager";

export const dynamic = "force-dynamic";

export default function AdminResumePage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Resume</h1>
      <ResumeManager />
    </main>
  );
}
