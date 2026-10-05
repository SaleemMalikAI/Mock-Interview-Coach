"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { saveStory, type StoryFormState } from "@/app/(app)/stories/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StarStory } from "@/lib/api";

const FIELDS = [
  { name: "situation", label: "Situation", hint: "Where and when? Set the scene in one or two sentences.", max: 2000 },
  { name: "task", label: "Task", hint: "What were you responsible for, and what was at stake?", max: 2000 },
  { name: "action", label: "Action", hint: "What did you do? Use “I”, and be specific about decisions.", max: 3000 },
  { name: "result", label: "Result", hint: "What changed? Numbers beat adjectives.", max: 2000 },
] as const;

type StoryEditorDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; story: StarStory | null };

const initial: StoryFormState = { ok: false, error: null };

export function StoryEditorDialog({ open, onOpenChange, story }: StoryEditorDialogProps) {
  const [state, action, pending] = useActionState(saveStory, initial);
  const handled = useRef(state);

  useEffect(() => {
    if (state !== handled.current && state.ok) {
      handled.current = state;
      toast.success(story ? "Story updated" : "Story saved");
      onOpenChange(false);
    }
  }, [state, story, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">{story ? "Edit story" : "New STAR story"}</DialogTitle>
          <DialogDescription>
            Write it once, reuse it in any behavioral question. Aim for about two minutes when spoken.
          </DialogDescription>
        </DialogHeader>
        <form action={action} key={story?.id ?? "new"} className="space-y-4">
          {story ? <input type="hidden" name="id" value={story.id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="story-title">Title</Label>
            <Input id="story-title" name="title" required maxLength={120} defaultValue={story?.title} placeholder="e.g. Cut checkout latency by 40%" />
          </div>
          {FIELDS.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={`story-${field.name}`}>
                <span className="mr-1.5 grid size-5 place-items-center rounded bg-brand-subtle font-mono text-[0.7rem] font-semibold text-primary">
                  {field.label[0]}
                </span>
                {field.label}
              </Label>
              <p id={`story-${field.name}-hint`} className="text-xs text-muted-foreground">
                {field.hint}
              </p>
              <Textarea
                id={`story-${field.name}`}
                name={field.name}
                rows={3}
                maxLength={field.max}
                aria-describedby={`story-${field.name}-hint`}
                defaultValue={story?.[field.name]}
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="story-tags">
              Tags <span className="font-normal text-muted-foreground">(comma separated)</span>
            </Label>
            <Input id="story-tags" name="tags" defaultValue={story?.tags.join(", ")} placeholder="leadership, conflict, deadline" />
          </div>
          {state.error && !pending ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {story ? "Save changes" : "Save story"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
