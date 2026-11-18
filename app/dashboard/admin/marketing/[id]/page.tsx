import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ImageIcon,
  LayoutDashboard,
  Monitor,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CampaignActions } from "../campaign-actions";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  placement: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  created_at: string;
  button_text: string | null;
  button_url: string | null;
};

function getCampaignStatus(campaign: Campaign) {
  const now = new Date();

  if (!campaign.is_active) return "Inactive";

  if (campaign.starts_at && new Date(campaign.starts_at) > now) {
    return "Scheduled";
  }

  if (campaign.ends_at && new Date(campaign.ends_at) <= now) {
    return "Expired";
  }

  return "Active";
}

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Active":
      return (
        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          Active
        </Badge>
      );

    case "Scheduled":
      return (
        <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 dark:text-blue-400">
          <Clock3 className="mr-1.5 h-3.5 w-3.5" />
          Scheduled
        </Badge>
      );

    case "Expired":
      return <Badge variant="outline">Expired</Badge>;

    default:
      return <Badge variant="secondary">Inactive</Badge>;
  }
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="wrap-break-word text-sm font-medium">{value}</p>
    </div>
  );
}

function CampaignPreview({
  campaign,
  mobile = false,
}: {
  campaign: Campaign;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile
          ? "mx-auto w-full max-w-75 overflow-hidden rounded-[2rem] border-[5px] border-slate-800 bg-background shadow-xl dark:border-slate-700"
          : "w-full overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
      }
    >
      {mobile && (
        <div className="flex h-6 items-center justify-center bg-slate-800">
          <div className="h-1.5 w-12 rounded-full bg-white/30" />
        </div>
      )}

      <div className="relative overflow-hidden bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-700">
        {campaign.image_url ? (
          <div className="relative aspect-video w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-start justify-center p-5 text-white sm:p-8">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                Emirate ErrandHub
              </span>

              <h3 className="max-w-[85%] text-xl font-bold leading-tight tracking-tight sm:text-3xl">
                {campaign.title}
              </h3>

              {campaign.subtitle && (
                <p className="mt-2 max-w-[85%] text-xs leading-5 text-white/85 sm:text-sm">
                  {campaign.subtitle}
                </p>
              )}

              {campaign.button_text && (
                <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm sm:text-sm">
                  {campaign.button_text}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-55 flex-col justify-center p-6 text-white sm:min-h-70 sm:p-10">
            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Emirate ErrandHub
            </span>

            <h3 className="max-w-xl text-2xl font-bold tracking-tight sm:text-4xl">
              {campaign.title}
            </h3>

            {campaign.subtitle && (
              <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50/80">
                {campaign.subtitle}
              </p>
            )}

            {campaign.button_text && (
              <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-emerald-950">
                {campaign.button_text}
                <ArrowUpRight className="h-4 w-4" />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
        <span className="text-[10px] font-medium text-muted-foreground">
          Campaign preview
        </span>
        <span className="text-[10px] capitalize text-muted-foreground">
          {campaign.placement.replaceAll("_", " ")}
        </span>
      </div>
    </div>
  );
}

export default async function MarketingCampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "super_admin"]);

  const { id } = await params;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select(
      "id, title, subtitle, image_url, placement, is_active, starts_at, ends_at, sort_order, created_at, button_text, button_url",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load marketing campaign:", error);
    throw new Error("Unable to load campaign details.");
  }

  if (!data) {
    notFound();
  }

  const campaign = data as Campaign;
  const status = getCampaignStatus(campaign);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
                  <MegaphoneIcon />
                  Campaign overview
                </span>

                {getStatusBadge(status)}
              </div>

              <h1 className="wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">
                {campaign.title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
                Review the campaign content, preview its appearance and manage
                its publishing settings.
              </p>

              <p className="mt-4 text-xs text-emerald-100/60">
                Campaign ID: {campaign.id}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CampaignActions
                campaignId={campaign.id}
                isActive={campaign.is_active}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Campaign summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Campaign status</p>
              <p className="mt-1 font-semibold">{status}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Placement</p>
              <p className="mt-1 truncate font-semibold capitalize">
                {campaign.placement.replaceAll("_", " ")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Layers3Icon />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Display order</p>
              <p className="mt-1 font-semibold">#{campaign.sort_order}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="mt-1 text-sm font-semibold">
                {formatDate(campaign.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Preview */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Campaign preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            See how the saved campaign content can appear across different
            screen sizes. This is an administrative preview, not a live
            placement on the public website.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="min-w-0 overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="h-4 w-4 text-emerald-600" />
                Desktop preview
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <CampaignPreview campaign={campaign} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                Mobile preview
              </CardTitle>
            </CardHeader>

            <CardContent className="flex justify-center p-5">
              <CampaignPreview campaign={campaign} mobile />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Details and scheduling */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Campaign information
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6 p-5 sm:grid-cols-2">
            <DetailItem label="Campaign title" value={campaign.title} />

            <DetailItem
              label="Placement"
              value={campaign.placement.replaceAll("_", " ")}
            />

            <DetailItem
              label="Display order"
              value={`#${campaign.sort_order}`}
            />

            <DetailItem
              label="Visibility"
              value={campaign.is_active ? "Enabled" : "Disabled"}
            />

            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Subtitle
              </p>
              <p className="text-sm leading-6">
                {campaign.subtitle || "No subtitle provided."}
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Image URL
              </p>
              {campaign.image_url ? (
                <a
                  href={campaign.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-2 break-all text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  View campaign image
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No campaign image.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              Scheduling and call to action
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Start date"
                value={formatDate(campaign.starts_at)}
              />

              <DetailItem
                label="End date"
                value={formatDate(campaign.ends_at)}
              />
            </div>

            <div className="h-px bg-border" />

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Button text"
                value={campaign.button_text || "No button configured"}
              />

              <DetailItem
                label="Destination URL"
                value={campaign.button_url || "No destination configured"}
              />
            </div>

            {campaign.button_url && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Configured destination
                </p>

                <a
                  href={
                    campaign.button_url.startsWith("/")
                      ? campaign.button_url
                      : campaign.button_url
                  }
                  target={
                    campaign.button_url.startsWith("/") ? undefined : "_blank"
                  }
                  rel="noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {campaign.button_url}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            )}

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">
                    Scheduling information
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Campaign visibility depends on its enabled status and
                    configured start and end dates. An enabled campaign may
                    still be scheduled or expired.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MegaphoneIcon() {
  return <ImageIcon className="h-3.5 w-3.5" />;
}

function Layers3Icon() {
  return <LayoutDashboard className="h-5 w-5" />;
}
