import {
  ShieldCheck,
  UserRound,
  CalendarDays,
  Phone,
  Mail,
  Settings2,
  LockKeyhole,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/get-user";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import AdminProfileForm from "./admin-profile-form";
import AvatarUpload from "./avatar-upload";
import ChangePasswordForm from "./change-password-form";
import ChangeEmailForm from "./change-email-form";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  await requireRole(["admin"]);

  const current = await getCurrentUser();

  if (!current) {
    throw new Error("Unable to load administrator profile.");
  }

  const { user, profile } = current;

  const fullName = `${profile.first_name} ${profile.last_name}`;
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`;

  const createdAt = new Date(profile.created_at).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <ShieldCheck className="size-4" />
          <span className="font-medium">Account management</span>
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">My Profile</h1>

        <p className="mt-2 text-muted-foreground">
          Manage your administrator information and account security.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-28 bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-500" />

            <CardContent className="relative px-6 pb-6">
              <AvatarUpload
                userId={user.id}
                avatarUrl={profile.avatar_url}
                fullName={`${profile.first_name} ${profile.last_name}`}
              />

              <div className="mt-4 space-y-2">
                <h2 className="text-xl font-bold">{fullName}</h2>

                <p className="break-all text-sm text-muted-foreground">
                  {user.email}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge className="bg-emerald-600 hover:bg-emerald-700">
                    <ShieldCheck className="mr-1 size-3" />
                    Administrator
                  </Badge>

                  <Badge
                    variant={profile.is_active ? "outline" : "destructive"}
                  >
                    {profile.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Mail className="size-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Email address
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all text-sm text-muted-foreground">
                        {user.email}
                      </p>

                      <Badge
                        variant={
                          user.email_confirmed_at ? "outline" : "secondary"
                        }
                        className={
                          user.email_confirmed_at
                            ? "border-emerald-600 text-emerald-700"
                            : ""
                        }
                      >
                        {user.email_confirmed_at ? "Verified" : "Not verified"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Phone className="size-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Phone number
                    </p>
                    <p className="text-sm font-medium">
                      {profile.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <CalendarDays className="size-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Member since
                    </p>
                    <p className="text-sm font-medium">{createdAt}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LockKeyhole className="size-4 text-emerald-600" />
                <CardTitle className="text-base">Account security</CardTitle>
              </div>

              <CardDescription>
                Manage your password and protect your administrator account.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Password status
                </span>

                <Badge
                  variant={
                    profile.must_change_password ? "secondary" : "outline"
                  }
                >
                  {profile.must_change_password
                    ? "Change required"
                    : "Up to date"}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Change password</h3>

                <p className="text-sm text-muted-foreground">
                  Verify your current password before setting a new one.
                </p>
              </div>

              <ChangePasswordForm />

              <Separator />

              <p className="text-xs leading-relaxed text-muted-foreground">
                Your administrator role and account status are managed
                separately and cannot be changed from this profile page.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserRound className="size-5 text-emerald-600" />
                <CardTitle>Personal information</CardTitle>
              </div>

              <CardDescription>
                Update the personal information associated with your account.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <AdminProfileForm
                firstName={profile.first_name}
                lastName={profile.last_name}
                phone={profile.phone ?? ""}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="size-5 text-emerald-600" />
                <CardTitle>Account information</CardTitle>
              </div>

              <CardDescription>
                These account details are controlled by the platform.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Account role</p>
                  <p className="text-xs text-muted-foreground">
                    Your platform permission level
                  </p>
                </div>

                <Badge variant="outline" className="capitalize">
                  {String(profile.role).replace("_", " ")}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Account status</p>
                  <p className="text-xs text-muted-foreground">
                    Whether your account is enabled
                  </p>
                </div>

                <Badge variant={profile.is_active ? "outline" : "destructive"}>
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Profile ID</p>
                  <p className="text-xs text-muted-foreground">
                    Your unique account identifier
                  </p>
                </div>

                <span className="max-w-40 truncate font-mono text-xs text-muted-foreground">
                  {profile.id}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-emerald-600" />
                <CardTitle>Email & verification</CardTitle>
              </div>

              <CardDescription>
                Manage your administrator email address and verification.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Email verification</p>
                  <p className="text-xs text-muted-foreground">
                    Your current account verification status
                  </p>
                </div>

                <Badge
                  variant={user.email_confirmed_at ? "outline" : "secondary"}
                  className={
                    user.email_confirmed_at
                      ? "border-emerald-600 text-emerald-700"
                      : ""
                  }
                >
                  {user.email_confirmed_at ? "Verified" : "Not verified"}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Change email address</h3>

                <p className="text-sm text-muted-foreground">
                  Request a change to your administrator login email.
                </p>
              </div>

              <ChangeEmailForm currentEmail={user.email ?? ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
