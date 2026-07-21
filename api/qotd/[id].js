import { ObjectId } from "mongodb";
import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import { publishQotd } from "../_lib/services/qotd.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "PATCH") {
    return methodNotAllowed(res, ["PATCH"]);
  }

  const { id } = req.query;
  if (!id || !ObjectId.isValid(id)) {
    return sendError(res, 400, "Valid qotd id is required.");
  }

  try {
    const published = await publishQotd(id);
    if (!published) {
      return sendError(res, 404, "QOTD not found.");
    }
    return res.status(200).json({ id, published: true });
  } catch (err) {
    return handleServerError(res, err, "Publish qotd");
  }
}
