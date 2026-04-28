import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const CRM_PATHS = ["/crm", "/api/crm"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isCRMRoute = CRM_PATHS.some((p) => pathname.startsWith(p));
  if (!isCRMRoute) return NextResponse.next();

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // API route-ları üçün 401, səhifələr üçün login-ə yönləndir
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // CRM üçün admin rolu yoxlanır — app_metadata server-side Supabase-dən gəlir, client dəyişə bilməz
  const meta = session.user.app_metadata ?? {};
  const role = typeof meta["role"] === "string" ? meta["role"] : undefined;
  if (role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const panelUrl = req.nextUrl.clone();
    panelUrl.pathname = "/panel";
    return NextResponse.redirect(panelUrl);
  }

  return res;
}

export const config = {
  matcher: ["/crm/:path*", "/api/crm/:path*"],
};
