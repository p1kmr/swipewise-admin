import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ClipboardCheck } from "lucide-react";
import { listContent, publishCard, publishCards } from "../services/contentService.js";
import { VERDICT_META } from "../constants/enums.js";

function truncate(text, n = 70) {
  if (!text) return "";
  return text.length > n ? `${text.slice(0, n)}…` : text;
}

export default function ReviewPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setItems(await listContent());
    } catch (err) {
      setError(err.message || "Could not load content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const drafts = items.filter((i) => !i.approval?.published);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === drafts.length ? new Set() : new Set(drafts.map((d) => d.id))
    );
  }

  async function handlePublish(id) {
    setBusy(true);
    setError("");
    try {
      await publishCard(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await refresh();
    } catch (err) {
      setError(err.message || "Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublishSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    setError("");
    try {
      await publishCards([...selected]);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      setError(err.message || "Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Review &amp; publish</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {drafts.length} draft{drafts.length === 1 ? "" : "s"} pending · {items.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-light-border px-3 py-2 text-sm transition hover:border-primary dark:border-surface-dark-border"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={handlePublishSelected}
            disabled={busy || selected.size === 0}
            className="btn-primary"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Publish selected ({selected.size})
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-verdict-dont_trust dark:bg-red-950/30">
          {error}
        </p>
      ) : null}

      <div className="card-surface overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-gray-500">
            <ClipboardCheck size={24} />
            No cards yet. Upload some on the Upload page.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-light-border text-xs uppercase text-gray-500 dark:border-surface-dark-border dark:text-gray-400">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={drafts.length > 0 && selected.size === drafts.length}
                    onChange={toggleAll}
                    aria-label="Select all drafts"
                  />
                </th>
                <th className="p-3">Scenario</th>
                <th className="p-3">Verdict</th>
                <th className="p-3">Jurisdiction</th>
                <th className="p-3">Lang</th>
                <th className="p-3">Skill</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const published = item.approval?.published;
                const verdict = VERDICT_META[item.verdict] || {
                  label: item.verdict || "—",
                  badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                };
                return (
                  <tr
                    key={item.id}
                    className="border-b border-surface-light-border last:border-0 dark:border-surface-dark-border"
                  >
                    <td className="p-3">
                      {!published ? (
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggle(item.id)}
                          aria-label="Select card"
                        />
                      ) : null}
                    </td>
                    <td className="max-w-xs p-3">{truncate(item.scenario_text)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${verdict.badge}`}
                      >
                        {verdict.label}
                      </span>
                    </td>
                    <td className="p-3">{item.jurisdiction}</td>
                    <td className="p-3">{item.language_code}</td>
                    <td className="p-3 text-gray-500 dark:text-gray-400">
                      {item.skill_tested || "—"}
                    </td>
                    <td className="p-3">
                      {published ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-verdict-trust">
                          <CheckCircle2 size={14} /> Published
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-verdict-verify_first">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!published ? (
                        <button
                          type="button"
                          onClick={() => handlePublish(item.id)}
                          disabled={busy}
                          className="rounded-lg border border-surface-light-border px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary dark:border-surface-dark-border"
                        >
                          Publish
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
