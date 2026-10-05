"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

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
      toast.error(error.message);
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
      toast.error(error.message);
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="space-y-2 text-center">
        <p className="font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>. Open it on
          this device to continue.
        </p>
        <Button variant="link" onClick={() => setStatus("idle")}>
          Use a different email
        </Button>
      </div>
    );
  }

  const busy = status !== "idle";

  return (
    <div className="space-y-6">
      <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={signInWithGoogle}>
        {status === "redirecting" ? "Redirecting…" : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>
    </div>
  );
}
