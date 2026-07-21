import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import { importQotd, listQotd } from "../_lib/services/qotd.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json(await listQotd());
    }

    if (req.method === "POST") {
      const { items } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return sendError(res, 400, "items array is required.");
      }
      const result = await importQotd(items);
      return res.status(201).json(result);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    return handleServerError(res, err, "QOTD API");
  }
}
