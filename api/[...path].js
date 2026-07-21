import { sendError } from "./_lib/http.js";
import { dispatchRoute } from "./_lib/router.js";

export default async function handler(req, res) {
  const raw = req.query.path;
  const segments = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (!segments.length) {
    return sendError(res, 404, "Not found.");
  }
  return dispatchRoute(req, res, segments);
}
