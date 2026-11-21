import Link from "next/link";

import {
  Megaphone,
  Plus,
  CalendarDays,
  Clock3,
  CheckCircle2,
  ImageIcon,
  Layers3,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CampaignActions } from "./campaign-actions";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  title: string;
  subtitle: string | null;
  placement: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  created_at: string;
  image_url: string | null;
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
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <div className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl" />

      <CardContent className="relative flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
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
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Expired
        </Badge>
      );

    default:
      return <Badge variant="secondary">Inactive</Badge>;
  }
}

export default async function AdminMarketingPage() {
  await requireRole(["admin", "super_admin"]);

  const supabase = createAdminClient();

  const { data: campaigns, error } = await supabase
    .from("marketing_campaigns")
    .select(
      "id, title, subtitle, image_url, placement, is_active, starts_at, ends_at, sort_order, created_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load marketing campaigns:", error);
    throw new Error("Unable to load marketing campaigns.");
  }

  const campaignList = (campaigns ?? []) as Campaign[];

  const activeCount = campaignList.filter(
    (campaign) => getCampaignStatus(campaign) === "Active",
  ).length;

  const scheduledCount = campaignList.filter(
    (campaign) => getCampaignStatus(campaign) === "Scheduled",
  ).length;

  const inactiveCount = campaignList.filter(
    (campaign) => getCampaignStatus(campaign) === "Inactive",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
              <Sparkles className="h-3.5 w-3.5" />
              Marketing & promotions
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <Megaphone className="h-6 w-6 text-emerald-100" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Marketing Campaigns
              </h1>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50/75 sm:text-base">
              Create and manage promotional banners, announcements and special
              offers across Emirate ErrandHub.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-emerald-50/80">
              <span className="inline-flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                {campaignList.length} total campaigns
              </span>

              <span className="hidden text-white/30 sm:inline">•</span>

              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {activeCount} currently active
              </span>
            </div>
          </div>

          <Button className="relative h-11 shrink-0 rounded-xl bg-white px-5 font-semibold text-emerald-950 shadow-sm hover:bg-emerald-50">
            <Link
              href="/dashboard/admin/marketing/new"
              className="inline-flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total campaigns"
          value={campaignList.length}
          description="All campaigns created"
          icon={Layers3}
          iconClass="bg-muted text-muted-foreground"
        />

        <StatCard
          title="Active campaigns"
          value={activeCount}
          description="Currently eligible to display"
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Scheduled campaigns"
          value={scheduledCount}
          description="Waiting for their start date"
          icon={CalendarDays}
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="Inactive campaigns"
          value={inactiveCount}
          description="Disabled campaigns"
          icon={Clock3}
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </section>

      {/* Campaign list */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              All campaigns
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage campaign content, visibility and scheduling.
            </p>
          </div>

          <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
            {campaignList.length}{" "}
            {campaignList.length === 1 ? "campaign" : "campaigns"}
          </Badge>
        </div>

        {campaignList.length === 0 ? (
          <Card className="overflow-hidden border-dashed shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Megaphone className="h-8 w-8" />
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                No campaigns yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create your first marketing campaign to promote Emirate
                ErrandHub services, announcements and special offers.
              </p>

              <Button className="mt-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                <Link href="/dashboard/admin/marketing/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaignList.map((campaign) => {
              const status = getCampaignStatus(campaign);

              return (
                <Card
                  key={campaign.id}
                  className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
                          {campaign.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={campaign.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold tracking-tight text-foreground">
                              {campaign.title}
                            </h3>

                            {getStatusBadge(status)}
                          </div>

                          {campaign.subtitle && (
                            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                              {campaign.subtitle}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 capitalize">
                              <Megaphone className="h-3.5 w-3.5" />
                              {campaign.placement.replaceAll("_", " ")}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Starts: {formatDate(campaign.starts_at)}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              Ends: {formatDate(campaign.ends_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between lg:border-0 lg:pt-0">
                        <div className="text-xs text-muted-foreground lg:text-right">
                          <p>Display order</p>

                          <p className="mt-1 font-semibold text-foreground">
                            #{campaign.sort_order}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <CampaignActions
                            campaignId={campaign.id}
                            isActive={campaign.is_active}
                          />

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-lg"
                          >
                            <Link
                              href={`/dashboard/admin/marketing/${campaign.id}`}
                              className="inline-flex items-center"
                            >
                              Details
                              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
