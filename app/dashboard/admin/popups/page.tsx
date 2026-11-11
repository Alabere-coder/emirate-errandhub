import Link from "next/link";
import { CalendarDays, Plus, Sparkles, Users } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight">
              Popups & Promotions
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage welcome messages, announcements and promotional popups across
            the public website.
          </p>
        </div>

        <Button>
          <Link
            href="/dashboard/admin/popups/new"
            className="inline-flex items-center gap-2"
          >
            <Plus className="mr-2 size-4" />
            Create Popup
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Popups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{items.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Popups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled Popups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{scheduledCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Popup Campaigns</CardTitle>
        </CardHeader>

        <CardContent>
          {!items.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-4 size-12 text-muted-foreground" />

              <h3 className="text-lg font-semibold">No popups yet</h3>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Create your first popup to welcome visitors, announce updates or
                promote your services.
              </p>

              <Button className="mt-5">
                <Link
                  href="/dashboard/admin/popups/new"
                  className="flex items-center"
                >
                  <Plus className="mr-2 size-4" />
                  Create First Popup
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((campaign) => {
                const status = getPopupStatus(campaign);

                return (
                  <div
                    key={campaign.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 gap-4">
                      {campaign.image_url ? (
                        <img
                          src={campaign.image_url}
                          alt=""
                          className="size-20 shrink-0 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <Sparkles className="size-7" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <h3 className="font-semibold">{campaign.title}</h3>

                        {campaign.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {campaign.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 capitalize">
                            <Users className="size-3" />
                            {formatLabel(campaign.audience)}
                          </span>

                          <span>•</span>

                          <span>{formatLabel(campaign.frequency)}</span>

                          <span>•</span>

                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            Starts:{" "}
                            {campaign.starts_at
                              ? new Date(campaign.starts_at).toLocaleDateString(
                                  "en-NG",
                                )
                              : "Immediately"}
                          </span>

                          <span>•</span>

                          <span>
                            Ends:{" "}
                            {campaign.ends_at
                              ? new Date(campaign.ends_at).toLocaleDateString(
                                  "en-NG",
                                )
                              : "No end date"}
                          </span>

                          <span>•</span>

                          <span>Priority: {campaign.priority}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <Badge
                        variant={
                          status === "Active"
                            ? "default"
                            : status === "Scheduled"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {status}
                      </Badge>

                      <PopupActions
                        campaignId={campaign.id}
                        isActive={campaign.is_active}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
