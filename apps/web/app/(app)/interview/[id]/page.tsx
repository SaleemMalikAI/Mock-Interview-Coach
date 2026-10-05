import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { InterviewRoom } from "@/components/interview-room";
import { ApiError, apiFetch, type Interview } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Interview" };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadInterview(id: string, token: string): Promise<Interview> {
  try {
    return await apiFetch<Interview>(`/interviews/${id}`, { token, cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export default async function InterviewRoomPage({ params }: PageProps<"/interview/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }
  const token = await getAccessToken();
  if (!token) {
    redirect(`/login?next=/interview/${id}`);
  }
  const interview = await loadInterview(id, token);

  if (interview.turns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No questions were planned for this interview. Please start a new one.
      </div>
    );
  }
  return <InterviewRoom interview={interview} />;
}
