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
  // const { data: maintenanceMode, error: maintenanceError } =
  //   process.env.NODE_ENV === "development"
  //     ? {
  //         data: null,
  //         error: { message: "Development-only maintenance failure test" },
  //       }
  //     : await supabase.rpc("get_maintenance_mode");

  // Fail closed for customers and workers, but preserve admin access.
  if (maintenanceError || maintenanceMode === null) {
    console.error(
      "Unable to verify maintenance mode:",
      maintenanceError ?? "No maintenance status returned.",
    );

    if (isAdmin) {
      return supabaseResponse;
    }

    const maintenanceUrl = request.nextUrl.clone();
    maintenanceUrl.pathname = "/maintenance";
    maintenanceUrl.search = "";

    return NextResponse.redirect(maintenanceUrl);
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

// import { createServerClient } from "@supabase/ssr";
// import { NextResponse, type NextRequest } from "next/server";

// export async function updateSession(request: NextRequest) {
//   let supabaseResponse = NextResponse.next({
//     request,
//   });

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll();
//         },

//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value }) => {
//             request.cookies.set(name, value);
//           });

//           supabaseResponse = NextResponse.next({
//             request,
//           });

//           cookiesToSet.forEach(({ name, value, options }) => {
//             supabaseResponse.cookies.set(name, value, options);
//           });
//         },
//       },
//     },
//   );

//   // Verify the user's authentication token.
//   const { data: claimsData } = await supabase.auth.getClaims();
//   const claims = claimsData?.claims;

//   // Routes that must remain accessible during maintenance.
//   const pathname = request.nextUrl.pathname;

//   const isMaintenancePage = pathname === "/maintenance";
//   const isAuthRoute =
//     pathname.startsWith("/login") ||
//     pathname.startsWith("/signup") ||
//     pathname.startsWith("/auth") ||
//     pathname.startsWith("/change-password");

//   if (isMaintenancePage || isAuthRoute) {
//     return supabaseResponse;
//   }

//   const { data: maintenanceMode, error: maintenanceError } = await supabase.rpc(
//     "get_maintenance_mode",
//   );

//   if (maintenanceError || maintenanceMode === null) {
//     console.error(
//       "Unable to verify maintenance mode:",
//       maintenanceError ?? "No maintenance status returned.",
//     );

//     // Fail closed: redirect non-admin users to maintenance.
//     const maintenanceUrl = request.nextUrl.clone();
//     maintenanceUrl.pathname = "/maintenance";
//     maintenanceUrl.search = "";

//     return NextResponse.redirect(maintenanceUrl);
//   }

//   if (maintenanceMode === false) {
//     return supabaseResponse;
//   }

//   // Allow administrators and super administrators through.
//   if (claims?.sub) {
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("id", claims.sub)
//       .maybeSingle();

//     if (profile?.role === "admin" || profile?.role === "super_admin") {
//       return supabaseResponse;
//     }
//   }

//   // Redirect everyone else to the maintenance page.
//   const maintenanceUrl = request.nextUrl.clone();
//   maintenanceUrl.pathname = "/maintenance";
//   maintenanceUrl.search = "";

//   return NextResponse.redirect(maintenanceUrl);
// }
