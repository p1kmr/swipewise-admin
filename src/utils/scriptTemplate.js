const EXAMPLE_SCRIPT = {
  jurisdiction: "IN",
  language_code: "en",
  title: "Spotting guaranteed-return scams",
  nodes: [
    {
      node_id: "start",
      message: "Someone promises 30% monthly returns. What do you do?",
      wisebot_avatar_state: "concerned",
      choices: [
        { label: "Invest immediately", next_node: "wrong" },
        { label: "Verify on SEBI list first", next_node: "end_ok" },
      ],
      is_end: false,
      key_learning: "",
    },
    {
      node_id: "wrong",
      message: "That urgency is a red flag. Guaranteed high returns are almost always scams.",
      wisebot_avatar_state: "encouraging",
      choices: [],
      is_end: true,
      key_learning: "Guaranteed high returns are a classic scam signal.",
    },
    {
      node_id: "end_ok",
      message: "Well done — verification first is the right habit.",
      wisebot_avatar_state: "happy",
      choices: [],
      is_end: true,
      key_learning: "Always verify advisers on the official regulator list.",
    },
  ],
};

export function downloadScriptTemplate() {
  const blob = new Blob([JSON.stringify(EXAMPLE_SCRIPT, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "swipewise-script-template.json";
  link.click();
  URL.revokeObjectURL(url);
}

export { EXAMPLE_SCRIPT };
