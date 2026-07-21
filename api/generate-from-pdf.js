import { requireAuth } from "./_lib/auth.js";
import { MAX_PDF_BYTES } from "./_lib/constants.js";
import { MODEL, buildPrompt, generateCardsFromPdf } from "./_lib/gemini.js";
import { handleServerError, methodNotAllowed, sendError } from "./_lib/http.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const { pdfBase64, mimeType, params = {} } = req.body || {};
    if (!pdfBase64) {
      return sendError(res, 400, "pdfBase64 is required.");
    }

    const byteLength = Buffer.byteLength(pdfBase64, "base64");
    if (byteLength > MAX_PDF_BYTES) {
      return sendError(
        res,
        413,
        `PDF is too large (${Math.round(byteLength / 1024)} KB). Keep under ${MAX_PDF_BYTES / 1024 / 1024} MB for the POC.`
      );
    }

    const cards = await generateCardsFromPdf(pdfBase64, mimeType, params);
    if (!cards.length) {
      return sendError(res, 422, "The model returned no cards.");
    }

    return res.status(200).json({
      cards,
      model: MODEL,
      prompt_summary: buildPrompt(params).slice(0, 500),
    });
  } catch (err) {
    return handleServerError(res, err, "Generate from PDF");
  }
}
