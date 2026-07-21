import { sendError } from "./_lib/http.js";
import { dispatchRoute } from "./_lib/router.js";

function pathSegments(req) {
  const raw = req.query.path;
  if (Array.isArray(raw) && raw.length) return raw;
  if (typeof raw === "string" && raw) return raw.split("/").filter(Boolean);

  const url = req.url || "";
  const match = url.match(/^\/api\/(.+?)(?:\?|$)/);
  if (match) return match[1].split("/").filter(Boolean);
  return [];
}

export default async function handler(req, res) {
  const segments = pathSegments(req);
  if (!segments.length) {
    return sendError(res, 404, "Not found.");
  }
  return dispatchRoute(req, res, segments);
}
