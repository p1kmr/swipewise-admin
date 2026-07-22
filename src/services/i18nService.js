import { apiFetch } from "./apiClient.js";

export async function importTranslations(rows) {
  return apiFetch("/api/i18n/import", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

export async function getCoverageReport(jurisdiction) {
  const qs = jurisdiction ? `?jurisdiction=${encodeURIComponent(jurisdiction)}` : "";
  return apiFetch(`/api/i18n/import${qs}`);
}

// AI translation — create translated Draft copies of selected documents (no source_id needed).
export async function translateWithAI({ content_type, ids, target_language }) {
  return apiFetch("/api/i18n/translate", {
    method: "POST",
    body: JSON.stringify({ content_type, ids, target_language }),
  });
}
