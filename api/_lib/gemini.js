import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { QUESTION_FORMATS, DIFFICULTIES } from "./constants.js";

export const MODEL = "gemini-2.5-flash";

const MODULES = [
  "Fraud Awareness",
  "Investing Basics",
  "Risk Management",
  "Digital & Cyber Safety",
  "Regulatory & Compliance",
  "Retirement Planning",
  "Market Manipulation",
];

// Response schema — one object per generated question (v3 Question Bank shape).
const questionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    module: { type: SchemaType.STRING, format: "enum", enum: MODULES },
    category: { type: SchemaType.STRING },
    question_format: { type: SchemaType.STRING, format: "enum", enum: QUESTION_FORMATS },
    question_text: { type: SchemaType.STRING },
    scenario_context: { type: SchemaType.STRING },
    option_a: { type: SchemaType.STRING },
    option_b: { type: SchemaType.STRING },
    option_c: { type: SchemaType.STRING },
    option_d: { type: SchemaType.STRING },
    correct_answer: { type: SchemaType.STRING },
    explanation_feedback: { type: SchemaType.STRING },
    ai_explainer_context: { type: SchemaType.STRING },
    regulatory_reference: { type: SchemaType.STRING },
    difficulty: { type: SchemaType.STRING, format: "enum", enum: DIFFICULTIES },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: [
    "module",
    "category",
    "question_format",
    "question_text",
    "correct_answer",
    "explanation_feedback",
    "ai_explainer_context",
    "difficulty",
  ],
};

const responseSchema = { type: SchemaType.ARRAY, items: questionSchema };

export function buildPrompt(params) {
  const {
    jurisdiction = "the target jurisdiction",
    regulator = "",
    language_code = "en",
    difficulty = "",
    module = "",
    formats = [],
    count = 5,
  } = params;

  const formatLine = formats.length
    ? `- Use only these Question_Format values: ${formats.join(", ")}.`
    : "- Prefer Swipe_TrueFalse; use MCQ_Single or MCQ_Multi where the source supports distinct options.";

  return [
    "You are a content designer for SwipeWise, an investor-literacy training app.",
    `Read the attached source document and design ${count} distinct investor-education questions`,
    "that teach retail investors to spot misinformation, scams, and AI-generated deception.",
    "",
    "Rules:",
    "- Ground every question in facts, rules, or examples found in the attached document. Do not invent regulations.",
    `- Jurisdiction: ${jurisdiction}. Write for that market's rules and context.`,
    regulator ? `- Regulator: ${regulator}.` : "",
    `- Language: write all user-facing text using language code "${language_code}".`,
    module ? `- Learning module: ${module}.` : "",
    difficulty ? `- Difficulty for all questions: ${difficulty}.` : "- difficulty is Beginner, Intermediate, or Advanced.",
    formatLine,
    '- "category" is a short sub-topic label, e.g. "Phishing", "Ponzi Scheme", "Legitimate Practice".',
    '- For Swipe_TrueFalse and Scenario_Card: "correct_answer" is "TRUE" (statement is legitimate/correct) or "FALSE" (statement is a red flag/fraud). Leave option_a–d empty.',
    '- For MCQ_Single / MCQ_Multi: fill option_a–d and set "correct_answer" to the correct option letter(s), comma-separated for MCQ_Multi (e.g. "A,C").',
    '- "explanation_feedback" is the short teaching line shown to the user after they answer.',
    '- "ai_explainer_context" is richer grounding text used only by the in-app AI assistant — include nuance, edge cases, and how the answer would change under different facts.',
    '- "regulatory_reference" cites the backing rule where available, e.g. "SEC Rule 10b-5".',
    "- No personal data, no real named individuals, no real account numbers.",
    "Return ONLY the JSON array defined by the response schema.",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeAnswer(format, raw) {
  const value = String(raw || "").trim();
  if (format === "MCQ_Single" || format === "MCQ_Multi") {
    return value
      .split(/[,;|]/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }
  const upper = value.toUpperCase();
  return upper === "TRUE" || upper === "FALSE" ? upper : upper;
}

export function normalizeQuestions(questions, params) {
  const jurisdiction = String(params.jurisdiction || "").trim().toUpperCase();
  const regulator = String(params.regulator || "").trim().toUpperCase();
  const language_code = params.language_code || "en";

  return (Array.isArray(questions) ? questions : []).map((q) => {
    const format = q.question_format || "Swipe_TrueFalse";
    const options = {};
    ["a", "b", "c", "d"].forEach((k) => {
      const v = String(q[`option_${k}`] || "").trim();
      if (v) options[k.toUpperCase()] = v;
    });
    const isMcq = format === "MCQ_Single" || format === "MCQ_Multi";

    return {
      question_id: null,
      jurisdiction,
      regulator,
      language_code,
      module: q.module || "",
      category: q.category || "",
      question_format: format,
      question_text: q.question_text || "",
      scenario_context: q.scenario_context || "",
      options: isMcq ? options : {},
      correct_answer: normalizeAnswer(format, q.correct_answer),
      explanation_feedback: q.explanation_feedback || "",
      ai_explainer_context: q.ai_explainer_context || "",
      regulatory_reference: q.regulatory_reference || "",
      difficulty: q.difficulty || "Beginner",
      points: 10,
      media_url: "",
      tags: Array.isArray(q.tags) ? q.tags : [],
      status: "Draft",
      effective_date: null,
      expiry_date: null,
      created_by: "",
      reviewer: "",
    };
  });
}

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  es: "Spanish",
  fr: "French",
  ar: "Arabic",
  zh: "Chinese",
  pt: "Portuguese",
  ja: "Japanese",
  de: "German",
};

// Translate an array of strings into targetLang. Returns a same-length array (falls back to
// the original string for any element the model drops or leaves blank).
export async function translateStrings(strings, targetLang) {
  const list = Array.isArray(strings) ? strings : [];
  if (!list.length) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const langName = LANGUAGE_NAMES[targetLang] || targetLang;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      temperature: 0.2,
    },
  });

  const prompt = [
    `Translate each string in the JSON array below into ${langName} (language code "${targetLang}").`,
    "Return a JSON array of the SAME length and order, containing only the translated strings.",
    "Preserve meaning and tone. Do NOT translate proper nouns, regulator names (SEBI, SEC, FCA, MAS, ASIC, etc.), URLs, or single option letters.",
    "Keep numbers, currency symbols, and TRUE/FALSE intact.",
    "Input:",
    JSON.stringify(list),
  ].join("\n");

  const result = await model.generateContent(prompt);
  const out = JSON.parse(result.response.text());
  if (!Array.isArray(out) || out.length !== list.length) return list;
  return out.map((s, i) => (typeof s === "string" && s.trim() ? s : list[i]));
}

export async function generateCardsFromPdf(pdfBase64, mimeType, params) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.7,
    },
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mimeType || "application/pdf", data: pdfBase64 } },
          { text: buildPrompt(params) },
        ],
      },
    ],
  });

  const questions = JSON.parse(result.response.text());
  return normalizeQuestions(questions, params);
}
