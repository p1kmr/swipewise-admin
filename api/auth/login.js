import { signToken, verifyAdminCredentials } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return sendError(res, 400, "Email and password are required.");
    }

    if (!verifyAdminCredentials(email, password)) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const token = signToken(email);
    return res.status(200).json({
      token,
      user: { email, role: "admin" },
    });
  } catch (err) {
    return handleServerError(res, err, "Login");
  }
}
