"use server";

import { redirect } from "next/navigation";

import { ApiError, apiFetch, type CreateInterviewInput, type Interview } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase/server";

export type CreateInterviewState = { error: string | null };

export async function createInterview(
  _previous: CreateInterviewState,
  formData: FormData,
): Promise<CreateInterviewState> {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login?next=/interview/new");
  }

  const jobDescription = formData.get("job_description");
  const input: CreateInterviewInput = {
    role: String(formData.get("role")) as CreateInterviewInput["role"],
    level: String(formData.get("level")) as CreateInterviewInput["level"],
    type: String(formData.get("type")) as CreateInterviewInput["type"],
    num_questions: Number(formData.get("num_questions")),
    job_description: typeof jobDescription === "string" ? jobDescription : null,
  };

  let interview: Interview;
  try {
    // FastAPI validates every field; this action only forwards them.
    interview = await apiFetch<Interview>("/interviews", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      return { error: "Some settings are invalid. Check the form and try again." };
    }
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?next=/interview/new");
    }
    return { error: "We couldn't create your interview. Please try again." };
  }

  redirect(`/interview/${interview.id}`);
}
