import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import { importContent, listContent } from "../_lib/services/content.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json(await listContent());
    }

    if (req.method === "POST") {
      const { cards } = req.body || {};
      if (!Array.isArray(cards) || cards.length === 0) {
        return sendError(res, 400, "cards array is required.");
      }
      const result = await importContent(cards);
      return res.status(201).json(result);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    return handleServerError(res, err, "Content API");
  }
}
