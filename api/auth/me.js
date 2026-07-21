import { getBearerToken, verifyToken } from "../_lib/auth.js";
import { methodNotAllowed, sendError } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const token = getBearerToken(req);
  if (!token) {
    return sendError(res, 401, "Authentication required.");
  }

  try {
    const payload = verifyToken(token);
    return res.status(200).json({ user: { email: payload.email, role: payload.role } });
  } catch {
    return sendError(res, 401, "Invalid or expired session.");
  }
}
