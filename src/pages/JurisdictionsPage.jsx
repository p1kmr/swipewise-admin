import { useEffect, useRef, useState } from "react";
import {
  Globe,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Power,
  RefreshCw,
  Plus,
} from "lucide-react";
import {
  listConfigs,
  upsertConfig,
  seedPrototypeConfigs,
  setConfigActive,
} from "../services/configService.js";
import { importJurisdictionData } from "../services/jurisdictionDataService.js";
import { importJurisdictionRegistry } from "../services/jurisdictionRegistryService.js";
import { getCoverageReport, importTranslations } from "../services/i18nService.js";
import { downloadJurisdictionDataTemplate } from "../utils/jurisdictionDataTemplate.js";
import { parseJurisdictionDataFile } from "../utils/parseJurisdictionData.js";
import { downloadRegistryTemplate } from "../utils/registryTemplate.js";
import { parseRegistryFile } from "../utils/parseRegistry.js";
import { downloadTranslationTemplate } from "../utils/translationTemplate.js";
import { parseTranslationFile } from "../utils/parseTranslations.js";
import { WISEBOT_AVATAR_OPTIONS } from "../constants/enums.js";

const TABS = [
  { id: "config", label: "Config" },
  { id: "data", label: "Data" },
  { id: "registry", label: "Registry" },
  { id: "translations", label: "Translations" },
];

const EMPTY_FORM = {
  jurisdiction: "",
  name: "",
  languages: "en",
  default_language: "en",
  timezone: "UTC",
  qotd_interval_minutes: 30,
  branding: {
    app_name: "",
    regulator_name: "",
    regulator_url: "",
    hotline: "",
    wisebot_avatar_default: "neutral",
  },
};

function UploadPanel({
  title,
  description,
  templateLabel,
  onDownloadTemplate,
  onImport,
  parsing,
  result,
  importing,
  imported,
  error,
  inputRef,
  onFile,
  fileName,
}) {
  const validCount = result?.valid?.length ?? 0;
  const skipped = result?.skipped || [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="card-surface flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">{templateLabel}</span>
        <button type="button" onClick={onDownloadTemplate} className="btn-primary shrink-0">
          <Download size={16} /> Template
        </button>
      </div>
      <div className="card-surface p-4">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-surface-light-border px-6 py-8 transition hover:border-primary dark:border-surface-dark-border">
          <Upload size={24} className="text-primary" />
          <span className="text-sm font-medium">{fileName || "Choose Excel file"}</span>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
        </label>
        {parsing ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Parsing…
          </p>
        ) : null}
        {result ? (
          <div className="mt-4 space-y-2 text-sm">
            <p>
              {validCount} valid · {skipped.length} skipped · {result.total} rows
            </p>
            {skipped.slice(0, 5).map(({ row, reason }) => (
              <p key={row} className="text-verdict-dont_trust">
                Row {row}: {reason}
              </p>
            ))}
          </div>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-verdict-dont_trust dark:bg-red-950/30">
            {error}
          </p>
        ) : null}
        {imported > 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-verdict-trust">
            <CheckCircle2 size={16} /> Imported {imported} row{imported === 1 ? "" : "s"}.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onImport}
          disabled={importing || !validCount}
          className="btn-primary mt-4"
        >
          {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Import valid rows
        </button>
      </div>
    </div>
  );
}

