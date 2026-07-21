import { ObjectId } from "mongodb";
import { requireAuth } from "../_lib/auth.js";
import { getDb, toApiId } from "../_lib/mongodb.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const db = await getDb();
    const collection = db.collection("content");

    if (req.method === "GET") {
      const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(docs.map(toApiId));
    }

    if (req.method === "POST") {
      const { cards } = req.body || {};
      if (!Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({ error: "cards array is required." });
      }

      const now = new Date();
      const docs = cards.map((card) => ({
        ...card,
        approval: { published: false, reviewed_at: null },
        createdAt: now,
      }));

      const result = await collection.insertMany(docs);
      const ids = Object.values(result.insertedIds).map((id) => id.toString());
      return res.status(201).json({ saved: ids.length, ids });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    console.error("Content API error:", err);
    return res.status(500).json({ error: err.message || "Content request failed." });
  }
}
