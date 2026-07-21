import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ClipboardCheck } from "lucide-react";
import { listContent, publishCards } from "../services/contentService.js";
import { listScripts, publishScripts } from "../services/scriptService.js";
import { listQotd, publishQotdItems } from "../services/qotdService.js";
import { VERDICT_META } from "../constants/enums.js";

const TABS = [
  { id: "cards", label: "Cards" },
  { id: "scripts", label: "Scripts" },
  { id: "qotd", label: "QOTD" },
];

function truncate(text, n = 70) {
  if (!text) return "";
  return text.length > n ? `${text.slice(0, n)}…` : text;
}

export default function ReviewPage() {
  const [tab, setTab] = useState("cards");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  async function refresh() {
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      if (tab === "cards") setItems(await listContent());
      else if (tab === "scripts") setItems(await listScripts());
      else setItems(await listQotd());
    } catch (err) {
      setError(err.message || "Could not load items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [tab]);

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

  async function publishIds(ids) {
    if (tab === "cards") await publishCards(ids);
    else if (tab === "scripts") await publishScripts(ids);
    else await publishQotdItems(ids);
  }

  async function handlePublish(id) {
    setBusy(true);
    setError("");
    try {
      await publishIds([id]);
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
      await publishIds([...selected]);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      setError(err.message || "Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  const emptyMessage =
    tab === "cards"
      ? "No cards yet. Upload some on the Upload page."
      : tab === "scripts"
        ? "No scripts yet. Upload JSON on the Scripts page."
        : "No questions yet. Upload Excel on the QOTD page.";

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

      <div className="flex gap-1 rounded-lg border border-surface-light-border p-1 dark:border-surface-dark-border">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-surface-dark-bg"
            }`}
          >
            {label}
          </button>
        ))}
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
            {emptyMessage}
          </div>
        ) : tab === "cards" ? (
          <CardsTable
            items={items}
            drafts={drafts}
            selected={selected}
            busy={busy}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onPublish={handlePublish}
          />
        ) : tab === "scripts" ? (
          <ScriptsTable
            items={items}
            drafts={drafts}
            selected={selected}
            busy={busy}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onPublish={handlePublish}
          />
        ) : (
          <QotdTable
            items={items}
            drafts={drafts}
            selected={selected}
            busy={busy}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onPublish={handlePublish}
          />
        )}
      </div>
    </div>
  );
}

function StatusCell({ published }) {
  return published ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-verdict-trust">
      <CheckCircle2 size={14} /> Published
    </span>
  ) : (
    <span className="text-xs font-medium text-verdict-verify_first">Draft</span>
  );
}

function PublishCell({ published, id, busy, onPublish }) {
  if (published) return null;
  return (
    <button
      type="button"
      onClick={() => onPublish(id)}
      disabled={busy}
      className="rounded-lg border border-surface-light-border px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary dark:border-surface-dark-border"
    >
      Publish
    </button>
  );
}

function CardsTable({ items, drafts, selected, busy, onToggle, onToggleAll, onPublish }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-surface-light-border text-xs uppercase text-gray-500 dark:border-surface-dark-border dark:text-gray-400">
        <tr>
          <th className="p-3">
            <input
              type="checkbox"
              checked={drafts.length > 0 && selected.size === drafts.length}
              onChange={onToggleAll}
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
                    onChange={() => onToggle(item.id)}
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
              <td className="p-3 text-gray-500 dark:text-gray-400">{item.skill_tested || "—"}</td>
              <td className="p-3">
                <StatusCell published={published} />
              </td>
              <td className="p-3 text-right">
                <PublishCell published={published} id={item.id} busy={busy} onPublish={onPublish} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ScriptsTable({ items, drafts, selected, busy, onToggle, onToggleAll, onPublish }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-surface-light-border text-xs uppercase text-gray-500 dark:border-surface-dark-border dark:text-gray-400">
        <tr>
          <th className="p-3">
            <input
              type="checkbox"
              checked={drafts.length > 0 && selected.size === drafts.length}
              onChange={onToggleAll}
              aria-label="Select all drafts"
            />
          </th>
          <th className="p-3">Title</th>
          <th className="p-3">Nodes</th>
          <th className="p-3">Jurisdiction</th>
          <th className="p-3">Lang</th>
          <th className="p-3">Status</th>
          <th className="p-3" />
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const published = item.approval?.published;
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
                    onChange={() => onToggle(item.id)}
                    aria-label="Select script"
                  />
                ) : null}
              </td>
              <td className="max-w-xs p-3">{item.title || "Untitled"}</td>
              <td className="p-3">{item.nodes?.length ?? 0}</td>
              <td className="p-3">{item.jurisdiction}</td>
              <td className="p-3">{item.language_code}</td>
              <td className="p-3">
                <StatusCell published={published} />
              </td>
              <td className="p-3 text-right">
                <PublishCell published={published} id={item.id} busy={busy} onPublish={onPublish} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function QotdTable({ items, drafts, selected, busy, onToggle, onToggleAll, onPublish }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-surface-light-border text-xs uppercase text-gray-500 dark:border-surface-dark-border dark:text-gray-400">
        <tr>
          <th className="p-3">
            <input
              type="checkbox"
              checked={drafts.length > 0 && selected.size === drafts.length}
              onChange={onToggleAll}
              aria-label="Select all drafts"
            />
          </th>
          <th className="p-3">Question</th>
          <th className="p-3">Jurisdiction</th>
          <th className="p-3">Difficulty</th>
          <th className="p-3">Lang</th>
          <th className="p-3">Status</th>
          <th className="p-3" />
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const published = item.approval?.published;
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
                    onChange={() => onToggle(item.id)}
                    aria-label="Select question"
                  />
                ) : null}
              </td>
              <td className="max-w-xs p-3">{truncate(item.question_description)}</td>
              <td className="p-3">{item.jurisdiction}</td>
              <td className="p-3">{item.difficulty_level}</td>
              <td className="p-3">{item.language_code || "—"}</td>
              <td className="p-3">
                <StatusCell published={published} />
              </td>
              <td className="p-3 text-right">
                <PublishCell published={published} id={item.id} busy={busy} onPublish={onPublish} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
