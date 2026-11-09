"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, ArrowUpRight, Sparkles } from "lucide-react";

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

function isExcludedPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  );
}

function getSafeButtonUrl(value: string | null) {
  if (!value) return null;

  const url = value.trim();

  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function PopupManager({ campaigns }: { campaigns: PopupCampaign[] }) {
  const pathname = usePathname();
  const [visibleCampaign, setVisibleCampaign] = useState<PopupCampaign | null>(
    null,
  );

  useEffect(() => {
    setVisibleCampaign(null);

    if (isExcludedPath(pathname)) return;

    const eligibleCampaign = campaigns.find((campaign) => {
      if (campaign.frequency === "once_per_visitor") {
        return (
          localStorage.getItem(`errandhub-popup-${campaign.id}`) !== "shown"
        );
      }

      if (campaign.frequency === "once_per_session") {
        return (
          sessionStorage.getItem(`errandhub-popup-${campaign.id}`) !== "shown"
        );
      }

      return true;
    });

    if (!eligibleCampaign) return;

    // Mark the campaign as seen when it is displayed.
    if (eligibleCampaign.frequency === "once_per_visitor") {
      localStorage.setItem(`errandhub-popup-${eligibleCampaign.id}`, "shown");
    }

    if (eligibleCampaign.frequency === "once_per_session") {
      sessionStorage.setItem(`errandhub-popup-${eligibleCampaign.id}`, "shown");
    }

    setVisibleCampaign(eligibleCampaign);
  }, [pathname, campaigns]);

  if (!visibleCampaign || isExcludedPath(pathname)) {
    return null;
  }

  const buttonUrl = getSafeButtonUrl(visibleCampaign.button_url);
  const isExternal =
    buttonUrl?.startsWith("http://") || buttonUrl?.startsWith("https://");

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setVisibleCampaign(null);
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-campaign-title"
        aria-describedby="popup-campaign-description"
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setVisibleCampaign(null)}
          aria-label="Close popup"
          className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-slate-950"
        >
          <X className="size-5" />
        </button>

        {visibleCampaign.image_url ? (
          <div className="relative h-48 overflow-hidden bg-emerald-950 sm:h-64">
            <img
              src={visibleCampaign.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 to-transparent" />
            <div className="absolute bottom-4 left-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              Emirate ErrandHub
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-linear-to-br from-emerald-900 via-emerald-800 to-slate-950 px-7 pb-8 pt-12 text-white sm:px-9">
            <div className="absolute -right-16 -top-20 size-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              Emirate ErrandHub
            </div>
          </div>
        )}

        <div className="p-6 sm:p-9">
          <h2
            id="popup-campaign-title"
            className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
          >
            {visibleCampaign.title}
          </h2>

          {visibleCampaign.description && (
            <p
              id="popup-campaign-description"
              className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base"
            >
              {visibleCampaign.description}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {buttonUrl && visibleCampaign.button_text && (
              <a
                href={buttonUrl}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                {visibleCampaign.button_text}
                <ArrowUpRight className="size-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setVisibleCampaign(null)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Maybe later
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
