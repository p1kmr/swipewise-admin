import { apiFetch } from "./apiClient.js";

export async function importQotd(items) {
  const { saved } = await apiFetch("/api/qotd", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return saved;
}

export async function listQotd() {
  return apiFetch("/api/qotd");
}

export async function publishQotdItems(ids) {
  await apiFetch("/api/qotd/publish-batch", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}
