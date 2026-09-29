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

  /*
   * Do not use getSession() here.
   *
   * getClaims() verifies the authentication token.
   */
  await supabase.auth.getClaims();

  return supabaseResponse;
}

// import { createServerClient, type CookieOptions } from "@supabase/ssr";
// import { NextResponse, type NextRequest } from "next/server";

// /**
//  * Refreshes the Supabase auth session on every request so server components
//  * always see a valid session. Also returns the response so the middleware
//  * can layer redirect logic on top.
//  */
// export async function updateSession(request: NextRequest) {
//   let response = NextResponse.next({ request: { headers: request.headers } });

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return request.cookies.get(name)?.value;
//         },
//         set(name: string, value: string, options: CookieOptions) {
//           request.cookies.set({ name, value, ...options });
//           response = NextResponse.next({ request: { headers: request.headers } });
//           response.cookies.set({ name, value, ...options });
//         },
//         remove(name: string, options: CookieOptions) {
//           request.cookies.set({ name, value: "", ...options });
//           response = NextResponse.next({ request: { headers: request.headers } });
//           response.cookies.set({ name, value: "", ...options });
//         },
//       },
//     }
//   );

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   return { response, user };
// }
