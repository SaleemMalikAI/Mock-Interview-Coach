import { NextResponse } from "next/server";

/**
 * Redirect with a relative Location header. Route handlers see the bind address (0.0.0.0 inside
 * Docker) as their origin, so an absolute URL built from the request can point at the wrong host.
 * `path` must already be a safe same-site path (see safeNextPath).
 */
export function redirectToPath(path: string, status: 303 | 307 = 307): NextResponse {
  return new NextResponse(null, { status, headers: { Location: path } });
}
