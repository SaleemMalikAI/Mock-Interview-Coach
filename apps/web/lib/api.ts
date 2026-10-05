// Single entry point for calls from the web app to FastAPI.
// Later features pass the Supabase JWT as `Authorization: Bearer <token>`.

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// Server-side code may need a different host (e.g. `http://api:8000` inside docker compose).
const API_URL =
  typeof window === "undefined" ? (process.env.API_URL_INTERNAL || PUBLIC_API_URL) : PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Machine-readable code from FastAPI's `{"detail": {"code", "message"}}`, when present. */
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function errorFrom(res: Response, path: string): Promise<ApiError> {
  try {
    const body: unknown = await res.json();
    const detail = (body as { detail?: unknown }).detail;
    if (detail && typeof detail === "object" && "code" in detail && "message" in detail) {
      const { code, message } = detail as { code: string; message: string };
      return new ApiError(message, res.status, code);
    }
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }
  return new ApiError(`Request to ${path} failed with ${res.status}`, res.status);
}

type ApiFetchOptions = RequestInit & { token?: string };

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    throw await errorFrom(res, path);
  }
  return (await res.json()) as T;
}

export type InterviewTurn = {
  id: string;
  position: number;
  question: string;
  source: "bank" | "jd";
  status: "pending" | "answered" | "skipped" | "evaluated";
  transcript: string | null;
  duration_seconds: number | null;
};

export type Interview = {
  id: string;
  role: "frontend" | "full_stack" | "ai_engineer" | "behavioral";
  level: "junior" | "mid" | "senior";
  type: "technical" | "behavioral" | "mixed";
  num_questions: number;
  job_description: string | null;
  status: "setup" | "in_progress" | "completed" | "abandoned";
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
  turns: InterviewTurn[];
};

export type InterviewSummary = Pick<
  Interview,
  "id" | "role" | "level" | "type" | "num_questions" | "status" | "overall_score" | "created_at"
> & { answered: number };

export type AnswerResult = {
  turn_id: string;
  transcript: string;
  duration_seconds: number | null;
  status: "answered";
};

export function uploadAnswer(
  interviewId: string,
  turnId: string,
  audio: Blob,
  mimeType: string,
  token: string,
): Promise<AnswerResult> {
  const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("audio", new File([audio], `answer.${extension}`, { type: mimeType }));
  return apiFetch<AnswerResult>(`/interviews/${interviewId}/turns/${turnId}/answer`, {
    method: "POST",
    body: form,
    token,
  });
}

export type CreateInterviewInput = Pick<Interview, "role" | "level" | "type" | "num_questions" | "job_description">;

export type MeResponse = { id: string; email: string | null };

export type HealthResponse = { status: "ok"; version: string };

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health", { cache: "no-store" });
}
