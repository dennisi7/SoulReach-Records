import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
