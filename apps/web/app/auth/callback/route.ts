import type { NextRequest } from "next/server";

import { redirectToPath } from "@/lib/redirect-url";
import { safeNextPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

// Both Google OAuth and the email magic link land here with a PKCE `code`.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectToPath(next);
    }
  }

  const description = searchParams.get("error_description") ?? "Sign-in link is invalid or has expired.";
  return redirectToPath(`/login?error=${encodeURIComponent(description)}`);
}
