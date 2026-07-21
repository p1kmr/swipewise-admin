import { requireAuth } from "../_lib/auth.js";
import { getDb, toApiId } from "../_lib/mongodb.js";
import { MODEL } from "../_lib/gemini.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const {
      fileName,
      contentType,
      size,
      params = {},
      count_requested,
      count_returned,
      prompt_summary,
    } = req.body || {};

    const db = await getDb();
    const now = new Date();

    const rawResult = await db.collection("raw_data").insertOne({
      fileName: fileName || null,
      contentType: contentType || "application/pdf",
      size: size || null,
      params,
      adminEmail: user.email,
      created_at: now,
    });

    const logResult = await db.collection("generation_logs").insertOne({
      rawDataId: rawResult.insertedId.toString(),
      fileName: fileName || null,
      model: MODEL,
      params,
      prompt_summary: prompt_summary || null,
      count_requested: count_requested ?? null,
      count_returned: count_returned ?? null,
      adminEmail: user.email,
      created_at: now,
    });

    return res.status(201).json({
      rawDataId: rawResult.insertedId.toString(),
      generationLogId: logResult.insertedId.toString(),
      raw_data: toApiId({ _id: rawResult.insertedId, fileName, contentType, size, params, created_at: now }),
    });
  } catch (err) {
    console.error("Lineage write error:", err);
    return res.status(500).json({ error: err.message || "Could not save generation lineage." });
  }
}
