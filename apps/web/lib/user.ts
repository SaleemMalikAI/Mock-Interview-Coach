import { cookies } from "next/headers";

export async function userTimezone(): Promise<string | null> {
  const value = (await cookies()).get("tz")?.value;
  return value ? decodeURIComponent(value) : null;
}
