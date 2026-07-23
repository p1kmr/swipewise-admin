import * as XLSX from "xlsx";
import {
  QUESTION_COLUMNS,
  QUESTION_REQUIRED_COLUMNS,
  JURISDICTION_CODES,
  LANGUAGE_CODES,
  MODULES,
  CATEGORIES,
  QUESTION_FORMATS,
  DIFFICULTIES,
  STATUSES,
} from "../constants/enums.js";

// README lines shown on the first sheet.
const README_ROWS = [
  ["SwipeWise – Question Master Upload Template"],
  ["Admin Module | Bulk Question Import Specification"],
  [],
  ["1. Purpose"],
  ["Fill the 'Questions' sheet only — one row per question. On upload, the backend validates each row and inserts it in MongoDB as a Draft."],
  [],
  ["2. How to fill"],
  ["• Do not edit the column headers."],
  ["• Mandatory columns are required. The dropdown columns (Jurisdiction_Code, Language_Code, Module, Question_Format, Difficulty, Status) must use a value from the Lookup_Values sheet."],
  ["• Swipe_TrueFalse: set Correct_Answer to TRUE or FALSE and leave Option_A–D blank. TRUE = legitimate/correct, FALSE = red flag/fraud."],
  ["• MCQ_Single / MCQ_Multi: fill Option_A–D and put the correct letter(s) in Correct_Answer (comma-separated for MCQ_Multi, e.g. 'A,C')."],
  ["• Explanation_Feedback is the short teaching line shown to every user. AI_Explainer_Context is longer grounding text used only by the in-app AI assistant."],
  ["• Nothing goes live on import — every row is saved as Draft. Publish it from the dashboard to set it Active."],
  [],
  ["3. Delete the sample rows on the Questions sheet before uploading a production batch."],
];

// Two worked samples (one swipe, one MCQ) mapped to the canonical column order.
const SAMPLE_ROWS = [
  {
    Question_ID: "",
    Jurisdiction_Code: "IN",
    Regulator: "SEBI",
    Language_Code: "en",
    Module: "Fraud Awareness",
    Category: "Guaranteed Returns Scam",
    Question_Format: "Swipe_TrueFalse",
    Question_Text:
      "A Telegram 'VIP trading group' promises 100% guaranteed monthly profit if you deposit into their app.",
    Scenario_Context:
      "The group shares daily screenshots of huge gains and pressures members to deposit before a 'slot closes tonight'.",
    Option_A: "",
    Option_B: "",
    Option_C: "",
    Option_D: "",
    Correct_Answer: "FALSE",
    Explanation_Feedback:
      "No legitimate trading group can guarantee fixed monthly profits — this is a classic guaranteed-return red flag.",
    AI_Explainer_Context:
      "Guaranteed fixed returns plus deposit-now urgency are the two most reliable signals of a Ponzi-style scam. Profit screenshots are trivially fabricated; genuine trading carries variable, market-linked risk.",
    Regulatory_Reference: "SEBI (PFUTP) Regulations, 2003, Reg 4",
    Difficulty: "Beginner",
    Points: 10,
    Media_URL: "",
    Tags: "guaranteed returns,telegram,ponzi",
    Status: "Draft",
    Effective_Date: "2026-08-01",
    Expiry_Date: "",
    Created_By: "admin",
    Reviewer: "",
  },
  {
    Question_ID: "",
    Jurisdiction_Code: "GLOBAL",
    Regulator: "GLOBAL",
    Language_Code: "en",
    Module: "Investing Basics",
    Category: "Legitimate Practice",
    Question_Format: "MCQ_Single",
    Question_Text: "Which of these best confirms an investment adviser is legitimate?",
    Scenario_Context: "",
    Option_A: "Their social media follower count",
    Option_B: "Their registration with the market regulator",
    Option_C: "How fast they reply to messages",
    Option_D: "Whether they offer a free trial",
    Correct_Answer: "B",
    Explanation_Feedback:
      "Only registration with the market regulator confirms an adviser is authorised — follower counts and response speed prove nothing.",
    AI_Explainer_Context:
      "Reinforce that the single reliable check is looking up the adviser on the regulator's official register; social proof and responsiveness are easily faked.",
    Regulatory_Reference: "IOSCO Investor Protection Principles",
    Difficulty: "Beginner",
    Points: 10,
    Media_URL: "",
    Tags: "adviser,verification,legit",
    Status: "Draft",
    Effective_Date: "2026-08-01",
    Expiry_Date: "",
    Created_By: "admin",
    Reviewer: "",
  },
];

// Build the Lookup_Values sheet: one column per dropdown, values down each column.
function buildLookupSheet() {
  const columns = {
    Jurisdiction_Code: JURISDICTION_CODES,
    Language_Code: LANGUAGE_CODES,
    Module: MODULES,
    Category: CATEGORIES,
    Question_Format: QUESTION_FORMATS,
    Difficulty: DIFFICULTIES,
    Status: STATUSES,
  };
  const headers = Object.keys(columns);
  const maxLen = Math.max(...Object.values(columns).map((v) => v.length));
  const aoa = [headers];
  for (let i = 0; i < maxLen; i++) {
    aoa.push(headers.map((h) => columns[h][i] ?? ""));
  }
  return XLSX.utils.aoa_to_sheet(aoa);
}

// Build the Questions sheet: header row + Mandatory/Optional legend row + samples.
function buildQuestionsSheet() {
  const legend = QUESTION_COLUMNS.map((c) =>
    QUESTION_REQUIRED_COLUMNS.includes(c) ? "Mandatory" : "Optional"
  );
  const sampleRows = SAMPLE_ROWS.map((row) => QUESTION_COLUMNS.map((c) => row[c] ?? ""));
  const aoa = [QUESTION_COLUMNS, legend, ...sampleRows];
  return XLSX.utils.aoa_to_sheet(aoa);
}

// Build and download the 3-sheet v3 question-bank template.
export function downloadQuestionTemplate() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(README_ROWS), "README");
  XLSX.utils.book_append_sheet(wb, buildQuestionsSheet(), "Questions");
  XLSX.utils.book_append_sheet(wb, buildLookupSheet(), "Lookup_Values");
  XLSX.writeFile(wb, "swipewise-question-bank-template.xlsx");
}
