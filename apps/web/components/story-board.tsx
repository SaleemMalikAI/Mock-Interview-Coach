"use client";

import { BookOpenCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteStory } from "@/app/(app)/stories/actions";
import { PageHeader } from "@/components/page-header";
import { StoryEditorDialog } from "@/components/story-editor-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { StarStory } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const PARTS = ["situation", "task", "action", "result"] as const;

function completeness(story: StarStory): number {
  return PARTS.filter((part) => story[part].trim().length >= 20).length;
}

export function StoryBoard({ stories }: { stories: StarStory[] }) {
  const [editing, setEditing] = useState<StarStory | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<StarStory | null>(null);
  const [deleting, startDelete] = useTransition();

  function openEditor(story: StarStory | null) {
    setEditing(story);
    setEditorOpen(true);
  }

  function confirmDelete() {
    const story = toDelete;
    if (!story) return;
    startDelete(async () => {
      const { error } = await deleteStory(story.id);
      if (error) toast.error(error);
      else toast.success("Story deleted");
      setToDelete(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Prepare"
        title="STAR stories"
        description="Situation, Task, Action, Result. Keep your best stories here so behavioral answers come out structured and specific."
        actions={
          <Button size="lg" onClick={() => openEditor(null)}>
            <Plus data-icon="inline-start" aria-hidden />
            New story
          </Button>
        }
      />

      {stories.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-subtle text-primary">
            <BookOpenCheck className="size-7" aria-hidden />
          </span>
          <p className="mt-5 text-lg font-semibold">Build your story bank</p>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            Five or six strong stories cover most behavioral questions: a conflict, a failure, a deadline, leadership and
            your proudest project.
          </p>
          <Button className="mt-6" size="lg" onClick={() => openEditor(null)}>
            <Plus data-icon="inline-start" aria-hidden />
            Write your first story
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => {
            const done = completeness(story);
            return (
              <li key={story.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold leading-snug">{story.title}</h2>
                  <div className="-mt-1 -mr-2 flex shrink-0">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${story.title}`} onClick={() => openEditor(story)}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${story.title}`} onClick={() => setToDelete(story)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
                <dl className="mt-3 flex-1 space-y-2 text-sm">
                  {PARTS.map((part) =>
                    story[part] ? (
                      <div key={part} className="flex gap-2">
                        <dt className="mt-0.5 grid size-5 shrink-0 place-items-center rounded bg-brand-subtle font-mono text-[0.7rem] font-semibold text-primary uppercase">
                          {part[0]}
                        </dt>
                        <dd className="line-clamp-2 text-muted-foreground">{story[part]}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      done === 4 ? "bg-success/12 text-success" : "bg-warning/15 text-[oklch(0.5_0.13_70)] dark:text-warning",
                    )}
                  >
                    {done === 4 ? "Complete" : `${done}/4 parts written`}
                  </span>
                  {story.tags.map((tag) => (
                    <span key={tag} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">Edited {timeAgo(story.updated_at)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <StoryEditorDialog open={editorOpen} onOpenChange={setEditorOpen} story={editing} />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>“{toDelete?.title}” will be removed permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete story"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
