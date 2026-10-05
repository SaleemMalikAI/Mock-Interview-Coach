"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch, type StoryInput } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase/server";

export type StoryFormState = { ok: boolean; error: string | null };

function storyFrom(formData: FormData): StoryInput {
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    title: text("title"),
    situation: text("situation"),
    task: text("task"),
    action: text("action"),
    result: text("result"),
    tags: text("tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8),
  };
}

export async function saveStory(_previous: StoryFormState, formData: FormData): Promise<StoryFormState> {
  const token = await getAccessToken();
  if (!token) redirect("/login?next=/stories");
  const id = String(formData.get("id") ?? "");
  const story = storyFrom(formData);
  if (!story.title) {
    return { ok: false, error: "Give your story a short title." };
  }
  try {
    await apiFetch(id ? `/stories/${id}` : "/stories", {
      method: id ? "PUT" : "POST",
      token,
      body: JSON.stringify(story),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return { ok: false, error: error.message };
    }
    if (error instanceof ApiError && error.status === 422) {
      return { ok: false, error: "Some fields are too long. Shorten them and try again." };
    }
    return { ok: false, error: "Couldn't save your story. Try again." };
  }
  revalidatePath("/stories");
  return { ok: true, error: null };
}

export async function deleteStory(id: string): Promise<{ error: string | null }> {
  const token = await getAccessToken();
  if (!token) redirect("/login?next=/stories");
  try {
    await apiFetch<void>(`/stories/${id}`, { method: "DELETE", token });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      return { error: "Couldn't delete the story. Try again." };
    }
  }
  revalidatePath("/stories");
  return { error: null };
}
