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

// POC utility: clear ALL test data across every collection.
export async function clearAllQuestions() {
  return apiFetch("/api/content/clear-all", { method: "POST" });
}

// Ask the LLM to revise a question per an instruction. Returns revised editable fields.
export async function aiEditQuestion(fields, instruction) {
  return apiFetch("/api/content/ai-edit", {
    method: "POST",
    body: JSON.stringify({ fields, instruction }),
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read the PDF file."));
    reader.readAsDataURL(file);
  });
}

export async function publishQotd(id) {
  return apiFetch("/api/content/qotd/publish", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function unpublishQotd(id) {
  return apiFetch("/api/content/qotd/unpublish", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

// Generate draft questions from a source PDF via the LLM. Returns { cards, model, prompt_summary }.
export async function generateFromPdf(file, params) {
  const pdfBase64 = await readFileAsBase64(file);
  return apiFetch("/api/generate-from-pdf", {
    method: "POST",
    body: JSON.stringify({ pdfBase64, mimeType: file.type || "application/pdf", params }),
  });
}
