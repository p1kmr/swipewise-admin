import { COLLECTIONS } from "../constants.js";
import { MODEL } from "../gemini.js";
import { getDb, toApiId } from "../mongodb.js";

export async function writeGenerationLineage(adminEmail, payload) {
  const {
    fileName,
    contentType,
    size,
    params = {},
    count_requested,
    count_returned,
    prompt_summary,
  } = payload;

  const db = await getDb();
  const now = new Date();

  const rawResult = await db.collection(COLLECTIONS.RAW_DATA).insertOne({
    fileName: fileName || null,
    contentType: contentType || "application/pdf",
    size: size || null,
    params,
    adminEmail,
    created_at: now,
  });

  const logResult = await db.collection(COLLECTIONS.GENERATION_LOGS).insertOne({
    rawDataId: rawResult.insertedId.toString(),
    fileName: fileName || null,
    model: MODEL,
    params,
    prompt_summary: prompt_summary || null,
    count_requested: count_requested ?? null,
    count_returned: count_returned ?? null,
    adminEmail,
    created_at: now,
  });

  return {
    rawDataId: rawResult.insertedId.toString(),
    generationLogId: logResult.insertedId.toString(),
    raw_data: toApiId({
      _id: rawResult.insertedId,
      fileName,
      contentType,
      size,
      params,
      created_at: now,
    }),
  };
}
