import { getBearerToken, verifyToken } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const payload = verifyToken(token);
    return res.status(200).json({ user: { email: payload.email, role: payload.role } });
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}
