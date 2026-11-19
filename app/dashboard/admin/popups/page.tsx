import Link from "next/link";
import type { ElementType } from "react";

import {
  CalendarDays,
  Clock3,
  Plus,
  Sparkles,
  Users,
  Layers3,
  CheckCircle2,
  Megaphone,
  ImageIcon,
  Eye,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { PopupActions } from "./popup-actions";

export const dynamic = "force-dynamic";

type PopupCampaign = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  audience: string;
  frequency: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  created_at: string;
};

function getPopupStatus(campaign: PopupCampaign) {
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

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not specified";

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
  icon: ElementType;
  iconClass: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 shadow-sm">
      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl" />
      <CardContent className="relative flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
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

export default async function AdminPopupsPage() {
  await requireRole(["admin", "super_admin"]);

  const supabase = createAdminClient();

  const { data: campaigns, error } = await supabase
    .from("popup_campaigns")
    .select(
      "id, title, description, image_url, audience, frequency, is_active, starts_at, ends_at, priority, created_at",
    )
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load popup campaigns error:", error);
    throw new Error("Unable to load popup campaigns.");
  }

  const items = (campaigns ?? []) as PopupCampaign[];

  const activeCount = items.filter(
    (item) => getPopupStatus(item) === "Active",
  ).length;

  const scheduledCount = items.filter(
    (item) => getPopupStatus(item) === "Scheduled",
  ).length;

  const inactiveCount = items.filter(
    (item) => getPopupStatus(item) === "Inactive",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
              <Sparkles className="h-3.5 w-3.5" />
              Marketing & engagement
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-card/10">
                <Megaphone className="h-6 w-6 text-emerald-100" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Popups & Promotions
              </h1>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50/75 sm:text-base">
              Create and manage welcome messages, announcements and promotional
              popups across the Emirate ErrandHub website.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-emerald-50/80">
              <span className="inline-flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                {items.length} total popups
              </span>

              <span className="hidden text-white/30 sm:inline">•</span>

              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {activeCount} currently active
              </span>
            </div>
          </div>

          <Button className="relative h-11 shrink-0 rounded-xl bg-card px-5 font-semibold text-emerald-950 shadow-sm hover:bg-emerald-50">
            <Link href="/dashboard/admin/popups/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Popup
            </Link>
          </Button>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total popups"
          value={items.length}
          description="All created popup campaigns"
          icon={Layers3}
          iconClass="bg-muted0/10 text-muted-foreground dark:text-slate-300"
        />

        <StatCard
          title="Active popups"
          value={activeCount}
          description="Currently eligible to display"
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Scheduled popups"
          value={scheduledCount}
          description="Waiting for their start date"
          icon={CalendarDays}
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="Inactive popups"
          value={inactiveCount}
          description="Disabled popup campaigns"
          icon={Clock3}
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </section>

      {/* Campaign list */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              All popup campaigns
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage popup content, audience targeting and display frequency.
            </p>
          </div>

          <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
            {items.length} {items.length === 1 ? "popup" : "popups"}
          </Badge>
        </div>

        {items.length === 0 ? (
          <Card className="overflow-hidden border-dashed shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-8 w-8" />
              </div>

              <h3 className="text-lg font-semibold">No popup campaigns yet</h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create your first popup to welcome visitors, announce updates or
                promote Emirate ErrandHub services.
              </p>

              <Button className="mt-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                <Link href="/dashboard/admin/popups/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Popup
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((campaign) => {
              const status = getPopupStatus(campaign);

              return (
                <Card
                  key={campaign.id}
                  className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
                          {campaign.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={campaign.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-7 w-7 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold tracking-tight">
                              {campaign.title}
                            </h3>
                            {getStatusBadge(status)}
                          </div>

                          {campaign.description && (
                            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                              {campaign.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 capitalize">
                              <Users className="h-3.5 w-3.5" />
                              {formatLabel(campaign.audience)}
                            </span>

                            <span className="inline-flex items-center gap-1.5 capitalize">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatLabel(campaign.frequency)}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Starts: {formatDate(campaign.starts_at)}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Ends: {formatDate(campaign.ends_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between lg:border-0 lg:pt-0">
                        <div className="text-xs text-muted-foreground lg:text-right">
                          <p>Display priority</p>
                          <p className="mt-1 font-semibold text-foreground">
                            #{campaign.priority}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <PopupActions
                            campaignId={campaign.id}
                            isActive={campaign.is_active}
                          />

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                          >
                            <Link
                              href={`/dashboard/admin/popups/${campaign.id}`}
                              className="flex items-center gap-1 text-sm"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View details
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
