import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/services"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>

        <Card>
          <CardContent className="py-12 text-center">
            <UserRound className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

            <h1 className="text-xl font-semibold">Worker not found</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              This worker profile could not be found or is no longer available.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      first_name,
      last_name,
      avatar_url
    `,
    )
    .eq("id", workerProfile.user_id)
    .maybeSingle();

  if (profileError) {
    console.error("Worker user profile error:", profileError);
  }

  const workerName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Service Provider";

  const isVerified = workerProfile.verification_status === "verified";

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/services"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to services
      </Link>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center p-6 text-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={workerName}
                className="h-28 w-28 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted">
                <UserRound className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            <h1 className="mt-4 text-xl font-semibold">{workerName}</h1>

            <div className="mt-2 flex items-center gap-2">
              {isVerified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Verified</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Verification pending
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <span
                className={
                  workerProfile.is_available
                    ? "text-green-600"
                    : "text-muted-foreground"
                }
              >
                {workerProfile.is_available
                  ? "Available for jobs"
                  : "Currently unavailable"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this worker</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {workerProfile.bio ||
                  "This service provider has not added a bio yet."}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>

                    <p className="font-medium">
                      {workerProfile.years_of_experience ?? 0} years
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Starting price
                    </p>

                    <p className="font-medium">
                      {workerProfile.currency}{" "}
                      {Number(
                        workerProfile.starting_price ?? 0,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Worker status</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                {workerProfile.is_available
                  ? "This worker is currently accepting service requests."
                  : "This worker is currently not accepting new requests."}
              </p>
            </CardContent>
          </Card>

          <Button>
            <Link href="/services">Find a service</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
