import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type CampaignPlacement = "homepage" | "customer_dashboard" | "worker_dashboard";

export async function CampaignBanners({
  placement,
}: {
  placement: CampaignPlacement;
}) {
  const supabase = await createClient();

  const { data: campaigns, error } = await supabase
    .from("marketing_campaigns")
    .select("id, title, subtitle, image_url, button_text, button_url")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Campaign banners error:", error);
    return null;
  }

  if (!campaigns?.length) return null;

  return (
    <section className="grid gap-5">
      {campaigns.map((campaign) => {
        const rawUrl = campaign.button_url?.trim();

        let safeUrl: string | null = null;
        let isExternal = false;

        if (rawUrl) {
          if (rawUrl.startsWith("/") && !rawUrl.startsWith("//")) {
            safeUrl = rawUrl;
          } else {
            try {
              const parsedUrl = new URL(rawUrl);

              if (
                parsedUrl.protocol === "https:" ||
                parsedUrl.protocol === "http:"
              ) {
                safeUrl = parsedUrl.toString();
                isExternal = true;
              }
            } catch {
              safeUrl = null;
            }
          }
        }

        return (
          <article
            key={campaign.id}
            className="relative isolate flex min-h-56 flex-col justify-center overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-900 via-emerald-800 to-slate-900 px-6 py-8 text-white shadow-sm sm:px-9 sm:py-9"
          >
            {campaign.image_url ? (
              <>
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  className="absolute inset-0 -z-20 h-full w-full object-cover"
                />
                <div className="absolute inset-0 -z-10 bg-slate-950/65" />
              </>
            ) : (
              <div className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            )}

            <div className="relative max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-100 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Emirate ErrandHub
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {campaign.title}
              </h2>

              {campaign.subtitle && (
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
                  {campaign.subtitle}
                </p>
              )}

              {safeUrl && campaign.button_text && (
                <div className="mt-5">
                  {isExternal ? (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
                    >
                      {campaign.button_text}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      href={safeUrl}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
                    >
                      {campaign.button_text}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
