import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { apiFetch, type MeResponse } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard · Mock Interview Coach" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/login?next=/dashboard");
  }

  // The session token is forwarded to FastAPI, which verifies it independently.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const me = session
    ? await apiFetch<MeResponse>("/me", { token: session.access_token, cache: "no-store" }).catch(() => null)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {data.claims.email ?? "unknown"}</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <p className="text-sm text-muted-foreground">
        API check:{" "}
        {me ? (
          <span className="font-medium text-green-600 dark:text-green-400">verified as {me.email}</span>
        ) : (
          <span className="font-medium text-destructive">could not verify session with the API</span>
        )}
      </p>

      <section className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Your past interviews will show up here.
      </section>
    </main>
  );
}
