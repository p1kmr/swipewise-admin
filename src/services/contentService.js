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

// Update a single question's editable fields (PATCH). Returns the updated doc.
export async function updateQuestion(id, fields) {
  return apiFetch(`/api/content/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

// Permanently delete a question.
export async function deleteQuestion(id) {
  return apiFetch(`/api/content/${id}`, { method: "DELETE" });
}

// Ask the LLM to revise a question per an instruction. Returns revised editable fields.
export async function aiEditQuestion(fields, instruction) {
  return apiFetch("/api/content/ai-edit", {
    method: "POST",
    body: JSON.stringify({ fields, instruction }),
  });
}
