"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

type PopupCampaign = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  audience: string;
  frequency: "once_per_visitor" | "once_per_session" | "every_visit";
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
};

const VISITOR_KEY = "errandhub-popup-visitor";
const SESSION_KEY = "errandhub-popup-session";

function isExcludedPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  );
}

function hasBeenDismissed(campaign: PopupCampaign) {
  try {
    if (campaign.frequency === "once_per_visitor") {
      return localStorage.getItem(`${VISITOR_KEY}:${campaign.id}`) === "true";
    }

    if (campaign.frequency === "once_per_session") {
      return sessionStorage.getItem(`${SESSION_KEY}:${campaign.id}`) === "true";
    }
  } catch {
    // Storage may be unavailable.
  }

  return false;
}

export function PublicPopupManager() {
  const pathname = usePathname();

  const [campaigns, setCampaigns] = useState<PopupCampaign[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // Prevent an every_visit campaign from reopening during SPA navigation
  // or periodic campaign refreshes in the same page session.
  const shownThisPage = useRef(new Set<string>());

  const excluded = useMemo(() => isExcludedPath(pathname), [pathname]);

  // Load active popup campaigns.
  useEffect(() => {
    if (excluded) {
      setCampaigns([]);
      setActiveCampaignId(null);
      return;
    }

    let cancelled = false;

    async function loadCampaigns() {
      try {
        const response = await fetch("/api/public/popups", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Unable to load popup campaigns.");
        }

        const result = (await response.json()) as {
          campaigns?: PopupCampaign[];
        };

        if (cancelled) return;

        const nextCampaigns = result.campaigns ?? [];

        setCampaigns(nextCampaigns);

        const storedDismissals = nextCampaigns
          .filter(hasBeenDismissed)
          .map((campaign) => campaign.id);

        setDismissedIds((previous) => {
          const next = new Set(previous);

          storedDismissals.forEach((id) => next.add(id));

          return next;
        });
      } catch (error) {
        console.error("Popup campaign loading failed:", error);

        if (!cancelled) {
          setCampaigns([]);
          setActiveCampaignId(null);
        }
      }
    }

    void loadCampaigns();

    // Refresh campaigns to pick up admin edits and deactivations.
    const interval = window.setInterval(() => {
      void loadCampaigns();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [excluded, pathname]);

  // Select the highest-priority eligible campaign.
  useEffect(() => {
    if (excluded) return;

    setActiveCampaignId((currentId) => {
      // Keep the currently displayed campaign if it is still eligible.
      if (
        currentId &&
        campaigns.some(
          (campaign) =>
            campaign.id === currentId && !dismissedIds.has(campaign.id),
        )
      ) {
        return currentId;
      }

      const nextCampaign = campaigns.find((campaign) => {
        if (dismissedIds.has(campaign.id)) return false;

        if (
          campaign.frequency === "every_visit" &&
          shownThisPage.current.has(campaign.id)
        ) {
          return false;
        }

        return true;
      });

      if (!nextCampaign) return null;

      if (nextCampaign.frequency === "every_visit") {
        shownThisPage.current.add(nextCampaign.id);
      }

      return nextCampaign.id;
    });
  }, [campaigns, dismissedIds, excluded]);

  const activeCampaign = campaigns.find(
    (campaign) => campaign.id === activeCampaignId,
  );

  // Dismiss a campaign and save its frequency preference.
  const dismiss = useCallback((campaign: PopupCampaign) => {
    try {
      if (campaign.frequency === "once_per_visitor") {
        localStorage.setItem(`${VISITOR_KEY}:${campaign.id}`, "true");
      } else if (campaign.frequency === "once_per_session") {
        sessionStorage.setItem(`${SESSION_KEY}:${campaign.id}`, "true");
      }
    } catch {
      // Dismissal still applies for the current page.
    }

    setDismissedIds((previous) => {
      const next = new Set(previous);
      next.add(campaign.id);
      return next;
    });

    setActiveCampaignId(null);
  }, []);

  // Support Escape key and prevent background scrolling.
  useEffect(() => {
    if (!activeCampaign) return;

    const campaign = activeCampaign;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss(campaign);
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [activeCampaign, dismiss]);

  if (excluded || !activeCampaign) return null;

  // TypeScript now knows this is a definite PopupCampaign.
  const campaign: PopupCampaign = activeCampaign;

  const isExternalUrl =
    campaign.button_url?.startsWith("https://") ||
    campaign.button_url?.startsWith("http://");

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          dismiss(campaign);
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-popup-title"
        aria-describedby="public-popup-description"
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={() => dismiss(campaign)}
          aria-label="Close popup"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md transition hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        {campaign.image_url && (
          <div className="h-48 w-full overflow-hidden bg-slate-100 sm:h-60">
            <img
              src={campaign.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="mb-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Emirate ErrandHub
          </div>

          <h2
            id="public-popup-title"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            {campaign.title}
          </h2>

          {campaign.description && (
            <p
              id="public-popup-description"
              className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600"
            >
              {campaign.description}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {campaign.button_text && campaign.button_url && (
              <a
                href={campaign.button_url}
                onClick={() => dismiss(campaign)}
                target={isExternalUrl ? "_blank" : undefined}
                rel={isExternalUrl ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {campaign.button_text}
              </a>
            )}

            <button
              type="button"
              onClick={() => dismiss(campaign)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Maybe later
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
