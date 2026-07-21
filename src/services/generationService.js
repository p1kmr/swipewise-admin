import { apiFetch } from "./apiClient.js";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = String(result).split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read the PDF file."));
    reader.readAsDataURL(file);
  });
}

export async function generateFromPdf(file, params) {
  const pdfBase64 = await readFileAsBase64(file);
  return apiFetch("/api/generate-from-pdf", {
    method: "POST",
    body: JSON.stringify({
      pdfBase64,
      mimeType: file.type || "application/pdf",
      params,
    }),
  });
}

export async function writeGenerationLineage({
  file,
  params,
  count_requested,
  count_returned,
  prompt_summary,
}) {
  return apiFetch("/api/generation/lineage", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/pdf",
      size: file.size,
      params,
      count_requested,
      count_returned,
      prompt_summary,
    }),
  });
}
