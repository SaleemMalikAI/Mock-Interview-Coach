"use client";

import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { GoogleIcon } from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = { next: string };

type Status = "idle" | "sending" | "sent" | "redirecting";

function callbackUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(next) },
    });
    if (error) {
      setStatus("idle");
      toast.error("Couldn't send the link", { description: error.message });
      return;
    }
    setStatus("sent");
  }

  async function signInWithGoogle() {
    setStatus("redirecting");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) {
      setStatus("idle");
      toast.error("Google sign-in failed", { description: error.message });
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-xl border bg-card p-6 text-center shadow-[var(--shadow-soft)]">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-success/10 text-success">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <p className="mt-4 font-semibold">Check your inbox</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>. Open it on this
          device to continue.
        </p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setStatus("idle")}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Use a different email
        </Button>
      </div>
    );
  }

  const busy = status !== "idle";

  return (
    <div className="space-y-5">
      <Button type="button" variant="outline" size="lg" className="w-full bg-card" disabled={busy} onClick={signInWithGoogle}>
        {status === "redirecting" ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Work or personal email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {status === "sending" ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
          {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>
    </div>
  );
}
