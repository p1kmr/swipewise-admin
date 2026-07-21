import { apiFetch } from "./apiClient.js";

export async function importCards(cards) {
  const { saved } = await apiFetch("/api/content", {
    method: "POST",
    body: JSON.stringify({ cards }),
  });
  return saved;
}

export async function listContent() {
  return apiFetch("/api/content");
}

export async function publishCard(id) {
  await publishCards([id]);
}

export async function publishCards(ids) {
  await apiFetch("/api/content/publish-batch", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}
