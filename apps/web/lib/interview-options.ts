export const ROLES = [
  { value: "frontend", label: "Frontend", hint: "React, CSS, browser, performance" },
  { value: "full_stack", label: "Full Stack", hint: "APIs, databases, system design" },
  { value: "ai_engineer", label: "AI Engineer", hint: "LLMs, RAG, evals, agents" },
  { value: "behavioral", label: "Behavioral", hint: "STAR stories, leadership, conflict" },
] as const;

export const LEVELS = [
  { value: "junior", label: "Junior", hint: "0–2 years" },
  { value: "mid", label: "Mid", hint: "2–5 years" },
  { value: "senior", label: "Senior", hint: "5+ years" },
] as const;

export const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical", hint: "Concepts and design" },
  { value: "behavioral", label: "Behavioral", hint: "Past experience" },
  { value: "mixed", label: "Mixed", hint: "Two thirds technical" },
] as const;

export const QUESTION_COUNTS = [
  { value: "3", label: "3", hint: "~10 min" },
  { value: "5", label: "5", hint: "~15 min" },
  { value: "8", label: "8", hint: "~25 min" },
] as const;

export const JOB_DESCRIPTION_MAX_CHARS = 5000;

export type Role = (typeof ROLES)[number]["value"];
export type Level = (typeof LEVELS)[number]["value"];
export type InterviewType = (typeof INTERVIEW_TYPES)[number]["value"];

export const MINUTES_PER_QUESTION = 3;

export function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
