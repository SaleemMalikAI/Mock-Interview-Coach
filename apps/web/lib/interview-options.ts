export const ROLES = [
  { value: "frontend", label: "Frontend" },
  { value: "full_stack", label: "Full Stack" },
  { value: "ai_engineer", label: "AI Engineer" },
  { value: "behavioral", label: "Behavioral" },
] as const;

export const LEVELS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
] as const;

export const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "mixed", label: "Mixed" },
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

export function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
