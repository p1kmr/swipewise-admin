import { apiFetch } from "./apiClient.js";

export async function importJurisdictionRegistry(items) {
  const { saved } = await apiFetch("/api/jurisdiction-registry", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return saved;
}

export async function listJurisdictionRegistry(jurisdiction) {
  const qs = jurisdiction ? `?jurisdiction=${encodeURIComponent(jurisdiction)}` : "";
  return apiFetch(`/api/jurisdiction-registry${qs}`);
}
