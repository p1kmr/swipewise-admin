import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  Search,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  X,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileText,
  Sun,
} from "lucide-react";
import {
  listContent,
  importQuestions,
  publishQuestions,
  setQuestionStatus,
  updateQuestion,
  deleteQuestion,
  clearAllQuestions,
  aiEditQuestion,
  generateFromPdf,
  publishQotd,
  unpublishQotd,
} from "../services/contentService.js";
import { downloadQuestionTemplate } from "../utils/excelTemplate.js";
import { parseQuestionsFile } from "../utils/parseQuestions.js";
import {
  JURISDICTION_CODES,
  LANGUAGE_CODES,
  MODULES,
  QUESTION_FORMATS,
  DIFFICULTIES,
  STATUSES,
  STATUS_META,
  MCQ_OPTION_KEYS,
} from "../constants/enums.js";

const isMcq = (fmt) => fmt === "MCQ_Single" || fmt === "MCQ_Multi";

function emptyForm() {
  return {
    jurisdiction: "IN",
    language_code: "en",
    module: MODULES[0],
    category: "",
    question_format: "Swipe_TrueFalse",
    question_text: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: "",
    explanation_feedback: "",
    ai_explainer_context: "",
    regulatory_reference: "",
    difficulty: "Beginner",
    points: 10,
    media_url: "",
    status: "Draft",
    effective_date: "",
    expiry_date: "",
    reviewer: "",
    qotd_tagged: false,
  };
}

function toForm(q) {
  return {
    ...emptyForm(),
    ...q,
    qotd_tagged: q.qotd?.published === true || q.qotd?.marked === true,
    options: {
      A: q.options?.A || "",
      B: q.options?.B || "",
      C: q.options?.C || "",
      D: q.options?.D || "",
    },
    correct_answer: q.correct_answer ?? "",
    points: q.points ?? 10,
    effective_date: q.effective_date || "",
    expiry_date: q.expiry_date || "",
  };
}

