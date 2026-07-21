import { requireAuth } from "../_lib/auth.js";
import { MODEL, generateCardsFromPdf, buildPrompt } from "../_lib/gemini.js";

const MAX_PDF_BYTES = 4 * 1024 * 1024;

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { pdfBase64, mimeType, params = {} } = req.body || {};
    if (!pdfBase64) {
      return res.status(400).json({ error: "pdfBase64 is required." });
    }

    const byteLength = Buffer.byteLength(pdfBase64, "base64");
    if (byteLength > MAX_PDF_BYTES) {
      return res.status(413).json({
        error: `PDF is too large (${Math.round(byteLength / 1024)} KB). Keep under ${MAX_PDF_BYTES / 1024 / 1024} MB for the POC.`,
      });
    }

    const cards = await generateCardsFromPdf(pdfBase64, mimeType, params);
    if (!cards.length) {
      return res.status(422).json({ error: "The model returned no cards." });
    }

    return res.status(200).json({
      cards,
      model: MODEL,
      prompt_summary: buildPrompt(params).slice(0, 500),
    });
  } catch (err) {
    console.error("Generate from PDF error:", err);
    return res.status(500).json({ error: err.message || "Generation failed." });
  }
}
