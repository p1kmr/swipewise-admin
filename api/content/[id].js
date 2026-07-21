import { ObjectId } from "mongodb";
import { requireAuth } from "../_lib/auth.js";
import { getDb } from "../_lib/mongodb.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { id } = req.query;
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Valid content id is required." });
  }

  try {
    const db = await getDb();
    const result = await db.collection("content").updateOne(
      { _id: new ObjectId(id) },
      { $set: { "approval.published": true, "approval.reviewed_at": new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Content not found." });
    }

    return res.status(200).json({ id, published: true });
  } catch (err) {
    console.error("Publish content error:", err);
    return res.status(500).json({ error: err.message || "Publish failed." });
  }
}
