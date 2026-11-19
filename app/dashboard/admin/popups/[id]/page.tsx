import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  ImageIcon,
  Megaphone,
  MousePointerClick,
  ShieldCheck,
  Users,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PopupStatus = "active" | "scheduled" | "expired" | "inactive";

function getPopupStatus(popup: {
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}): PopupStatus {
  if (!popup.is_active) return "inactive";

  const now = Date.now();

  if (popup.starts_at && new Date(popup.starts_at).getTime() > now) {
    return "scheduled";
  }

  if (popup.ends_at && new Date(popup.ends_at).getTime() <= now) {
    return "expired";
  }

  return "active";
}

const statusStyles: Record<PopupStatus, string> = {
  active:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  scheduled:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  expired:
    "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  inactive:
    "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not specified";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="wrap-break-word text-sm font-medium">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-4 sm:px-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon className="size-5" />
        </div>

        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default async function PopupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "super_admin"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: popup, error } = await supabase
    .from("popup_campaigns")
    .select(
      "id, title, description, image_url, image_path, button_text, button_url, audience, frequency, starts_at, ends_at, priority, is_active, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load popup campaign:", error);
    throw new Error("Unable to load popup campaign.");
  }

  if (!popup) notFound();

  const status = getPopupStatus(popup);

  const audienceDescriptions: Record<string, string> = {
    everyone: "All eligible visitors and signed-in users",
    visitors: "Visitors who are not signed in",
    customers: "Signed-in customers",
    workers: "Signed-in workers",
  };

  const frequencyDescriptions: Record<string, string> = {
    once_per_visitor: "Shown once per visitor",
    once_per_session: "Shown once per browser session",
    every_visit: "Shown on every eligible visit",
  };

  const isExternalUrl =
    popup.button_url?.startsWith("https://") ||
    popup.button_url?.startsWith("http://");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg shadow-emerald-950/10 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 size-64 rounded-full bg-teal-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
                <Megaphone className="size-3.5" />
                Popup campaign details
              </div>

              <h1 className="wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">
                {popup.title}
              </h1>

              <p className="mt-2 text-sm text-emerald-50/75">
                Review the campaign content and its display configuration.
              </p>

              <p className="mt-4 font-mono text-xs text-emerald-100/60">
                Campaign ID: {popup.id}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-white/15 bg-card/10 px-3 py-2 text-sm font-medium text-white">
              <span
                className={`size-2 rounded-full ${
                  status === "active"
                    ? "bg-emerald-300"
                    : status === "scheduled"
                      ? "bg-blue-300"
                      : status === "expired"
                        ? "bg-orange-300"
                        : "bg-zinc-300"
                }`}
              />
              {formatLabel(status)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <SectionCard
            title="Campaign preview"
            description="A preview of the popup content."
            icon={ImageIcon}
          >
            <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border bg-background shadow-sm">
              {popup.image_url ? (
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={popup.image_url}
                    alt={popup.title}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-linear-to-br from-emerald-950 to-teal-800 text-white">
                  <div className="text-center">
                    <Megaphone className="mx-auto size-10 opacity-80" />
                    <p className="mt-2 text-sm font-medium">Popup campaign</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 p-5 sm:p-6">
                <div>
                  <p className="text-lg font-bold tracking-tight">
                    {popup.title}
                  </p>

                  {popup.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {popup.description}
                    </p>
                  )}
                </div>

                {popup.button_text && popup.button_url && (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">
                    {popup.button_text}
                    <ExternalLink className="size-4" />
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Campaign information"
            description="Content and destination details."
            icon={MousePointerClick}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="Campaign title" value={popup.title} />
              <DetailItem
                label="Button text"
                value={popup.button_text || "No button"}
              />
              <div className="sm:col-span-2">
                <DetailItem
                  label="Description"
                  value={popup.description || "No description provided"}
                />
              </div>
              <div className="sm:col-span-2">
                <DetailItem
                  label="Button destination"
                  value={popup.button_url || "No destination configured"}
                />
              </div>
              <DetailItem
                label="Image"
                value={popup.image_url ? "Image configured" : "No image"}
              />
              <DetailItem
                label="Image storage path"
                value={popup.image_path || "No storage path recorded"}
              />
            </div>

            {popup.button_url && (
              <div className="mt-5 border-t pt-4">
                <a
                  href={popup.button_url}
                  target={isExternalUrl ? "_blank" : undefined}
                  rel={isExternalUrl ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Open button destination
                  <ExternalLink className="size-4" />
                </a>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Display configuration"
            description="Who sees this popup and how often it appears."
            icon={Users}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Target audience"
                value={formatLabel(popup.audience)}
              />
              <DetailItem
                label="Audience description"
                value={
                  audienceDescriptions[popup.audience] ||
                  "Custom audience configuration"
                }
              />
              <DetailItem
                label="Display frequency"
                value={formatLabel(popup.frequency)}
              />
              <DetailItem
                label="Frequency description"
                value={
                  frequencyDescriptions[popup.frequency] ||
                  "Custom display frequency"
                }
              />
              <DetailItem label="Priority" value={String(popup.priority)} />
              <DetailItem
                label="Activation"
                value={popup.is_active ? "Enabled" : "Disabled"}
              />
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard
            title="Campaign schedule"
            description="Visibility dates and record history."
            icon={CalendarDays}
          >
            <div className="space-y-5">
              <DetailItem
                label="Start date"
                value={formatDate(popup.starts_at)}
              />
              <DetailItem label="End date" value={formatDate(popup.ends_at)} />

              <div className="border-t pt-4">
                <DetailItem
                  label="Created"
                  value={formatDate(popup.created_at)}
                />
              </div>

              <DetailItem
                label="Last updated"
                value={formatDate(popup.updated_at)}
              />
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold">Visibility status</h3>
            </div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {status === "active"
                ? "This campaign is enabled and currently within its configured schedule."
                : status === "scheduled"
                  ? "This campaign is enabled but its start date is still in the future."
                  : status === "expired"
                    ? "This campaign is enabled, but its end date has passed."
                    : "This campaign is disabled and will not be displayed."}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="size-5 text-muted-foreground" />
              <h3 className="font-semibold">Campaign record</h3>
            </div>

            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {popup.id}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
