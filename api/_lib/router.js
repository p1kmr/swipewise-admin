import { ObjectId } from "mongodb";
import { signToken, verifyAdminCredentials, getBearerToken, verifyToken } from "./auth.js";
import { handleServerError, methodNotAllowed, sendError } from "./http.js";
import {
  importContent,
  listContent,
  publishContentBatch,
  setContentStatus,
  updateContent,
  deleteContent,
  clearAllContent,
} from "./services/content.js";
import { reviseQuestion } from "./gemini.js";
import { requireAuth } from "./auth.js";

function routeKey(segments) {
  return segments.join("/");
}

async function publishBatch(req, res, publishFn, label) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "ids array is required.");
  }
  if (!ids.some((id) => ObjectId.isValid(id))) {
    return sendError(res, 400, "No valid ids provided.");
  }

  try {
    return res.status(200).json(await publishFn(ids));
  } catch (err) {
    return handleServerError(res, err, label);
  }
}

export async function dispatchRoute(req, res, segments) {
  const key = routeKey(segments);

  try {
    switch (key) {
      case "auth/login": {
        if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
        const { email, password } = req.body || {};
        if (!email || !password) return sendError(res, 400, "Email and password are required.");
        if (!verifyAdminCredentials(email, password)) {
          return sendError(res, 401, "Invalid email or password.");
        }
        const token = signToken(email);
        return res.status(200).json({ token, user: { email, role: "admin" } });
      }

      case "auth/me": {
        if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
        const token = getBearerToken(req);
        if (!token) return sendError(res, 401, "Authentication required.");
        try {
          const payload = verifyToken(token);
          return res.status(200).json({ user: { email: payload.email, role: payload.role } });
        } catch {
          return sendError(res, 401, "Invalid or expired session.");
        }
      }

      case "content": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method === "GET") return res.status(200).json(await listContent());
        if (req.method === "POST") {
          const { questions } = req.body || {};
          if (!Array.isArray(questions) || questions.length === 0) {
            return sendError(res, 400, "questions array is required.");
          }
          return res.status(201).json(await importContent(questions));
        }
        return methodNotAllowed(res, ["GET", "POST"]);
      }

      case "content/publish-batch":
        return publishBatch(req, res, publishContentBatch, "Batch publish");

      case "content/clear-all": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
        return res.status(200).json(await clearAllContent());
      }

      case "content/ai-edit": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
        const { fields, instruction } = req.body || {};
        if (!fields || !instruction) {
          return sendError(res, 400, "fields and instruction are required.");
        }
        return res.status(200).json(await reviseQuestion(fields, instruction));
      }

      case "content/status": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
        const { ids, status } = req.body || {};
        if (!Array.isArray(ids) || ids.length === 0) {
          return sendError(res, 400, "ids array is required.");
        }
        if (!status) return sendError(res, 400, "status is required.");
        return res.status(200).json(await setContentStatus(ids, status));
      }

      default: {
        // content/:id  → PATCH (update) / DELETE (hard delete)
        if (segments[0] === "content" && segments.length === 2) {
          const user = requireAuth(req, res);
          if (!user) return;
          const id = segments[1];
          if (req.method === "PATCH") {
            return res.status(200).json(await updateContent(id, req.body || {}));
          }
          if (req.method === "DELETE") {
            return res.status(200).json(await deleteContent(id));
          }
          return methodNotAllowed(res, ["PATCH", "DELETE"]);
        }
        return sendError(res, 404, "Not found.");
      }
    }
  } catch (err) {
    if (err.message?.includes("required") || err.message?.includes("invalid")) {
      return sendError(res, 400, err.message);
    }
    return handleServerError(res, err, key);
  }
}
