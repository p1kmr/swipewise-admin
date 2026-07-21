import { CheckCircle2, Shield } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="card-surface p-6">
        <div className="mb-4 inline-flex rounded-full bg-brand-gradient p-3 text-white">
          <Shield size={24} />
        </div>
        <h2 className="text-xl font-semibold">POC stack is ready</h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
          You are signed in via the Vercel API. Upload Excel cards, review drafts, publish to MongoDB,
          or generate new cards from a source PDF with Gemini.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          "Single admin login (server env credentials)",
          "MongoDB Atlas via /api/content routes",
          "Light/dark theme with persistence",
          "Protected routes and mobile-friendly app shell",
        ].map((item) => (
          <div key={item} className="card-surface flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 shrink-0 text-verdict-trust" size={18} />
            <p className="text-sm">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
