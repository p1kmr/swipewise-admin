import { apiFetch } from "./apiClient.js";

export async function importJurisdictionData(items) {
  const { saved } = await apiFetch("/api/jurisdiction-data", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return saved;
}

export async function listJurisdictionData(jurisdiction) {
  const qs = jurisdiction ? `?jurisdiction=${encodeURIComponent(jurisdiction)}` : "";
  return apiFetch(`/api/jurisdiction-data${qs}`);
}
