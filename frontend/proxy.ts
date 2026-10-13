import { NextRequest, NextResponse } from "next/server";

// Forwards /api/* to the backend. The target is read per request, not at build time,
// so the same image runs in any environment.
export function proxy(request: NextRequest) {
  const apiUrl = process.env.API_URL ?? "http://localhost:5173";
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, apiUrl);
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: "/api/:path*",
};