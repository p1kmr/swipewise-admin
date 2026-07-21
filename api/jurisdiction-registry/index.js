import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import {
  importJurisdictionRegistry,
  listJurisdictionRegistry,
} from "../_lib/services/jurisdictionRegistry.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      const jurisdiction = req.query?.jurisdiction;
      return res.status(200).json(await listJurisdictionRegistry(jurisdiction));
    }

    if (req.method === "POST") {
      const { items } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return sendError(res, 400, "items array is required.");
      }
      const result = await importJurisdictionRegistry(items);
      return res.status(201).json(result);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    if (err.message?.includes("required") || err.message?.includes("invalid")) {
      return sendError(res, 400, err.message);
    }
    return handleServerError(res, err, "Jurisdiction registry API");
  }
}
