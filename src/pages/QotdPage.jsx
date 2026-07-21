import { useRef, useState } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { downloadQotdTemplate } from "../utils/qotdTemplate.js";
import { parseQotdFile } from "../utils/parseQotd.js";
import { importQotd } from "../services/qotdService.js";

export default function QotdPage() {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
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
      setResult(await parseQotdFile(file));
    } catch (err) {
      setError(err.message || "Could not read that file.");
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!result?.valid?.length) return;
    setImporting(true);
    setError("");
    try {
      const count = await importQotd(result.valid);
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Upload Question of the Day</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Download the Excel template, fill in questions, then upload. Rows are saved as drafts
          until you publish them on the Review page.
        </p>
      </div>

      <div className="card-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="mt-0.5 shrink-0 text-primary" size={20} />
            <div>
              <p className="font-medium">1. Download the template</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Excel with QOTD columns and one example row.
              </p>
            </div>
          </div>
          <button type="button" onClick={downloadQotdTemplate} className="btn-primary shrink-0">
            <Download size={16} /> Template
          </button>
        </div>
      </div>

      <div className="card-surface p-5">
        <div className="flex items-start gap-3">
          <Upload className="mt-0.5 shrink-0 text-primary" size={20} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">2. Upload your filled file</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Accepts .xlsx / .xls</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-surface-light-border px-4 py-3 text-sm transition hover:border-primary dark:border-surface-dark-border">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
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
          <CheckCircle2 size={16} /> Imported {imported} question{imported === 1 ? "" : "s"} as
          drafts. Head to Review &amp; Publish to make them live.
        </p>
      ) : null}

      {result ? (
        <div className="card-surface p-5">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-verdict-trust">
              <CheckCircle2 size={16} /> {result.valid.length} valid
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-verdict-verify_first">
              <AlertTriangle size={16} /> {result.skipped.length} skipped
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              of {result.total} rows
            </span>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || result.valid.length === 0}
              className="btn-primary ml-auto"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : null}
              Import {result.valid.length} question{result.valid.length === 1 ? "" : "s"}
            </button>
          </div>

          {result.skipped.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">Row</th>
                    <th className="py-2">Reason skipped</th>
                  </tr>
                </thead>
                <tbody>
                  {result.skipped.map((s) => (
                    <tr
                      key={s.row}
                      className="border-t border-surface-light-border dark:border-surface-dark-border"
                    >
                      <td className="py-2 pr-4 font-medium">{s.row}</td>
                      <td className="py-2 text-verdict-dont_trust">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
