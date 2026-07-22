import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  Sparkles,
  MessageSquare,
  Calendar,
  Globe,
  ClipboardCheck,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { listContent } from "../services/contentService.js";
import { listScripts } from "../services/scriptService.js";
import { listQotd } from "../services/qotdService.js";
import { listConfigs } from "../services/configService.js";
import { ROUTES } from "../constants/routes.js";

const QUICK_LINKS = [
  { to: ROUTES.UPLOAD, label: "Upload questions", icon: Upload },
  { to: ROUTES.GENERATE, label: "Generate with AI", icon: Sparkles },
  { to: ROUTES.SCRIPTS, label: "Scripts", icon: MessageSquare },
  { to: ROUTES.QOTD, label: "QOTD", icon: Calendar },
  { to: ROUTES.JURISDICTIONS, label: "Jurisdictions", icon: Globe },
  { to: ROUTES.REVIEW, label: "Review & publish", icon: ClipboardCheck },
];

function countDrafts(items) {
  return items.filter((i) => !i.approval?.published).length;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ cards: 0, scripts: 0, qotd: 0, liveJurisdictions: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cards, scripts, qotd, configs] = await Promise.all([
          listContent(),
          listScripts(),
          listQotd(),
          listConfigs(),
        ]);
        if (cancelled) return;
        setStats({
          cards: cards.filter((c) => (c.status || "Draft") !== "Active").length,
          scripts: countDrafts(scripts),
          qotd: countDrafts(qotd),
          liveJurisdictions: configs.filter((c) => c.active).length,
        });
      } catch {
        /* overview is best-effort */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalDrafts = stats.cards + stats.scripts + stats.qotd;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Drafts waiting for review and quick links to common tasks.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Question drafts", value: stats.cards },
            { label: "Script drafts", value: stats.scripts },
            { label: "QOTD drafts", value: stats.qotd },
            { label: "Live jurisdictions", value: stats.liveJurisdictions },
          ].map(({ label, value }) => (
            <div key={label} className="card-surface p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {totalDrafts > 0 ? (
        <Link
          to={ROUTES.REVIEW}
          className="card-surface flex items-center justify-between gap-3 p-4 transition hover:border-primary dark:hover:border-primary"
        >
          <div>
            <p className="font-medium">{totalDrafts} draft{totalDrafts === 1 ? "" : "s"} pending review</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review and publish when ready.</p>
          </div>
          <ArrowRight size={20} className="shrink-0 text-primary" />
        </Link>
      ) : null}

      <div className="card-surface p-4">
        <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Quick links</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 rounded-lg border border-surface-light-border px-3 py-2.5 text-sm transition hover:border-primary hover:text-primary dark:border-surface-dark-border"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
