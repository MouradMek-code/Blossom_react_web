import allQuestions from "../data/questions.json";
import { questionsFor } from "./connection";

// "Edit profile": the sign-up answers that can be completed or changed later,
// grouped like the sign-up steps. Gender, orientation and age stay as they
// were at sign-up; "dating / language exchange" has its own switch.
export const EDIT_SECTIONS = [
  { key: "story", fields: ["bio", "occupation"] },
  { key: "looking", fields: ["relationship_goal", "first_date_preference"] },
  { key: "languages", fields: ["language_name", "learning_language_name"] },
  { key: "basics", fields: ["height_cm", "education", "personality_type"] },
  { key: "lifestyle", fields: ["smoking", "drinking", "exercise_frequency", "has_pets"] },
  { key: "personal", fields: ["has_children", "wants_children", "past_relationships_count", "last_breakup_reason"] },
];

// The plain answers (the languages are lists, apart).
export const DETAIL_FIELDS = EDIT_SECTIONS.flatMap((s) => s.fields).filter(
  (f) => f !== "language_name" && f !== "learning_language_name",
);

const names = (list) => (list || []).map((l) => l.language_name || l).filter(Boolean);

// A profile as the edit form's answers.
export function answersFrom(profile) {
  const answer = { connection_type: profile?.connection_type || "both" };
  for (const field of DETAIL_FIELDS) answer[field] = profile?.[field] || "";
  answer.language_name = names(profile?.languages);
  answer.learning_language_name = names(profile?.learning_languages);
  return answer;
}

// The edit form's answers as PUT /profile/details wants them.
export function detailsBody(answer) {
  const body = {};
  for (const field of DETAIL_FIELDS) body[field] = (answer[field] || "").trim() || null;
  body.languages = answer.language_name || [];
  body.learning_languages = answer.learning_language_name || [];
  return body;
}

// The sections and questions that apply to this person (someone only here
// for language exchange skips the dating ones).
export function editSections(connectionType) {
  const questions = questionsFor(allQuestions, connectionType);
  return EDIT_SECTIONS.map((section) => ({
    ...section,
    questions: section.fields.map((f) => questions.find((q) => q.field === f)).filter(Boolean),
  })).filter((section) => section.questions.length > 0);
}

function answered(value) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

// How complete a profile is: answered / asked, and the first section with
// something missing (where "Complete my profile" opens).
export function completion(profile) {
  const answer = answersFrom(profile);
  let done = 0;
  let total = 0;
  let firstMissing = null;
  for (const section of editSections(answer.connection_type)) {
    for (const question of section.questions) {
      total += 1;
      if (answered(answer[question.field])) done += 1;
      else if (!firstMissing) firstMissing = section.key;
    }
  }
  return { done, total, firstMissing };
}
