"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "error";
export type RecorderErrorKind = "permission_denied" | "no_microphone" | "unsupported" | "unknown";

export type Recording = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  url: string;
  /** Loudest RMS level seen while recording (0–1). Near zero means the mic heard nothing. */
  peakLevel: number;
};

export const MAX_RECORDING_MS = 180_000;
/** RMS below this for the whole take means silence (or a muted mic). */
export const SILENCE_THRESHOLD = 0.015;
const LEVEL_HISTORY = 40;

// Chrome/Firefox record webm/opus; Safari only supports mp4/aac.
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function pickMimeType(): string | undefined {
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

function errorKind(error: unknown): RecorderErrorKind {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "permission_denied";
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") return "no_microphone";
  }
  return "unknown";
}

type UseRecorderOptions = { maxDurationMs?: number };

export function useRecorder({ maxDurationMs = MAX_RECORDING_MS }: UseRecorderOptions = {}) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<RecorderErrorKind | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(LEVEL_HISTORY).fill(0));
  const [recording, setRecording] = useState<Recording | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const peakRef = useRef(0);
  const urlRef = useRef<string | null>(null);

  const releaseDevices = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (tickRef.current !== null) window.clearInterval(tickRef.current);
    frameRef.current = null;
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
  }, []);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const startMeter = useCallback((stream: MediaStream) => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = context;
    const samples = new Float32Array(analyser.fftSize);
    let frame = 0;

    const sample = () => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const value of samples) sum += value * value;
      const rms = Math.sqrt(sum / samples.length);
      peakRef.current = Math.max(peakRef.current, rms);
      // ~20 updates a second is smooth enough and keeps React renders cheap.
      if (frame++ % 3 === 0) {
        const scaled = Math.min(1, rms * 6);
        setLevels((previous) => [...previous.slice(1), scaled]);
      }
      frameRef.current = requestAnimationFrame(sample);
    };
    frameRef.current = requestAnimationFrame(sample);
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("unsupported");
      setStatus("error");
      return;
    }
    revokeUrl();
    setRecording(null);
    setError(null);
    setStatus("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (caught) {
      setError(errorKind(caught));
      setStatus("error");
      return;
    }
    streamRef.current = stream;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const type = (recorder.mimeType || mimeType || "audio/webm").split(";")[0] ?? "audio/webm";
      const blob = new Blob(chunks, { type });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setRecording({
        blob,
        mimeType: type,
        durationMs: Date.now() - startedAtRef.current,
        url,
        peakLevel: peakRef.current,
      });
      setStatus("recorded");
      releaseDevices();
    };
    recorderRef.current = recorder;

    peakRef.current = 0;
    setLevels(Array(LEVEL_HISTORY).fill(0));
    setElapsedMs(0);
    startMeter(stream);
    recorder.start(250);
    startedAtRef.current = Date.now();
    setStatus("recording");
    tickRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= maxDurationMs) stop();
    }, 200);
  }, [maxDurationMs, releaseDevices, revokeUrl, startMeter, stop]);

  const reset = useCallback(() => {
    stop();
    releaseDevices();
    revokeUrl();
    setRecording(null);
    setError(null);
    setElapsedMs(0);
    setLevels(Array(LEVEL_HISTORY).fill(0));
    setStatus("idle");
  }, [releaseDevices, revokeUrl, stop]);

  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      releaseDevices();
      revokeUrl();
    },
    [releaseDevices, revokeUrl],
  );

  return { status, error, elapsedMs, levels, recording, maxDurationMs, start, stop, reset };
}
