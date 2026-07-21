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
import { importCards } from "../services/contentService.js";
import { VERDICTS, VISUAL_TYPES, SKILLS } from "../constants/enums.js";

const DIFFICULTIES = [1, 2, 3, 4, 5];

const defaultParams = {
  jurisdiction: "IN",
  language_code: "en",
  bucket: "",
  count: 5,
  difficulty_min: 1,
  difficulty_max: 5,
};

export default function GeneratePage() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [params, setParams] = useState(defaultParams);
  const [skills, setSkills] = useState([]);

  const [stage, setStage] = useState("form"); // form | generating | review | importing
  const [drafts, setDrafts] = useState(null);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState("");

  const busy = stage === "generating" || stage === "importing";
  const MAX_PDF_BYTES = 4 * 1024 * 1024;

  function setParam(key, value) {
    setParams((p) => ({ ...p, [key]: value }));
  }

  function toggleSkill(skill) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
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
    setImported(0);
    setDrafts(null);

    const genParams = {
      jurisdiction: params.jurisdiction,
      language_code: params.language_code,
      bucket: params.bucket,
      count: Number(params.count),
      difficulty_min: Number(params.difficulty_min),
      difficulty_max: Number(params.difficulty_max),
      skills,
    };

    try {
      setStage("generating");
      const { cards, prompt_summary } = await generateFromPdf(file, genParams);

      if (!cards?.length) {
        throw new Error("The model returned no cards. Try a different PDF or a higher count.");
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
      const n = await importCards(drafts);
      setImported(n);
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
          Upload a source PDF and Gemini drafts swipe cards from it. You review and edit every
          card before importing — nothing is saved or published automatically.
        </p>
      </div>

      {/* Params */}
      <div className="card-surface space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Jurisdiction</span>
            <input
              className="input-field"
              value={params.jurisdiction}
              onChange={(e) => setParam("jurisdiction", e.target.value)}
              placeholder="e.g. IN, EU, US"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Language code</span>
            <input
              className="input-field"
              value={params.language_code}
              onChange={(e) => setParam("language_code", e.target.value)}
              placeholder="e.g. en, hi"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Content bucket / theme</span>
            <input
              className="input-field"
              value={params.bucket}
              onChange={(e) => setParam("bucket", e.target.value)}
              placeholder="optional"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">How many cards</span>
            <input
              type="number"
              min={1}
              max={20}
              className="input-field"
              value={params.count}
              onChange={(e) => setParam("count", e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Min difficulty</span>
            <select
              className="input-field"
              value={params.difficulty_min}
              onChange={(e) => setParam("difficulty_min", e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Max difficulty</span>
            <select
              className="input-field"
              value={params.difficulty_max}
              onChange={(e) => setParam("difficulty_max", e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Target skills (optional)</span>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => {
              const active = skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-surface-light-border text-gray-600 hover:border-primary dark:border-surface-dark-border dark:text-gray-300"
                  }`}
                >
                  {skill}
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
                setImported(0);
              }}
            />
            <FileText size={16} className="text-primary" />
            <span className="truncate">{file?.name || "Choose a PDF…"}</span>
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy || !file}
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

      {imported > 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-verdict-trust dark:bg-green-950/30">
          <CheckCircle2 size={16} /> Imported {imported} card{imported === 1 ? "" : "s"} as drafts.
          Head to Review &amp; Publish to make them live.
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
  return (
    <div className="card-surface space-y-4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Card {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-xs font-medium text-verdict-dont_trust hover:opacity-80"
        >
          <Trash2 size={14} /> Remove
        </button>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Scenario</span>
        <textarea
          rows={3}
          className="input-field resize-y"
          value={draft.scenario_text}
          onChange={(e) => onChange({ scenario_text: e.target.value })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Verdict</span>
          <select
            className="input-field"
            value={draft.verdict}
            onChange={(e) => onChange({ verdict: e.target.value })}
          >
            <option value="">—</option>
            {VERDICTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Visual type</span>
          <select
            className="input-field"
            value={draft.visual_type}
            onChange={(e) => onChange({ visual_type: e.target.value })}
          >
            {VISUAL_TYPES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Difficulty</span>
          <select
            className="input-field"
            value={draft.difficulty}
            onChange={(e) => onChange({ difficulty: Number(e.target.value) })}
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
        <span className="mb-1 block font-medium">Explanation</span>
        <textarea
          rows={2}
          className="input-field resize-y"
          value={draft.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Red flags (separate with |)</span>
        <input
          className="input-field"
          value={(draft.red_flags || []).join(" | ")}
          onChange={(e) =>
            onChange({
              red_flags: e.target.value
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Action step</span>
          <input
            className="input-field"
            value={draft.action_step}
            onChange={(e) => onChange({ action_step: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Skill tested</span>
          <select
            className="input-field"
            value={draft.skill_tested}
            onChange={(e) => onChange({ skill_tested: e.target.value })}
          >
            <option value="">—</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
