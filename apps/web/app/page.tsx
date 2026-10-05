import { getHealth } from "@/lib/api";

async function ApiStatus() {
  const health = await getHealth().catch(() => null);
  if (!health) {
    return (
      <p className="text-sm text-muted-foreground">
        API: <span className="font-medium text-destructive">unreachable</span>
      </p>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      API: <span className="font-medium text-green-600 dark:text-green-400">{health.status}</span> (v
      {health.version})
    </p>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mock Interview Coach</h1>
      <p className="text-muted-foreground">
        Practice interviews out loud. Get scored feedback and speech metrics on every answer.
      </p>
      <ApiStatus />
    </main>
  );
}
