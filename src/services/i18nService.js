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
