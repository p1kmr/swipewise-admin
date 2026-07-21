import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import { setConfigActive } from "../_lib/services/config.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method !== "POST") {
      return methodNotAllowed(res, ["POST"]);
    }

    const { jurisdiction, active } = req.body || {};
    if (!jurisdiction) {
      return sendError(res, 400, "jurisdiction is required.");
    }

    const ok = await setConfigActive(jurisdiction, active);
    if (!ok) {
      return sendError(res, 404, "Jurisdiction config not found.");
    }

    return res.status(200).json({ jurisdiction: String(jurisdiction).trim().toUpperCase(), active: Boolean(active) });
  } catch (err) {
    return handleServerError(res, err, "Config active API");
  }
}