// Build the question payload from the form (normalise options + correct_answer by format).
function formToPayload(form) {
  const mcq = isMcq(form.question_format);
  const options = {};
  if (mcq) {
    MCQ_OPTION_KEYS.forEach((k) => {
      if (form.options[k]?.trim()) options[k] = form.options[k].trim();
    });
  }
  let correct = form.correct_answer;
  if (mcq) {
    correct = Array.isArray(correct)
      ? correct
      : String(correct || "")
          .split(/[,;|]/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
  } else {
    correct = String(Array.isArray(correct) ? "" : correct || "").trim().toUpperCase();
  }
  return {
    jurisdiction: String(form.jurisdiction || "").toUpperCase(),
    language_code: form.language_code,
    module: form.module,
    category: form.category,
    question_format: form.question_format,
    question_text: form.question_text,
    options,
    correct_answer: correct,
    explanation_feedback: form.explanation_feedback,
    ai_explainer_context: form.ai_explainer_context,
    regulatory_reference: form.regulatory_reference,
    difficulty: form.difficulty,
    points: Number(form.points) || 10,
    media_url: form.media_url,
    status: form.status,
    effective_date: form.effective_date || null,
    expiry_date: form.expiry_date || null,
    reviewer: form.reviewer,
  };
}

export default function QuestionsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("All");
  const [formatFilter, setFormatFilter] = useState("All");

  const [editing, setEditing] = useState(null); // { mode: 'new'|'edit', question } or null
  const [generating, setGenerating] = useState(false);
  const uploadRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  // Local QOTD pick per jurisdiction — no API call until Publish QOTD.
  const [pendingQotdByJurisdiction, setPendingQotdByJurisdiction] = useState({});

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      setItems(await listContent());
    } catch (err) {
      setError(err.message || "Could not load questions.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (statusFilter !== "All" && (it.status || "Draft") !== statusFilter) return false;
      if (jurisdictionFilter !== "All" && it.jurisdiction !== jurisdictionFilter) return false;
      if (formatFilter !== "All" && it.question_format !== formatFilter) return false;
      if (!q) return true;
      return [
        it.question_text,
        it.category,
        it.module,
        it.explanation_feedback,
        it.question_id,
        it.jurisdiction,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, search, statusFilter, jurisdictionFilter, formatFilter]);

  const jurisdictionsPresent = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.jurisdiction).filter(Boolean)))],
    [items]
  );

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { valid, skipped } = await parseQuestionsFile(file);
      if (!valid.length) {
        setError(`No valid rows found. ${skipped.length} skipped.`);
      } else {
        const res = await importQuestions(valid);
        flash(`Imported ${res.inserted} new question${res.inserted === 1 ? "" : "s"} as Draft${
          skipped.length ? ` · ${skipped.length} rows skipped` : ""
        }.`);
        await refresh();
      }
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function rowAction(id, fn, msg, { silent = false } = {}) {
    setBusyId(id);
    setError("");
    try {
      await fn();
      if (msg) flash(msg);
      await refresh(silent);
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  const publish = (it, pendingSelected) => {
    const jurisdiction = String(it.jurisdiction || "GLOBAL").toUpperCase();
    if (pendingSelected) {
      rowAction(
        it.id,
        async () => {
          await publishQotd(it.id);
          setPendingQotdByJurisdiction((prev) => {
            if (prev[jurisdiction] !== it.id) return prev;
            const next = { ...prev };
            delete next[jurisdiction];
            return next;
          });
        },
        "Published as Question of the Day.",
        { silent: true }
      );
      return;
    }
    rowAction(it.id, () => publishQuestions([it.id]), "Published.");
  };
  const unpublish = (it) => rowAction(it.id, () => setQuestionStatus([it.id], "Draft"), "Moved to Draft.");
  const remove = (it) => {
    if (!window.confirm("Delete this question permanently?")) return;
    rowAction(it.id, () => deleteQuestion(it.id), "Deleted.");
  };

  function setQotdPending(mongoId, jurisdiction, tagged) {
    const code = String(jurisdiction || "GLOBAL").toUpperCase();
    setPendingQotdByJurisdiction((prev) => {
      const next = { ...prev };
      if (tagged && mongoId) next[code] = mongoId;
      else if (next[code] === mongoId) delete next[code];
      return next;
    });
  }

  async function handleClearAll() {
    if (!window.confirm("Delete ALL questions and test data? This cannot be undone.")) return;
    setBusyId("__all__");
    setError("");
    try {
      const res = await clearAllQuestions();
      flash(`Cleared all test data (${res.total} document${res.total === 1 ? "" : "s"}).`);
      setPendingQotdByJurisdiction({});
      await refresh();
    } catch (err) {
      setError(err.message || "Clear failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveDrawer(payload, qotdTagged) {
    const jurisdiction = String(payload.jurisdiction || "GLOBAL").toUpperCase();
    let mongoId;

    if (editing.mode === "new") {
      const res = await importQuestions([{ ...payload, question_id: null }]);
      const list = await listContent();
      mongoId = list.find((q) => res.ids?.includes(q.question_id))?.id;
      flash("Question created as Draft.");
    } else {
      mongoId = editing.question.id;
      if (editing.question.qotd?.published && !qotdTagged) {
        await unpublishQotd(mongoId);
      }
      await updateQuestion(mongoId, payload);
      flash("Question saved.");
    }

    setQotdPending(mongoId, jurisdiction, qotdTagged);
    setEditing(null);
    await refresh(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Questions</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} shown · {items.length} total · Set QOTD in add/edit, then Publish to push live
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadQuestionTemplate} className="inline-flex items-center gap-2 rounded-lg border border-surface-light-border px-3 py-2 text-sm dark:border-surface-dark-border">
            <Download size={16} /> Template
          </button>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-light-border px-3 py-2 text-sm dark:border-surface-dark-border"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload Excel
          </button>
          <input ref={uploadRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
          <button
            type="button"
            onClick={() => setGenerating(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-light-border px-3 py-2 text-sm dark:border-surface-dark-border"
          >
            <FileText size={16} /> Generate from PDF
          </button>
          <button type="button" onClick={() => setEditing({ mode: "new" })} className="btn-primary">
            <Plus size={16} /> New
          </button>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={busyId === "__all__"}
              className="inline-flex items-center gap-2 rounded-lg border border-surface-light-border px-3 py-2 text-sm text-verdict-dont_trust transition hover:border-verdict-dont_trust disabled:opacity-50 dark:border-surface-dark-border"
            >
              {busyId === "__all__" ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Clear all
            </button>
          ) : null}
        </div>
      </div>

      {/* Search + filters */}
      <div className="card-surface space-y-3 p-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question text, category, module, ID…"
            className="w-full rounded-lg border border-surface-light-border bg-transparent py-2 pl-9 pr-3 text-sm dark:border-surface-dark-border"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", ...STATUSES]} />
          <FilterSelect label="Jurisdiction" value={jurisdictionFilter} onChange={setJurisdictionFilter} options={jurisdictionsPresent} />
          <FilterSelect label="Format" value={formatFilter} onChange={setFormatFilter} options={["All", ...QUESTION_FORMATS]} />
          <button type="button" onClick={refresh} disabled={loading} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-surface-light-border px-3 py-2 text-sm dark:border-surface-dark-border">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-verdict-dont_trust dark:bg-red-950/30">{error}</p>
      ) : null}
      {notice ? (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-verdict-trust dark:bg-green-950/30">
          <CheckCircle2 size={16} /> {notice}
        </p>
      ) : null}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface p-10 text-center text-sm text-gray-500">
          No questions match. Upload the master Excel or add one with “New”.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((it) => {
            const jurisdiction = String(it.jurisdiction || "GLOBAL").toUpperCase();
            const pendingSelected = pendingQotdByJurisdiction[jurisdiction] === it.id;
            return (
            <QuestionRow
              key={it.id}
              item={it}
              busy={busyId === it.id}
              pendingSelected={pendingSelected}
              onEdit={() => setEditing({ mode: "edit", question: it })}
              onPublish={() => publish(it, pendingSelected)}
              onUnpublish={() => unpublish(it)}
              onDelete={() => remove(it)}
            />
            );
          })}
        </div>
      )}

      {editing ? (
        <EditDrawer
          initial={
            editing.mode === "edit"
              ? {
                  ...toForm(editing.question),
                  qotd_tagged:
                    editing.question.qotd?.published === true ||
                    pendingQotdByJurisdiction[
                      String(editing.question.jurisdiction || "GLOBAL").toUpperCase()
                    ] === editing.question.id,
                }
              : emptyForm()
          }
          mode={editing.mode}
          onClose={() => setEditing(null)}
          onSave={saveDrawer}
        />
      ) : null}

      {generating ? (
        <GeneratePdfModal
          onClose={() => setGenerating(false)}
          onImported={async (n) => {
            setGenerating(false);
            flash(`Imported ${n} generated question${n === 1 ? "" : "s"} as Draft.`);
            await refresh();
          }}
        />
      ) : null}
    </div>
  );
}

