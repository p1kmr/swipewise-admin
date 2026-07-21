import { ObjectId } from "mongodb";
import { requireAuth } from "../_lib/auth.js";
import { getDb } from "../_lib/mongodb.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required." });
  }

  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (objectIds.length === 0) {
    return res.status(400).json({ error: "No valid ids provided." });
  }

  try {
    const db = await getDb();
    const result = await db.collection("content").updateMany(
      { _id: { $in: objectIds } },
      { $set: { "approval.published": true, "approval.reviewed_at": new Date() } }
    );

    return res.status(200).json({ published: result.modifiedCount });
  } catch (err) {
    console.error("Batch publish error:", err);
    return res.status(500).json({ error: err.message || "Batch publish failed." });
  }
}
