import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import { getCoverageReport, importTranslations } from "../_lib/services/i18n.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      const jurisdiction = req.query?.jurisdiction;
      return res.status(200).json(await getCoverageReport(jurisdiction));
    }

    if (req.method === "POST") {
      const { rows } = req.body || {};
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendError(res, 400, "rows array is required.");
      }
      const result = await importTranslations(rows);
      return res.status(201).json(result);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    return handleServerError(res, err, "i18n import API");
  }
}