const MAX_PDF_BYTES = 4 * 1024 * 1024;

function GeneratePdfModal({ onClose, onImported }) {
  const [params, setParams] = useState({
    jurisdiction: "IN",
    language_code: "en",
    module: "",
    difficulty: "Beginner",
    count: 5,
  });
  const [formats, setFormats] = useState(["Swipe_TrueFalse"]);
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("form"); // form | generating | review | importing
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const setParam = (k, v) => setParams((p) => ({ ...p, [k]: v }));
  const toggleFormat = (f) =>
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  async function generate() {
    if (!file) return setError("Choose a source PDF first.");
    if (file.size > MAX_PDF_BYTES) return setError(`PDF too large (${Math.round(file.size / 1024)} KB). Keep under 4 MB.`);
    setError("");
    setStage("generating");
    try {
      const { cards } = await generateFromPdf(file, {
        jurisdiction: params.jurisdiction,
        language_code: params.language_code,
        module: params.module,
        difficulty: params.difficulty,
        count: Number(params.count),
        formats,
      });
      if (!cards?.length) throw new Error("The model returned no questions. Try another PDF or a higher count.");
      setDrafts(cards);
      setStage("review");
    } catch (err) {
      setError(err.message || "Generation failed.");
      setStage("form");
    }
  }

  async function importDrafts() {
    setStage("importing");
    setError("");
    try {
      const res = await importQuestions(drafts);
      onImported(res.inserted ?? drafts.length);
    } catch (err) {
      setError(err.message || "Import failed.");
      setStage("review");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-lg flex-col bg-surface-light-card shadow-xl dark:bg-surface-dark-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-surface-light-border px-4 py-3 dark:border-surface-dark-border">
          <h3 className="flex items-center gap-2 font-semibold"><FileText size={18} className="text-primary" /> Generate from PDF</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-surface-dark-bg"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a source PDF — the LLM drafts questions grounded in it. You review them in the
            list and publish when ready; nothing is published automatically.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Jurisdiction"><Select value={params.jurisdiction} onChange={(v) => setParam("jurisdiction", v)} options={JURISDICTION_CODES} /></Field>
            <Field label="Language"><Select value={params.language_code} onChange={(v) => setParam("language_code", v)} options={LANGUAGE_CODES} /></Field>
            <Field label="Module (optional)"><Select value={params.module} onChange={(v) => setParam("module", v)} options={["", ...MODULES]} /></Field>
            <Field label="Difficulty"><Select value={params.difficulty} onChange={(v) => setParam("difficulty", v)} options={DIFFICULTIES} /></Field>
            <Field label="How many">
              <input type="number" min={1} max={20} className="input-field" value={params.count} onChange={(e) => setParam("count", e.target.value)} />
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Formats</span>
            <div className="flex flex-wrap gap-2">
              {QUESTION_FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFormat(f)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    formats.includes(f)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-surface-light-border text-gray-600 dark:border-surface-dark-border dark:text-gray-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-surface-light-border px-4 py-3 text-sm transition hover:border-primary dark:border-surface-dark-border">
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(""); }} />
            <FileText size={16} className="text-primary" />
            <span className="truncate">{file?.name || "Choose a PDF…"}</span>
          </label>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-verdict-dont_trust dark:bg-red-950/30">{error}</p> : null}

          {stage === "review" && drafts?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{drafts.length} draft{drafts.length === 1 ? "" : "s"} generated</p>
              <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-surface-light-border p-2 dark:border-surface-dark-border">
                {drafts.map((d, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-gray-400">{d.question_format}</span> · {d.question_text}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-light-border px-4 py-3 dark:border-surface-dark-border">
          <button type="button" onClick={onClose} className="rounded-lg border border-surface-light-border px-4 py-2 text-sm dark:border-surface-dark-border">Cancel</button>
          {stage === "review" ? (
            <button type="button" onClick={importDrafts} disabled={stage === "importing"} className="btn-primary">
              {stage === "importing" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Import {drafts.length} as Draft
            </button>
          ) : (
            <button type="button" onClick={generate} disabled={stage === "generating" || formats.length === 0} className="btn-primary">
              {stage === "generating" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="inline-flex items-center gap-1 text-xs">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-surface-light-border bg-transparent px-2 py-1.5 text-sm dark:border-surface-dark-border dark:bg-surface-dark-bg"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || "Draft", badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>{meta.label}</span>;
}

function answerLabel(it) {
  if (Array.isArray(it.correct_answer)) return it.correct_answer.join(", ");
  return it.correct_answer || "—";
}

function QotdBadge({ qotd, pendingSelected }) {
  if (qotd?.published) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <Sun size={11} /> Live QOTD
      </span>
    );
  }
  if (pendingSelected) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
        <Sun size={11} /> QOTD
      </span>
    );
  }
  return null;
}

function QuestionRow({
  item,
  busy,
  pendingSelected,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}) {
  const active = (item.status || "Draft") === "Active";
  const showPublish = !active || pendingSelected;
  return (
    <div className="card-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.question_text || "(no text)"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <StatusBadge status={item.status || "Draft"} />
            <QotdBadge qotd={item.qotd} pendingSelected={pendingSelected} />
            <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{item.question_format}</span>
            <span>{item.jurisdiction}</span>
            <span>· {item.language_code}</span>
            {item.category ? <span>· {item.category}</span> : null}
            <span>· {item.difficulty}</span>
            <span>· ✓ {answerLabel(item)}</span>
            {item.question_id ? <span className="font-mono">· {item.question_id}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {busy ? <Loader2 size={16} className="animate-spin text-gray-400" /> : null}
          {showPublish ? (
            <IconBtn title={pendingSelected ? "Publish question and push as QOTD" : "Publish"} onClick={onPublish} disabled={busy} primary>
              Publish
            </IconBtn>
          ) : (
            <IconBtn title="Unpublish" onClick={onUnpublish} disabled={busy}>Draft</IconBtn>
          )}
          <IconBtn title="Edit" onClick={onEdit} disabled={busy}><Pencil size={14} /></IconBtn>
          <IconBtn title="Delete" onClick={onDelete} disabled={busy} danger><Trash2 size={14} /></IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick, disabled, primary, danger }) {
  const cls = primary
    ? "border-primary text-primary"
    : danger
      ? "border-surface-light-border text-verdict-dont_trust dark:border-surface-dark-border"
      : "border-surface-light-border text-gray-600 dark:border-surface-dark-border dark:text-gray-300";
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

function EditDrawer({ initial, mode, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const mcq = isMcq(form.question_format);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setOption = (k, v) => setForm((f) => ({ ...f, options: { ...f.options, [k]: v } }));

  async function applyAi() {
    if (!instruction.trim()) return;
    setAiBusy(true);
    setError("");
    try {
      const revised = await aiEditQuestion(formToPayload(form), instruction);
      set({
        module: revised.module || form.module,
        category: revised.category || form.category,
        question_format: revised.question_format || form.question_format,
        question_text: revised.question_text ?? form.question_text,
        options: {
          A: revised.options?.A || "",
          B: revised.options?.B || "",
          C: revised.options?.C || "",
          D: revised.options?.D || "",
        },
        correct_answer: revised.correct_answer ?? form.correct_answer,
        explanation_feedback: revised.explanation_feedback ?? form.explanation_feedback,
        ai_explainer_context: revised.ai_explainer_context ?? form.ai_explainer_context,
        regulatory_reference: revised.regulatory_reference ?? form.regulatory_reference,
        difficulty: revised.difficulty || form.difficulty,
      });
      setInstruction("");
    } catch (err) {
      setError(err.message || "AI edit failed.");
    } finally {
      setAiBusy(false);
    }
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await onSave(formToPayload(form), !!form.qotd_tagged);
    } catch (err) {
      setError(err.message || "Save failed.");
      setSaving(false);
    }
  }

  const correctText = Array.isArray(form.correct_answer) ? form.correct_answer.join(",") : "";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col bg-surface-light-card shadow-xl dark:bg-surface-dark-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-light-border px-4 py-3 dark:border-surface-dark-border">
          <h3 className="font-semibold">{mode === "new" ? "New question" : "Edit question"}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-surface-dark-bg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Modify with AI */}
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-primary">
              <Sparkles size={15} /> Modify with AI
            </p>
            <div className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. make it harder, simplify, add a red flag…"
                className="input-field flex-1"
              />
              <button type="button" onClick={applyAi} disabled={aiBusy || !instruction.trim()} className="btn-primary shrink-0">
                {aiBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Apply
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Jurisdiction"><Select value={form.jurisdiction} onChange={(v) => set({ jurisdiction: v })} options={JURISDICTION_CODES} /></Field>
            <Field label="Language"><Select value={form.language_code} onChange={(v) => set({ language_code: v })} options={LANGUAGE_CODES} /></Field>
            <Field label="Module"><Select value={form.module} onChange={(v) => set({ module: v })} options={MODULES} /></Field>
            <Field label="Category"><input className="input-field" value={form.category} onChange={(e) => set({ category: e.target.value })} /></Field>
            <Field label="Format"><Select value={form.question_format} onChange={(v) => set({ question_format: v })} options={QUESTION_FORMATS} /></Field>
            <Field label="Difficulty"><Select value={form.difficulty} onChange={(v) => set({ difficulty: v })} options={DIFFICULTIES} /></Field>
          </div>

          <Field label="Question text">
            <textarea rows={3} className="input-field resize-y" value={form.question_text} onChange={(e) => set({ question_text: e.target.value })} />
          </Field>

          {mcq ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {MCQ_OPTION_KEYS.map((k) => (
                <Field key={k} label={`Option ${k}`}>
                  <input className="input-field" value={form.options[k]} onChange={(e) => setOption(k, e.target.value)} />
                </Field>
              ))}
            </div>
          ) : null}

          <Field label="Correct answer">
            {mcq ? (
              <input
                className="input-field"
                placeholder="e.g. B or A,C"
                value={correctText}
                onChange={(e) => set({ correct_answer: e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) })}
              />
            ) : (
              <Select
                value={typeof form.correct_answer === "string" ? form.correct_answer : ""}
                onChange={(v) => set({ correct_answer: v })}
                options={["", "TRUE", "FALSE"]}
              />
            )}
          </Field>

          <Field label="Explanation feedback">
            <textarea rows={2} className="input-field resize-y" value={form.explanation_feedback} onChange={(e) => set({ explanation_feedback: e.target.value })} />
          </Field>
          <Field label="AI explainer context">
            <textarea rows={3} className="input-field resize-y" value={form.ai_explainer_context} onChange={(e) => set({ ai_explainer_context: e.target.value })} />
          </Field>
          <Field label="Regulatory reference">
            <input className="input-field" value={form.regulatory_reference} onChange={(e) => set({ regulatory_reference: e.target.value })} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Points"><input type="number" className="input-field" value={form.points} onChange={(e) => set({ points: e.target.value })} /></Field>
            <Field label="Status"><Select value={form.status} onChange={(v) => set({ status: v })} options={STATUSES} /></Field>
            <Field label="Effective date"><input type="date" className="input-field" value={form.effective_date || ""} onChange={(e) => set({ effective_date: e.target.value })} /></Field>
            <Field label="Expiry date"><input type="date" className="input-field" value={form.expiry_date || ""} onChange={(e) => set({ expiry_date: e.target.value })} /></Field>
            <Field label="Media URL"><input className="input-field" value={form.media_url} onChange={(e) => set({ media_url: e.target.value })} /></Field>
            <Field label="Reviewer"><input className="input-field" value={form.reviewer} onChange={(e) => set({ reviewer: e.target.value })} /></Field>
          </div>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
              form.qotd_tagged
                ? "border-amber-400 bg-amber-500/10 dark:border-amber-600 dark:bg-amber-500/15"
                : "border-surface-light-border dark:border-surface-dark-border"
            }`}
          >
            <input
              type="checkbox"
              checked={!!form.qotd_tagged}
              onChange={(e) => set({ qotd_tagged: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
                <Sun size={15} /> Question of the Day
              </span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                Tag this question as QOTD. Use Publish on the list to push it live.
              </span>
            </span>
          </label>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-verdict-dont_trust dark:bg-red-950/30">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-light-border px-4 py-3 dark:border-surface-dark-border">
          <button type="button" onClick={onClose} className="rounded-lg border border-surface-light-border px-4 py-2 text-sm dark:border-surface-dark-border">Cancel</button>
          <button type="button" onClick={submit} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-600 dark:text-gray-400">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
      {options.map((o) => (
        <option key={o} value={o}>
          {o === "" ? "—" : o}
        </option>
      ))}
    </select>
  );
}
