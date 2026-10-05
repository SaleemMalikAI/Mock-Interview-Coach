"use client";

import { useEffect } from "react";

/** Stores the browser's IANA timezone in a cookie so server-rendered stats (streaks,
 * "this week") follow the user's local day instead of UTC. */
export function TimezoneCookie() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && !document.cookie.includes(`tz=${encodeURIComponent(tz)}`)) {
      document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);
  return null;
}
