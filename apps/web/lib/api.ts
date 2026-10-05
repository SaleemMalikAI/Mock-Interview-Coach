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
  ) {
    super(message);
    this.name = "ApiError";
  }
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
    throw new ApiError(`Request to ${path} failed with ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

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
};

export type CreateInterviewInput = Pick<Interview, "role" | "level" | "type" | "num_questions" | "job_description">;

export type MeResponse = { id: string; email: string | null };

export type HealthResponse = { status: "ok"; version: string };

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health", { cache: "no-store" });
}
