import { apiFetch } from "./apiClient.js";

export async function importScripts(scripts) {
  const { saved } = await apiFetch("/api/scripts", {
    method: "POST",
    body: JSON.stringify({ scripts }),
  });
  return saved;
}

export async function listScripts() {
  return apiFetch("/api/scripts");
}

export async function publishScripts(ids) {
  await apiFetch("/api/scripts/publish-batch", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}
