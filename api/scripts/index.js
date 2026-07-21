import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import { importScripts, listScripts } from "../_lib/services/scripts.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json(await listScripts());
    }

    if (req.method === "POST") {
      const { scripts } = req.body || {};
      if (!Array.isArray(scripts) || scripts.length === 0) {
        return sendError(res, 400, "scripts array is required.");
      }
      const result = await importScripts(scripts);
      return res.status(201).json(result);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    return handleServerError(res, err, "Scripts API");
  }
}
