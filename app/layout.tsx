import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

import "./globals.css";

import { Toaster } from "@/components/ui/toast";
import { PublicBrandingProvider } from "@/components/providers/public-branding-provider";
import { PopupManager } from "@/components/popups/popup-manager";
import { PublicPopupManager } from "@/components/popups/public-popup-manager";

export const metadata: Metadata = {
  title: "Emirate ErrandHub",
  description: "Services made easier.",
};

type PopupCampaign = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  audience: string;
  frequency: string;
  priority: number;
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();

  const [{ data: branding }, { data: authData }, { data: campaigns }] =
    await Promise.all([
      supabase.rpc("get_public_platform_settings"),
      supabase.auth.getUser(),
      supabase
        .from("popup_campaigns")
        .select(
          "id, title, description, image_url, button_text, button_url, audience, frequency, priority",
        )
        .eq("is_active", true)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

  const settings = branding?.[0];

  const publicBranding = {
    platformName: settings?.platform_name || "Emirate ErrandHub",
    platformDescription:
      settings?.platform_description || "Services made easier.",
    platformLogoUrl: settings?.platform_logo_url ?? null,
  };

  let userRole: string | null = null;

  if (authData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    userRole = profile?.role ?? null;
  }

  const eligiblePopups = ((campaigns ?? []) as PopupCampaign[]).filter(
    (campaign) => {
      if (campaign.audience === "everyone") return true;

      if (campaign.audience === "visitors") {
        return !authData.user;
      }

      if (campaign.audience === "customers") {
        return userRole === "customer";
      }

      if (campaign.audience === "workers") {
        return userRole === "worker";
      }

      return false;
    },
  );

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased">
        <PublicBrandingProvider branding={publicBranding}>
          {children}

          <PopupManager campaigns={eligiblePopups} />

          <PublicPopupManager />

          <Toaster />
        </PublicBrandingProvider>
      </body>
    </html>
  );
}

// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

// import { Toaster } from "@/components/ui/toast";
// import { PublicBrandingProvider } from "@/components/providers/public-branding-provider";
// import { createClient } from "@/lib/supabase/server";

// export const metadata: Metadata = {
//   title: "Emirate ErrandHub",
//   description: "Services made easier.",
// };

// export default async function RootLayout({ children }: LayoutProps<"/">) {
//   const supabase = await createClient();

//   const { data: branding } = await supabase.rpc("get_public_platform_settings");

//   const settings = branding?.[0];

//   const publicBranding = {
//     platformName: settings?.platform_name || "Emirate ErrandHub",
//     platformDescription:
//       settings?.platform_description || "Services made easier.",
//     platformLogoUrl: settings?.platform_logo_url ?? null,
//   };

//   return (
//     <html lang="en" className="h-full">
//       <body className="min-h-full flex flex-col font-sans antialiased">
//         <PublicBrandingProvider branding={publicBranding}>
//           {children}
//           <Toaster />
//         </PublicBrandingProvider>
//       </body>
//     </html>
//   );
// }