export default function JurisdictionsPage() {
  const [tab, setTab] = useState("config");
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [savedMsg, setSavedMsg] = useState("");

  const dataInputRef = useRef(null);
  const registryInputRef = useRef(null);
  const translationInputRef = useRef(null);

  const [dataFile, setDataFile] = useState("");
  const [dataParsing, setDataParsing] = useState(false);
  const [dataResult, setDataResult] = useState(null);
  const [dataImporting, setDataImporting] = useState(false);
  const [dataImported, setDataImported] = useState(0);
  const [dataError, setDataError] = useState("");

  const [registryFile, setRegistryFile] = useState("");
  const [registryParsing, setRegistryParsing] = useState(false);
  const [registryResult, setRegistryResult] = useState(null);
  const [registryImporting, setRegistryImporting] = useState(false);
  const [registryImported, setRegistryImported] = useState(0);
  const [registryError, setRegistryError] = useState("");

  const [translationFile, setTranslationFile] = useState("");
  const [translationParsing, setTranslationParsing] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [translationImporting, setTranslationImporting] = useState(false);
  const [translationImportResult, setTranslationImportResult] = useState(null);
  const [translationError, setTranslationError] = useState("");
  const [coverage, setCoverage] = useState([]);

  async function refreshConfigs() {
    setLoading(true);
    setError("");
    try {
      setConfigs(await listConfigs());
    } catch (err) {
      setError(err.message || "Could not load configs.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshCoverage() {
    try {
      setCoverage(await getCoverageReport());
    } catch {
      setCoverage([]);
    }
  }

  useEffect(() => {
    refreshConfigs();
    refreshCoverage();
  }, []);

  function loadForm(config) {
    setForm({
      jurisdiction: config.jurisdiction,
      name: config.name || "",
      languages: (config.languages || []).join(", "),
      default_language: config.default_language || config.languages?.[0] || "en",
      timezone: config.timezone || "UTC",
      qotd_interval_minutes: config.qotd_interval_minutes ?? 30,
      branding: {
        app_name: config.branding?.app_name || "",
        regulator_name: config.branding?.regulator_name || "",
        regulator_url: config.branding?.regulator_url || "",
        hotline: config.branding?.hotline || "",
        wisebot_avatar_default: config.branding?.wisebot_avatar_default || "neutral",
      },
    });
    setSavedMsg("");
  }

  async function handleSeedPrototype() {
    setBusy(true);
    setError("");
    try {
      await seedPrototypeConfigs();
      await refreshConfigs();
      setSavedMsg("Prototype jurisdictions IN, ES, FR seeded.");
    } catch (err) {
      setError(err.message || "Seed failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveConfig(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSavedMsg("");
    try {
      const languages = form.languages
        .split(/[,;|]/)
        .map((l) => l.trim())
        .filter(Boolean);
      await upsertConfig({
        jurisdiction: form.jurisdiction,
        name: form.name,
        languages,
        default_language: form.default_language,
        timezone: form.timezone,
        qotd_interval_minutes: Number(form.qotd_interval_minutes),
        branding: form.branding,
        active: configs.find((c) => c.jurisdiction === form.jurisdiction.toUpperCase())?.active ?? false,
      });
      await refreshConfigs();
      setSavedMsg(`Saved config for ${form.jurisdiction.toUpperCase()}.`);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(jurisdiction, active) {
    setBusy(true);
    setError("");
    try {
      await setConfigActive(jurisdiction, active);
      await refreshConfigs();
    } catch (err) {
      setError(err.message || "Toggle failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDataFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDataError("");
    setDataImported(0);
    setDataResult(null);
    setDataFile(file.name);
    setDataParsing(true);
    try {
      setDataResult(await parseJurisdictionDataFile(file));
    } catch (err) {
      setDataError(err.message || "Could not read file.");
    } finally {
      setDataParsing(false);
    }
  }

  async function handleDataImport() {
    if (!dataResult?.valid?.length) return;
    setDataImporting(true);
    setDataError("");
    try {
      const count = await importJurisdictionData(dataResult.valid);
      setDataImported(count);
      setDataResult(null);
      setDataFile("");
      if (dataInputRef.current) dataInputRef.current.value = "";
    } catch (err) {
      setDataError(err.message || "Import failed.");
    } finally {
      setDataImporting(false);
    }
  }

  async function handleRegistryFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setRegistryError("");
    setRegistryImported(0);
    setRegistryResult(null);
    setRegistryFile(file.name);
    setRegistryParsing(true);
    try {
      setRegistryResult(await parseRegistryFile(file));
    } catch (err) {
      setRegistryError(err.message || "Could not read file.");
    } finally {
      setRegistryParsing(false);
    }
  }

  async function handleRegistryImport() {
    if (!registryResult?.valid?.length) return;
    setRegistryImporting(true);
    setRegistryError("");
    try {
      const count = await importJurisdictionRegistry(registryResult.valid);
      setRegistryImported(count);
      setRegistryResult(null);
      setRegistryFile("");
      if (registryInputRef.current) registryInputRef.current.value = "";
    } catch (err) {
      setRegistryError(err.message || "Import failed.");
    } finally {
      setRegistryImporting(false);
    }
  }

  async function handleTranslationFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setTranslationError("");
    setTranslationImportResult(null);
    setTranslationResult(null);
    setTranslationFile(file.name);
    setTranslationParsing(true);
    try {
      setTranslationResult(await parseTranslationFile(file));
    } catch (err) {
      setTranslationError(err.message || "Could not read file.");
    } finally {
      setTranslationParsing(false);
    }
  }

  async function handleTranslationImport() {
    if (!translationResult?.valid?.length) return;
    setTranslationImporting(true);
    setTranslationError("");
    try {
      const result = await importTranslations(translationResult.valid);
      setTranslationImportResult(result);
      setCoverage(result.coverage || []);
      setTranslationResult(null);
      setTranslationFile("");
      if (translationInputRef.current) translationInputRef.current.value = "";
    } catch (err) {
      setTranslationError(err.message || "Import failed.");
    } finally {
      setTranslationImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Globe size={22} className="text-primary" /> Jurisdictions
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Onboard jurisdictions with config, data, registry, and translations — no deploy required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              refreshConfigs();
              refreshCoverage();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-light-border px-3 py-2 text-sm dark:border-surface-dark-border"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button type="button" onClick={handleSeedPrototype} disabled={busy} className="btn-primary">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Seed IN / ES / FR
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
      {savedMsg ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-verdict-trust dark:bg-green-950/30">
          {savedMsg}
        </p>
      ) : null}

      {tab === "config" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-surface overflow-x-auto">
            <div className="border-b border-surface-light-border px-4 py-3 dark:border-surface-dark-border">
              <h3 className="font-medium">Jurisdiction configs</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
                <Loader2 size={18} className="animate-spin" /> Loading…
              </div>
            ) : configs.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">
                No configs yet. Click &quot;Seed IN / ES / FR&quot; or create one in the form.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-light-border text-xs uppercase text-gray-500 dark:border-surface-dark-border">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Languages</th>
                    <th className="p-3">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr
                      key={config.id}
                      className="border-b border-surface-light-border last:border-0 dark:border-surface-dark-border"
                    >
                      <td className="p-3 font-medium">{config.jurisdiction}</td>
                      <td className="p-3">{config.name}</td>
                      <td className="p-3">{(config.languages || []).join(", ")}</td>
                      <td className="p-3">
                        {config.active ? (
                          <span className="text-xs font-medium text-verdict-trust">Live</span>
                        ) : (
                          <span className="text-xs font-medium text-verdict-verify_first">Draft</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => loadForm(config)}
                            className="rounded border border-surface-light-border px-2 py-1 text-xs dark:border-surface-dark-border"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleToggleActive(config.jurisdiction, !config.active)}
                            className="inline-flex items-center gap-1 rounded border border-surface-light-border px-2 py-1 text-xs dark:border-surface-dark-border"
                          >
                            <Power size={12} />
                            {config.active ? "Deactivate" : "Go live"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="card-surface space-y-4 p-5">
            <h3 className="font-medium">{form.jurisdiction ? "Edit config" : "New config"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Jurisdiction code</span>
                <input
                  required
                  value={form.jurisdiction}
                  onChange={(e) => setForm({ ...form, jurisdiction: e.target.value.toUpperCase() })}
                  placeholder="IN"
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Display name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Languages (comma-separated)</span>
                <input
                  required
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  placeholder="en, hi"
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Default language</span>
                <input
                  value={form.default_language}
                  onChange={(e) => setForm({ ...form, default_language: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Timezone</span>
                <input
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">QOTD interval (minutes)</span>
                <input
                  type="number"
                  min={1}
                  value={form.qotd_interval_minutes}
                  onChange={(e) => setForm({ ...form, qotd_interval_minutes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">WiseBot default avatar</span>
                <select
                  value={form.branding.wisebot_avatar_default}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, wisebot_avatar_default: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                >
                  {WISEBOT_AVATAR_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Regulator name</span>
                <input
                  value={form.branding.regulator_name}
                  onChange={(e) =>
                    setForm({ ...form, branding: { ...form.branding, regulator_name: e.target.value } })
                  }
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Regulator URL</span>
                <input
                  value={form.branding.regulator_url}
                  onChange={(e) =>
                    setForm({ ...form, branding: { ...form.branding, regulator_url: e.target.value } })
                  }
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Hotline</span>
                <input
                  value={form.branding.hotline}
                  onChange={(e) =>
                    setForm({ ...form, branding: { ...form.branding, hotline: e.target.value } })
                  }
                  className="mt-1 w-full rounded-lg border border-surface-light-border px-3 py-2 dark:border-surface-dark-border dark:bg-surface-dark-bg"
                />
              </label>
            </div>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Save config
            </button>
          </form>
        </div>
      ) : null}

      {tab === "data" ? (
        <UploadPanel
          title="Jurisdiction data"
          description="Upload scam cases, enforcement orders, regulatory rules, and investor alerts."
          templateLabel="Excel template with data_type, title, summary, and metadata."
          onDownloadTemplate={downloadJurisdictionDataTemplate}
          onImport={handleDataImport}
          parsing={dataParsing}
          result={dataResult}
          importing={dataImporting}
          imported={dataImported}
          error={dataError}
          inputRef={dataInputRef}
          onFile={handleDataFile}
          fileName={dataFile}
        />
      ) : null}

      {tab === "registry" ? (
        <UploadPanel
          title="Registered intermediaries"
          description="Bulk upload registered entities for fuzzy name matching in the user app."
          templateLabel="Excel template with entity_name, registration_number, and status."
          onDownloadTemplate={downloadRegistryTemplate}
          onImport={handleRegistryImport}
          parsing={registryParsing}
          result={registryResult}
          importing={registryImporting}
          imported={registryImported}
          error={registryError}
          inputRef={registryInputRef}
          onFile={handleRegistryFile}
          fileName={registryFile}
        />
      ) : null}

      {tab === "translations" ? (
        <div className="space-y-6">
          <UploadPanel
            title="Translation import"
            description="Upload a Google Sheet export to create translated draft copies of existing content, scripts, or QOTD rows. Each row's source_id is the MongoDB id of the document being translated — copy it from the ID button on the Review & Publish page."
            templateLabel="Sheet with content_type, source_id, target_language, and translated fields."
            onDownloadTemplate={downloadTranslationTemplate}
            onImport={handleTranslationImport}
            parsing={translationParsing}
            result={translationResult}
            importing={translationImporting}
            imported={translationImportResult?.saved ?? 0}
            error={translationError}
            inputRef={translationInputRef}
            onFile={handleTranslationFile}
            fileName={translationFile}
          />

          {translationImportResult?.skipped?.length ? (
            <div className="card-surface p-4 text-sm">
              <p className="mb-2 font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="text-verdict-verify_first" />
                Skipped rows
              </p>
              {translationImportResult.skipped.slice(0, 10).map(({ row, reason }) => (
                <p key={row} className="text-verdict-dont_trust">
                  Row {row}: {reason}
                </p>
              ))}
            </div>
          ) : null}

          <div className="card-surface p-4">
            <h3 className="font-medium">Coverage report</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Document counts per language vs configured languages. Gaps highlight missing translations.
            </p>
            {coverage.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No jurisdiction configs found for coverage.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {coverage.map((entry) => (
                  <div
                    key={entry.jurisdiction}
                    className="rounded-lg border border-surface-light-border p-4 dark:border-surface-dark-border"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {entry.jurisdiction} — {entry.name}
                      </p>
                      <span
                        className={`text-xs font-medium ${entry.active ? "text-verdict-trust" : "text-verdict-verify_first"}`}
                      >
                        {entry.active ? "Live" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Languages: {(entry.languages || []).join(", ")}
                    </p>
                    {["content", "scripts", "qotd"].map((type) => {
                      const block = entry.coverage?.[type];
                      if (!block) return null;
                      return (
                        <div key={type} className="mt-3">
                          <p className="text-xs font-semibold uppercase text-gray-500">{type}</p>
                          <p className="text-sm">
                            {Object.entries(block.counts || {})
                              .map(([lang, count]) => `${lang}: ${count}`)
                              .join(" · ") || "No documents"}
                          </p>
                          {block.gaps?.length ? (
                            <ul className="mt-1 list-inside list-disc text-sm text-verdict-verify_first">
                              {block.gaps.map((gap) => (
                                <li key={`${type}-${gap.language}`}>{gap.message}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-sm text-verdict-trust">All configured languages covered.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
