import { useRef, useState } from "react";
import {
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { downloadScriptTemplate } from "../utils/scriptTemplate.js";
import { parseScriptFile } from "../utils/validateScriptGraph.js";
import { importScripts } from "../services/scriptService.js";

export default function ScriptsPage() {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null); // { valid, errors }
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState("");

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setImported(0);
    setResult(null);
    setFileName(file.name);
    setParsing(true);
    try {
      setResult(await parseScriptFile(file));
    } catch (err) {
      setError(err.message || "Could not read that file.");
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!result?.valid) return;
    setImporting(true);
    setError("");
    try {
      const count = await importScripts([result.valid]);
      setImported(count);
      setResult(null);
      setFileName("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  const isValid = Boolean(result?.valid);
  const validationErrors = result?.errors || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Upload WiseBot scripts</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Download the JSON template, edit the dialogue tree offline, then upload. Scripts are
          saved as drafts until you publish them on the Review page.
        </p>
      </div>

      <div className="card-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileJson className="mt-0.5 shrink-0 text-primary" size={20} />
            <div>
              <p className="font-medium">1. Download the template</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                JSON with a 3-node example dialogue graph.
              </p>
            </div>
          </div>
          <button type="button" onClick={downloadScriptTemplate} className="btn-primary shrink-0">
            <Download size={16} /> Template
          </button>
        </div>
      </div>

      <div className="card-surface p-5">
        <div className="flex items-start gap-3">
          <Upload className="mt-0.5 shrink-0 text-primary" size={20} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">2. Upload your script</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">One script per .json file</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-surface-light-border px-4 py-3 text-sm transition hover:border-primary dark:border-surface-dark-border">
              <input
                ref={inputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFile}
                className="hidden"
              />
              {parsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {fileName || "Choose file…"}
            </label>
          </div>
        </div>
      </div>

      {error ? (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-verdict-dont_trust dark:bg-red-950/30">
          <AlertTriangle size={16} /> {error}
        </p>
      ) : null}

      {imported > 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-verdict-trust dark:bg-green-950/30">
          <CheckCircle2 size={16} /> Imported {imported} script{imported === 1 ? "" : "s"} as
          drafts. Head to Review &amp; Publish to make them live.
        </p>
      ) : null}

      {result ? (
        <div className="card-surface p-5">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            {isValid ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-verdict-trust">
                <CheckCircle2 size={16} /> Graph valid — {result.valid.nodes.length} nodes
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-verdict-dont_trust">
                <AlertTriangle size={16} /> Validation failed
              </span>
            )}
            {isValid ? (
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="btn-primary ml-auto"
              >
                {importing ? <Loader2 size={16} className="animate-spin" /> : null}
                Import script
              </button>
            ) : null}
          </div>

          {validationErrors.length > 0 ? (
            <ul className="space-y-1 text-sm text-verdict-dont_trust">
              {validationErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}

          {isValid ? (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{result.valid.title || "Untitled"}</span> ·{" "}
              {result.valid.jurisdiction} / {result.valid.language_code}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
