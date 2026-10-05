"use client";

import { AlertCircle, Loader2, Mic, MicOff, RotateCcw, Send, Square } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { LevelMeter } from "@/components/level-meter";
import { Button } from "@/components/ui/button";
import { SILENCE_THRESHOLD, useRecorder, type RecorderErrorKind } from "@/hooks/use-recorder";
import { ApiError, uploadAnswer, type AnswerResult } from "@/lib/api";
import { formatDuration } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MIC_ERRORS: Record<RecorderErrorKind, { title: string; body: string }> = {
  permission_denied: {
    title: "Microphone access is blocked",
    body: "Allow microphone access for this site in your browser's address bar, then try again.",
  },
  no_microphone: {
    title: "No microphone found",
    body: "Connect a microphone or headset, then try again.",
  },
  unsupported: {
    title: "Recording isn't supported here",
    body: "Use a recent version of Chrome, Edge, Firefox or Safari.",
  },
  unknown: {
    title: "We couldn't start recording",
    body: "Something went wrong with your microphone. Try again, or reload the page.",
  },
};

const UPLOAD_ERRORS: Record<string, string> = {
  empty_audio: "We couldn't hear an answer in that recording. Check your microphone and record again.",
  too_long: "Answers can be at most 3 minutes. Record a shorter answer.",
  too_large: "That recording is too large to upload. Record a shorter answer.",
  unsupported_type: "Your browser recorded an audio format we can't read. Try Chrome or Safari.",
  transcription_failed: "Transcription failed on our side. Your recording is still here, so try submitting again.",
  upload_failed: "We couldn't save your recording. Check your connection and try again.",
  already_evaluated: "This answer has already been scored and can't be replaced.",
};

type UploadState = { status: "idle" | "uploading" } | { status: "error"; message: string; retryable: boolean };

type AnswerRecorderProps = {
  interviewId: string;
  turnId: string;
  onAnswered: (result: AnswerResult) => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function AnswerRecorder({ interviewId, turnId, onAnswered }: AnswerRecorderProps) {
  const recorder = useRecorder();
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const { status, start, stop } = recorder;

  // Space starts and stops recording (ignored while typing or with modifier keys).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target) || (event.target instanceof HTMLButtonElement)) return;
      if (status === "idle") {
        event.preventDefault();
        void start();
      } else if (status === "recording") {
        event.preventDefault();
        stop();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, start, stop]);

  const submit = useCallback(async () => {
    const take = recorder.recording;
    if (!take) return;
    setUpload({ status: "uploading" });
    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setUpload({ status: "error", message: "Your session expired. Sign in again to submit.", retryable: false });
      return;
    }
    try {
      const result = await uploadAnswer(interviewId, turnId, take.blob, take.mimeType, token);
      setUpload({ status: "idle" });
      onAnswered(result);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : null;
      const message = (code && UPLOAD_ERRORS[code]) ?? "We couldn't reach the server. Check your connection and try again.";
      const retryable = !code || code === "transcription_failed" || code === "upload_failed";
      setUpload({ status: "error", message, retryable });
    }
  }, [interviewId, onAnswered, recorder.recording, turnId]);

  function recordAgain() {
    setUpload({ status: "idle" });
    recorder.reset();
  }

  if (recorder.status === "error" && recorder.error) {
    const { title, body } = MIC_ERRORS[recorder.error];
    return (
      <div role="alert" className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <MicOff className="size-6" aria-hidden />
        </span>
        <p className="mt-4 font-semibold">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
        <Button variant="outline" className="mt-5" onClick={() => void recorder.start()}>
          <RotateCcw data-icon="inline-start" aria-hidden />
          Try again
        </Button>
      </div>
    );
  }

  if (upload.status === "uploading") {
    return (
      <div role="status" aria-live="polite" className="rounded-xl border bg-muted/30 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
          <p className="font-medium">Transcribing your answer…</p>
        </div>
        <div className="mt-5 space-y-2.5" aria-hidden>
          <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-11/12 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  if (recorder.status === "recorded" && recorder.recording) {
    const take = recorder.recording;
    const silent = take.peakLevel < SILENCE_THRESHOLD;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">Review your answer</span>
            <span className="font-mono text-muted-foreground tabular">{formatDuration(take.durationMs / 1000)}</span>
          </div>
          <audio controls src={take.url} className="h-10 w-full" aria-label="Your recorded answer" />
        </div>

        {silent ? (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            We didn&apos;t pick up any sound. Check that the right microphone is selected and not muted, then record again.
          </p>
        ) : null}
        {upload.status === "error" ? (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {upload.message}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" onClick={recordAgain}>
            <RotateCcw data-icon="inline-start" aria-hidden />
            Record again
          </Button>
          {upload.status !== "error" || upload.retryable ? (
            <Button size="lg" onClick={() => void submit()} disabled={silent}>
              <Send data-icon="inline-start" aria-hidden />
              {upload.status === "error" ? "Try again" : "Submit answer"}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const recording = recorder.status === "recording";
  const requesting = recorder.status === "requesting";
  const remainingMs = recorder.maxDurationMs - recorder.elapsedMs;

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="relative">
        {recording ? <span className="absolute inset-0 animate-ping rounded-full bg-recording/30" aria-hidden /> : null}
        <button
          type="button"
          onClick={recording ? recorder.stop : () => void recorder.start()}
          disabled={requesting}
          aria-label={recording ? "Stop recording" : "Start recording your answer"}
          className={cn(
            "relative grid size-20 cursor-pointer place-items-center rounded-full shadow-lg transition-[transform,background-color] duration-200 outline-none",
            "focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-95 disabled:cursor-wait disabled:opacity-70",
            recording
              ? "bg-recording text-recording-foreground"
              : "bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90",
          )}
        >
          {requesting ? (
            <Loader2 className="size-7 animate-spin" aria-hidden />
          ) : recording ? (
            <Square className="size-6 fill-current" aria-hidden />
          ) : (
            <Mic className="size-8" aria-hidden />
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-3">
        <LevelMeter levels={recorder.levels} active={recording} />
        <div className="flex items-center justify-between text-sm" aria-live="off">
          <span className={cn("flex items-center gap-2 font-medium", recording ? "text-recording" : "text-muted-foreground")}>
            {recording ? <span className="size-2 animate-pulse rounded-full bg-recording" aria-hidden /> : null}
            {recording ? "Recording" : requesting ? "Waiting for microphone…" : "Ready"}
          </span>
          <span className="font-mono tabular text-muted-foreground">
            <span className={recording ? "text-foreground" : undefined}>{formatDuration(recorder.elapsedMs / 1000)}</span>
            {" / "}
            {formatDuration(recorder.maxDurationMs / 1000)}
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground" aria-live="polite">
        {recording && remainingMs <= 15_000
          ? `${Math.ceil(remainingMs / 1000)} seconds left`
          : recording
            ? "Tap the button or press Space when you're done."
            : requesting
              ? "Allow microphone access in your browser to continue."
              : (
                <>
                  Tap to start, or press{" "}
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">Space</kbd>
                </>
              )}
      </p>
    </div>
  );
}
