import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WorkerProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkerProfilePage({
  params,
}: WorkerProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select(
      `
        id,
        user_id,
        bio,
        years_of_experience,
        starting_price,
        currency,
        verification_status,
        is_available
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (workerError) {
    console.error("Worker profile error:", workerError);
  }

  if (!workerProfile) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/services"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <UserRound className="h-8 w-8 text-muted-foreground" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight">
                Worker not found
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                This worker profile could not be found or is no longer
                available.
              </p>

              <Link
                href="/services"
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Explore services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .eq("id", workerProfile.user_id)
    .maybeSingle();

  if (profileError) {
    console.error("Worker user profile error:", profileError);
  }

  const workerName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Service Provider";

  const verificationStatus = (
    workerProfile.verification_status ?? "pending"
  ).toLowerCase();

  const isVerified = verificationStatus === "verified";
  const isAvailable = workerProfile.is_available;

  const verificationLabel =
    verificationStatus === "verified"
      ? "Verified professional"
      : verificationStatus === "rejected"
        ? "Verification rejected"
        : verificationStatus === "under_review"
          ? "Under review"
          : "Verification pending";

  const verificationStyle = isVerified
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : verificationStatus === "rejected"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  const experience = workerProfile.years_of_experience;
  const startingPrice = workerProfile.starting_price;
  const currency = workerProfile.currency;

  const formattedPrice =
    startingPrice !== null && startingPrice !== undefined
      ? Number(startingPrice).toLocaleString("en-NG", {
          maximumFractionDigits: 2,
        })
      : null;

  return (
    <main className="min-h-screen bg-muted/30 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* Breadcrumb */}
        <Link
          href="/services"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>

        {/* Profile hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <div className="h-32 bg-linear-to-r from-primary/15 via-primary/5 to-muted sm:h-40" />

          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                {/* Avatar */}
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-muted shadow-sm sm:h-28 sm:w-28">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={`${workerName}'s profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {workerName}
                    </h1>

                    {isVerified && (
                      <BadgeCheck
                        className="h-6 w-6 text-emerald-600"
                        aria-label="Verified professional"
                      />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Service professional on Emirate ErrandHub
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${verificationStyle}`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      {verificationLabel}
                    </span>

                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isAvailable ? "bg-emerald-500" : "bg-muted-foreground"
                        }`}
                      />
                      {isAvailable ? "Available for jobs" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/services"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Explore services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Profile content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            {/* About */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <UserRound className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <CardTitle className="text-lg">
                      About this professional
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get to know your service provider
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {workerProfile.bio?.trim() ||
                    "This service provider has not added a biography yet."}
                </p>
              </CardContent>
            </Card>

            {/* Experience and pricing */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                      <BriefcaseBusiness className="h-5 w-5 text-blue-600" />
                    </div>

                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Experience
                    </span>
                  </div>

                  <p className="mt-5 text-2xl font-bold tracking-tight">
                    {experience !== null && experience !== undefined
                      ? `${experience} ${experience === 1 ? "year" : "years"}`
                      : "Not specified"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Professional experience
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>

                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Pricing
                    </span>
                  </div>

                  <p className="mt-5 text-2xl font-bold tracking-tight">
                    {formattedPrice !== null &&
                    Number.isFinite(Number(startingPrice))
                      ? `${currency ? `${currency} ` : ""}${formattedPrice}`
                      : "Contact for price"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Starting price · Final cost may vary
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Verification information */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Trust and verification
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isVerified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {isVerified
                        ? "Identity or credentials verified"
                        : verificationLabel}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {isVerified
                        ? "This professional has completed the platform's verification process."
                        : verificationStatus === "rejected"
                          ? "This professional has not passed verification. Check the provider's eligibility before proceeding."
                          : verificationStatus === "under_review"
                            ? "This professional's verification is being reviewed."
                            : "This professional has not yet completed verification. Review the available profile details before proceeding."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Availability</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isAvailable
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {isAvailable
                        ? "Accepting new requests"
                        : "Not accepting new requests"}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {isAvailable
                        ? "This professional is currently marked as available for jobs."
                        : "This professional is currently marked as unavailable."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="h-1.5 bg-primary" />

              <CardContent className="p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>

                <h2 className="mt-4 text-lg font-bold">Need a service?</h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Explore available services and find the right professional for
                  your next task.
                </p>

                <Link
                  href="/services"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Browse services
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Find help for your everyday errands
                </p>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                <p className="text-xs leading-5 text-muted-foreground">
                  Always review the service details, agree on pricing, and use
                  the platform's supported processes when arranging a job.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
