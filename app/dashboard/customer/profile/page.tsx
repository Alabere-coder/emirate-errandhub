import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { CustomerProfileForm } from "./customer-profile-form";
import { CustomerAvatarForm } from "./avatar-form";

export default async function CustomerProfilePage() {
  const { user, supabase } = await requireRole(["customer"]);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, phone, avatar_url, role, is_active, created_at",
    )
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Load customer profile error:", error);

    return (
      <div className="mx-auto max-w-3xl py-10">
        <Card className="rounded-2xl">
          <CardContent className="py-10 text-center">
            <h1 className="text-xl font-semibold">Unable to load profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  const memberSince = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
  }).format(new Date(profile.created_at));

  const initials =
    `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();

  let avatarDisplayUrl: string | null = null;

  if (profile.avatar_url) {
    // Support existing full URLs as well as paths stored in Supabase Storage.
    if (profile.avatar_url.startsWith("http")) {
      avatarDisplayUrl = profile.avatar_url;
    } else {
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(profile.avatar_url);

      avatarDisplayUrl = data.publicUrl;
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <div>
        <p className="text-sm font-medium text-primary">Account settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          My Profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Manage your personal information and keep your account details up to
          date.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.5fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
            <div className="h-24 bg-linear-to-r from-primary/25 via-primary/10 to-transparent" />
            <CardContent className="-mt-12 px-6 pb-6">
              {avatarDisplayUrl ? (
                <img
                  src={avatarDisplayUrl}
                  alt={fullName}
                  className="h-24 w-24 rounded-2xl border-4 border-background bg-muted object-cover shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-background bg-primary text-2xl font-bold text-primary-foreground shadow-md">
                  {initials || <UserRound className="h-8 w-8" />}
                </div>
              )}

              <div className="mt-4">
                <CustomerAvatarForm />
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-tight">
                {fullName || "Customer"}
              </h2>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {user.email ?? "No email available"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Customer
                </Badge>
                <Badge
                  variant={profile.is_active ? "default" : "destructive"}
                  className="rounded-full px-3 py-1"
                >
                  {profile.is_active ? "Active account" : "Inactive account"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Account overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Member since</p>
                  <p className="mt-1 text-sm font-medium">{memberSince}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account type</p>
                  <p className="mt-1 text-sm font-medium">Customer account</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-5">
              <CardTitle className="text-lg">Personal information</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Update the details associated with your customer account.
              </p>
            </CardHeader>

            <CardContent className="pt-6">
              <CustomerProfileForm
                firstName={profile.first_name}
                lastName={profile.last_name}
                phone={profile.phone ?? ""}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Contact information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email address</p>
                  <p className="mt-1 break-all text-sm font-medium">
                    {user.email ?? "No email available"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Managed through your authentication account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone number</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile.phone || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
