import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Verify the authentication token.
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  const pathname = request.nextUrl.pathname;

  // Keep essential routes accessible.
  const isMaintenancePage = pathname === "/maintenance";

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/change-password");

  if (isMaintenancePage || isAuthRoute) {
    return supabaseResponse;
  }

  // Determine whether the authenticated user is an administrator.
  let isAdmin = false;

  if (claims?.sub) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", claims.sub)
      .maybeSingle();

    isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  }

  // Check maintenance mode.
  const { data: maintenanceMode, error: maintenanceError } = await supabase.rpc(
    "get_maintenance_mode",
  );

  // Fail closed for customers and workers, but preserve admin access.
  // If maintenance status cannot be verified, do not
  // automatically place the entire platform into maintenance.
  if (maintenanceError || maintenanceMode === null) {
    console.error(
      "Unable to verify maintenance mode:",
      maintenanceError ?? "No maintenance status returned.",
    );

    return supabaseResponse;
  }

  // Normal operation.
  if (maintenanceMode === false) {
    return supabaseResponse;
  }

  // Maintenance is enabled: administrators retain access.
  if (isAdmin) {
    return supabaseResponse;
  }

  // Redirect customers, workers, and unauthenticated visitors.
  const maintenanceUrl = request.nextUrl.clone();
  maintenanceUrl.pathname = "/maintenance";
  maintenanceUrl.search = "";

  return NextResponse.redirect(maintenanceUrl);
}
