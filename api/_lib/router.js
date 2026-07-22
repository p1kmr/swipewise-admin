import { ObjectId } from "mongodb";
import { signToken, verifyAdminCredentials, getBearerToken, verifyToken } from "./auth.js";
import {
  handleServerError,
  methodNotAllowed,
  sendError,
} from "./http.js";
import {
  importContent,
  listContent,
  publishContentBatch,
  setContentStatus,
} from "./services/content.js";
import { importScripts, listScripts, publishScriptsBatch } from "./services/scripts.js";
import { importQotd, listQotd, publishQotdBatch } from "./services/qotd.js";
import {
  listConfigs,
  seedPrototypeConfigs,
  setConfigActive,
  upsertConfig,
} from "./services/config.js";
import { importJurisdictionData, listJurisdictionData } from "./services/jurisdictionData.js";
import {
  importJurisdictionRegistry,
  listJurisdictionRegistry,
} from "./services/jurisdictionRegistry.js";
import { getCoverageReport, importTranslations, translateWithAI } from "./services/i18n.js";
import { writeGenerationLineage } from "./services/lineage.js";
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

      case "scripts": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method === "GET") return res.status(200).json(await listScripts());
        if (req.method === "POST") {
          const { scripts } = req.body || {};
          if (!Array.isArray(scripts) || scripts.length === 0) {
            return sendError(res, 400, "scripts array is required.");
          }
          return res.status(201).json(await importScripts(scripts));
        }
        return methodNotAllowed(res, ["GET", "POST"]);
      }

      case "scripts/publish-batch":
        return publishBatch(req, res, publishScriptsBatch, "Scripts batch publish");

      case "qotd": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method === "GET") return res.status(200).json(await listQotd());
        if (req.method === "POST") {
          const { items } = req.body || {};
          if (!Array.isArray(items) || items.length === 0) {
            return sendError(res, 400, "items array is required.");
          }
          return res.status(201).json(await importQotd(items));
        }
        return methodNotAllowed(res, ["GET", "POST"]);
      }

      case "qotd/publish-batch":
        return publishBatch(req, res, publishQotdBatch, "QOTD batch publish");

      case "config": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method === "GET") return res.status(200).json(await listConfigs());
        if (req.method === "POST") {
          const body = req.body || {};
          if (body.seed === "prototype") {
            return res.status(201).json(await seedPrototypeConfigs());
          }
          return res.status(201).json(await upsertConfig(body));
        }
        return methodNotAllowed(res, ["GET", "POST"]);
      }

      case "config/set-active": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
        const { jurisdiction, active } = req.body || {};
        if (!jurisdiction) return sendError(res, 400, "jurisdiction is required.");
        const ok = await setConfigActive(jurisdiction, active);
        if (!ok) return sendError(res, 404, "Jurisdiction config not found.");
        return res.status(200).json({
          jurisdiction: String(jurisdiction).trim().toUpperCase(),
          active: Boolean(active),
        });
      }

      case "jurisdiction-data": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method === "GET") {
          return res.status(200).json(await listJurisdictionData(req.query?.jurisdiction));
        }
        if (req.method === "POST") {
          const { items } = req.body || {};
          if (!Array.isArray(items) || items.length === 0) {
            return sendError(res, 400, "items array is required.");
          }
          return res.status(201).json(await importJurisdictionData(items));
        }
        return methodNotAllowed(res, ["GET", "POST"]);
      }

      case "jurisdiction-registry": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method === "GET") {
          return res.status(200).json(await listJurisdictionRegistry(req.query?.jurisdiction));
        }
        if (req.method === "POST") {
          const { items } = req.body || {};
          if (!Array.isArray(items) || items.length === 0) {
            return sendError(res, 400, "items array is required.");
          }
          return res.status(201).json(await importJurisdictionRegistry(items));
        }
        return methodNotAllowed(res, ["GET", "POST"]);
      }

      case "i18n/import": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method === "GET") {
          return res.status(200).json(await getCoverageReport(req.query?.jurisdiction));
        }
        if (req.method === "POST") {
          const { rows } = req.body || {};
          if (!Array.isArray(rows) || rows.length === 0) {
            return sendError(res, 400, "rows array is required.");
          }
          return res.status(201).json(await importTranslations(rows));
        }
        return methodNotAllowed(res, ["GET", "POST"]);
      }

      case "i18n/translate": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
        const { content_type, ids, target_language } = req.body || {};
        if (!Array.isArray(ids) || ids.length === 0) {
          return sendError(res, 400, "ids array is required.");
        }
        if (!target_language) return sendError(res, 400, "target_language is required.");
        return res.status(200).json(await translateWithAI({ content_type, ids, target_language }));
      }

      case "generation/lineage": {
        const user = requireAuth(req, res);
        if (!user) return;
        if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
        return res.status(201).json(await writeGenerationLineage(user.email, req.body || {}));
      }

      default:
        return sendError(res, 404, "Not found.");
    }
  } catch (err) {
    if (err.message?.includes("required") || err.message?.includes("invalid")) {
      return sendError(res, 400, err.message);
    }
    return handleServerError(res, err, key);
  }
}
