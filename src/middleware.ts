import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (url && key && request.nextUrl.pathname === "/admin") {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    });
    // Refresh expiring cookies here. The dashboard verifies the user with
    // getUser() and checks admin approval before it reads any records.
    await supabase.auth.getSession();
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
