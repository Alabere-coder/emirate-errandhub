import Link from "next/link";
import { Megaphone, Plus, CalendarDays } from "lucide-react";

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
    throw new Error("Unable to load marketing campaigns.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight">
              Marketing Campaigns
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage promotional banners and announcements across Emirate
            ErrandHub.
          </p>
        </div>

        <Button>
          <Link
            href="/dashboard/admin/marketing/new"
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{campaigns?.length ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {campaigns?.filter(
                (campaign) =>
                  getCampaignStatus(campaign as Campaign) === "Active",
              ).length ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {campaigns?.filter(
                (campaign) =>
                  getCampaignStatus(campaign as Campaign) === "Scheduled",
              ).length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>

        <CardContent>
          {!campaigns?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="mb-4 h-12 w-12 text-muted-foreground" />

              <h3 className="text-lg font-semibold">No campaigns yet</h3>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Create your first marketing campaign to promote Emirate
                ErrandHub services, announcements and special offers.
              </p>

              <Button className="mt-5">
                <Link
                  href="/dashboard/admin/marketing/new"
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((item) => {
                const campaign = item as Campaign;
                const status = getCampaignStatus(campaign);

                return (
                  <div
                    key={campaign.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold">{campaign.title}</h3>

                      {campaign.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {campaign.subtitle}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {campaign.placement.replaceAll("_", " ")}
                        </span>

                        <span>•</span>

                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {campaign.starts_at
                            ? new Date(campaign.starts_at).toLocaleDateString()
                            : "No start date"}
                        </span>
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

                      <CampaignActions
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
