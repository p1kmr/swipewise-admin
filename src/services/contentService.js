import { apiFetch } from "./apiClient.js";

// Import parsed questions. Returns { saved, inserted, updated, ids }.
export async function importQuestions(questions) {
  return apiFetch("/api/content", {
    method: "POST",
    body: JSON.stringify({ questions }),
  });
}

export async function listContent() {
  return apiFetch("/api/content");
}

export async function publishQuestions(ids) {
  await apiFetch("/api/content/publish-batch", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// Set Draft / Inactive / Archived (Active is done via publishQuestions).
export async function setQuestionStatus(ids, status) {
  await apiFetch("/api/content/status", {
    method: "POST",
    body: JSON.stringify({ ids, status }),
  });
}
