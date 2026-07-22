import { useRef, useState } from "react";
import {
  Sparkles,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { generateFromPdf, writeGenerationLineage } from "../services/generationService.js";
import { importQuestions } from "../services/contentService.js";
import {
  JURISDICTION_CODES,
  REGULATORS,
  LANGUAGE_CODES,
  MODULES,
  DIFFICULTIES,
  QUESTION_FORMATS,
  MCQ_OPTION_KEYS,
} from "../constants/enums.js";

const defaultParams = {
  jurisdiction: "IN",
  regulator: "SEBI",
  language_code: "en",
  module: "",
  difficulty: "Beginner",
  count: 5,
};

const isMcq = (format) => format === "MCQ_Single" || format === "MCQ_Multi";

export default function GeneratePage() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [params, setParams] = useState(defaultParams);
  const [formats, setFormats] = useState(["Swipe_TrueFalse"]);

  const [stage, setStage] = useState("form"); // form | generating | review | importing
  const [drafts, setDrafts] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState("");

  const busy = stage === "generating" || stage === "importing";
  const MAX_PDF_BYTES = 4 * 1024 * 1024;

  function setParam(key, value) {
    setParams((p) => ({ ...p, [key]: value }));
  }

  function toggleFormat(format) {
    setFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  }

  function updateDraft(index, patch) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function removeDraft(index) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (!file) {
      setError("Choose a source PDF first.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`PDF is too large (${Math.round(file.size / 1024)} KB). Keep under 4 MB for the POC.`);
      return;
    }
    setError("");
    setImportResult(null);
    setDrafts(null);

    const genParams = {
      jurisdiction: params.jurisdiction,
      regulator: params.regulator,
      language_code: params.language_code,
      module: params.module,
      difficulty: params.difficulty,
      count: Number(params.count),
      formats,
    };

    try {
      setStage("generating");
      const { cards, prompt_summary } = await generateFromPdf(file, genParams);

      if (!cards?.length) {
        throw new Error("The model returned no questions. Try a different PDF or a higher count.");
      }

      await writeGenerationLineage({
        file,
        params: genParams,
        count_requested: genParams.count,
        count_returned: cards.length,
        prompt_summary,
      });

      setDrafts(cards);
      setStage("review");
    } catch (err) {
      setError(err.message || "Generation failed.");
      setStage("form");
    }
  }

  async function handleImport() {
    if (!drafts?.length) return;
    setError("");
    setStage("importing");
    try {
      const res = await importQuestions(drafts);
      setImportResult(res);
      setDrafts(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setStage("form");
    } catch (err) {
      setError(err.message || "Import failed.");
      setStage("review");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Generate with AI</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload a source PDF and Gemini drafts questions from it. You review and edit every
          question before importing — nothing is saved or published automatically.
        </p>
      </div>

      {/* Params */}
      <div className="card-surface space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Jurisdiction</span>
            <select
              className="input-field"
              value={params.jurisdiction}
              onChange={(e) => setParam("jurisdiction", e.target.value)}
            >
              {JURISDICTION_CODES.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Regulator</span>
            <select
              className="input-field"
              value={params.regulator}
              onChange={(e) => setParam("regulator", e.target.value)}
            >
              {REGULATORS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Language</span>
            <select
              className="input-field"
              value={params.language_code}
              onChange={(e) => setParam("language_code", e.target.value)}
            >
              {LANGUAGE_CODES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Module</span>
            <select
              className="input-field"
              value={params.module}
              onChange={(e) => setParam("module", e.target.value)}
            >
              <option value="">Any</option>
              {MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Difficulty</span>
            <select
              className="input-field"
              value={params.difficulty}
              onChange={(e) => setParam("difficulty", e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">How many questions</span>
            <input
              type="number"
              min={1}
              max={20}
              className="input-field"
              value={params.count}
              onChange={(e) => setParam("count", e.target.value)}
            />
          </label>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Question formats</span>
          <div className="flex flex-wrap gap-2">
            {QUESTION_FORMATS.map((format) => {
              const active = formats.includes(format);
              return (
                <button
                  key={format}
                  type="button"
                  onClick={() => toggleFormat(format)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-surface-light-border text-gray-600 hover:border-primary dark:border-surface-dark-border dark:text-gray-300"
                  }`}
                >
                  {format}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload + generate */}
      <div className="card-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-surface-light-border px-4 py-3 text-sm transition hover:border-primary dark:border-surface-dark-border">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError("");
                setImportResult(null);
              }}
            />
            <FileText size={16} className="text-primary" />
            <span className="truncate">{file?.name || "Choose a PDF…"}</span>
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy || !file || formats.length === 0}
            className="btn-primary shrink-0"
          >
            {stage === "generating" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate drafts
              </>
            )}
          </button>
        </div>
        {stage === "generating" ? (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Gemini is reading the PDF — this can take up to a minute for large files.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-verdict-dont_trust dark:bg-red-950/30">
          <AlertTriangle size={16} /> {error}
        </p>
      ) : null}

      {importResult ? (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-verdict-trust dark:bg-green-950/30">
          <CheckCircle2 size={16} /> Imported {importResult.inserted} new question
          {importResult.inserted === 1 ? "" : "s"} as Draft. Head to Review &amp; Publish to make
          them live.
        </p>
      ) : null}

      {/* Review grid */}
      {drafts?.length ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">
              {drafts.length} draft{drafts.length === 1 ? "" : "s"} to review
            </h3>
            <button
              type="button"
              onClick={handleImport}
              disabled={stage === "importing"}
              className="btn-primary"
            >
              {stage === "importing" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Approve &amp; import {drafts.length}
            </button>
          </div>

          {drafts.map((d, i) => (
            <DraftCard
              key={i}
              draft={d}
              index={i}
              onChange={(patch) => updateDraft(i, patch)}
              onRemove={() => removeDraft(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DraftCard({ draft, index, onChange, onRemove }) {
  const mcq = isMcq(draft.question_format);

  function setOption(key, value) {
    onChange({ options: { ...(draft.options || {}), [key]: value } });
  }

  return (
    <div className="card-surface space-y-4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Question {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-xs font-medium text-verdict-dont_trust hover:opacity-80"
        >
          <Trash2 size={14} /> Remove
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Format</span>
          <select
            className="input-field"
            value={draft.question_format}
            onChange={(e) => onChange({ question_format: e.target.value })}
          >
            {QUESTION_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Module</span>
          <select
            className="input-field"
            value={draft.module}
            onChange={(e) => onChange({ module: e.target.value })}
          >
            <option value="">—</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Category</span>
          <input
            className="input-field"
            value={draft.category}
            onChange={(e) => onChange({ category: e.target.value })}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Question text</span>
        <textarea
          rows={2}
          className="input-field resize-y"
          value={draft.question_text}
          onChange={(e) => onChange({ question_text: e.target.value })}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Scenario context (optional)</span>
        <textarea
          rows={2}
          className="input-field resize-y"
          value={draft.scenario_context}
          onChange={(e) => onChange({ scenario_context: e.target.value })}
        />
      </label>

      {mcq ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {MCQ_OPTION_KEYS.map((key) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">Option {key}</span>
              <input
                className="input-field"
                value={draft.options?.[key] || ""}
                onChange={(e) => setOption(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Correct answer</span>
          {mcq ? (
            <input
              className="input-field"
              placeholder="e.g. B or A,C"
              value={Array.isArray(draft.correct_answer) ? draft.correct_answer.join(",") : ""}
              onChange={(e) =>
                onChange({
                  correct_answer: e.target.value
                    .split(",")
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean),
                })
              }
            />
          ) : (
            <select
              className="input-field"
              value={typeof draft.correct_answer === "string" ? draft.correct_answer : ""}
              onChange={(e) => onChange({ correct_answer: e.target.value })}
            >
              <option value="">—</option>
              <option value="TRUE">TRUE (legitimate)</option>
              <option value="FALSE">FALSE (red flag)</option>
            </select>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Difficulty</span>
          <select
            className="input-field"
            value={draft.difficulty}
            onChange={(e) => onChange({ difficulty: e.target.value })}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Explanation feedback</span>
        <textarea
          rows={2}
          className="input-field resize-y"
          value={draft.explanation_feedback}
          onChange={(e) => onChange({ explanation_feedback: e.target.value })}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">AI explainer context</span>
        <textarea
          rows={3}
          className="input-field resize-y"
          value={draft.ai_explainer_context}
          onChange={(e) => onChange({ ai_explainer_context: e.target.value })}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Regulatory reference (optional)</span>
        <input
          className="input-field"
          value={draft.regulatory_reference}
          onChange={(e) => onChange({ regulatory_reference: e.target.value })}
        />
      </label>
    </div>
  );
}
