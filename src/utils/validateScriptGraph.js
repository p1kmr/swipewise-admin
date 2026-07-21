import { WISEBOT_AVATAR_STATES } from "../constants/enums.js";

// Validate a WiseBot script document (single script per JSON file).
// Returns { valid: scriptDoc | null, errors: string[] }.
export function validateScriptGraph(raw) {
  const errors = [];

  if (!raw || typeof raw !== "object") {
    return { valid: null, errors: ["Root must be a JSON object."] };
  }

  const jurisdiction = String(raw.jurisdiction || "").trim();
  const language_code = String(raw.language_code || "").trim();
  const title = String(raw.title || "").trim();
  const nodes = raw.nodes;

  if (!jurisdiction) errors.push("jurisdiction is required.");
  if (!language_code) errors.push("language_code is required.");
  if (!Array.isArray(nodes) || nodes.length === 0) {
    errors.push("nodes must be a non-empty array.");
    return { valid: null, errors };
  }

  const ids = new Set();
  nodes.forEach((node, index) => {
    const prefix = `nodes[${index}]`;
    const nodeId = String(node?.node_id || "").trim();
    if (!nodeId) {
      errors.push(`${prefix}: node_id is required.`);
      return;
    }
    if (ids.has(nodeId)) errors.push(`${prefix}: duplicate node_id "${nodeId}".`);
    ids.add(nodeId);

    if (!String(node.message || "").trim()) {
      errors.push(`${prefix}: message is required.`);
    }

    const avatar = node.wisebot_avatar_state;
    if (avatar && !WISEBOT_AVATAR_STATES.includes(avatar)) {
      errors.push(`${prefix}: invalid wisebot_avatar_state "${avatar}".`);
    }

    const choices = Array.isArray(node.choices) ? node.choices : [];
    choices.forEach((choice, ci) => {
      if (!String(choice?.label || "").trim()) {
        errors.push(`${prefix}.choices[${ci}]: label is required.`);
      }
      const next = String(choice?.next_node || "").trim();
      if (!next) {
        errors.push(`${prefix}.choices[${ci}]: next_node is required.`);
      }
    });

    if (node.is_end && !String(node.key_learning || "").trim()) {
      errors.push(`${prefix}: key_learning is required when is_end is true.`);
    }
  });

  if (!ids.has("start")) {
    errors.push('A node with node_id "start" is required.');
  }

  const hasEnd = nodes.some((n) => n.is_end);
  if (!hasEnd) errors.push("At least one node must have is_end: true.");

  nodes.forEach((node, index) => {
    const choices = Array.isArray(node.choices) ? node.choices : [];
    choices.forEach((choice, ci) => {
      const next = String(choice?.next_node || "").trim();
      if (next && !ids.has(next)) {
        errors.push(`nodes[${index}].choices[${ci}]: next_node "${next}" does not exist.`);
      }
    });
  });

  if (ids.has("start")) {
    const reachable = new Set();
    const queue = ["start"];
    while (queue.length) {
      const current = queue.shift();
      if (reachable.has(current)) continue;
      reachable.add(current);
      const node = nodes.find((n) => n.node_id === current);
      if (!node) continue;
      (node.choices || []).forEach((c) => {
        if (c.next_node) queue.push(c.next_node);
      });
    }
    nodes.forEach((node) => {
      if (!reachable.has(node.node_id)) {
        errors.push(`Orphan node "${node.node_id}" is not reachable from "start".`);
      }
    });
  }

  if (errors.length) return { valid: null, errors };

  return {
    valid: {
      jurisdiction,
      language_code,
      title: title || undefined,
      nodes: nodes.map((node) => ({
        node_id: String(node.node_id).trim(),
        message: String(node.message).trim(),
        wisebot_avatar_state: node.wisebot_avatar_state || "neutral",
        choices: (node.choices || []).map((c) => ({
          label: String(c.label).trim(),
          next_node: String(c.next_node).trim(),
        })),
        is_end: Boolean(node.is_end),
        key_learning: String(node.key_learning || "").trim(),
      })),
    },
    errors: [],
  };
}

// Parse uploaded .json — single script object per file.
export async function parseScriptFile(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { valid: null, errors: ["Invalid JSON file."] };
  }
  return validateScriptGraph(data);
}
