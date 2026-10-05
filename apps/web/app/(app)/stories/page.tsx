import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StoryBoard } from "@/components/story-board";
import { apiFetch, type StarStory } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "STAR stories" };

export default async function StoriesPage() {
  const token = await getAccessToken();
  if (!token) redirect("/login?next=/stories");
  const stories = await apiFetch<StarStory[]>("/stories", { token, cache: "no-store" }).catch(() => null);

  return (
    <>
      {stories === null ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          We couldn&apos;t load your stories. Refresh to try again.
        </p>
      ) : (
        <StoryBoard stories={stories} />
      )}
    </>
  );
}
