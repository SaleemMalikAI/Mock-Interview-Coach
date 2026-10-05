"use server";

import { redirect } from "next/navigation";

import { ApiError, apiFetch, type Interview } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase/server";

export type PracticeState = { error: string | null };

export async function startPractice(_previous: PracticeState, formData: FormData): Promise<PracticeState> {
  const token = await getAccessToken();
  if (!token) redirect("/login?next=/questions");
  const questionId = String(formData.get("question_id") ?? "");

  let interview: Interview;
  try {
    interview = await apiFetch<Interview>("/interviews/practice", {
      method: "POST",
      token,
      body: JSON.stringify({ question_id: questionId }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { error: "That question no longer exists." };
    }
    return { error: "Couldn't start practice. Try again." };
  }
  redirect(`/interview/${interview.id}`);
}
