import { ObjectId } from "mongodb";
import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import { publishQotdBatch } from "../_lib/services/qotd.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "ids array is required.");
  }

  if (!ids.some((id) => ObjectId.isValid(id))) {
    return sendError(res, 400, "No valid ids provided.");
  }

  try {
    return res.status(200).json(await publishQotdBatch(ids));
  } catch (err) {
    return handleServerError(res, err, "Batch publish qotd");
  }
}
