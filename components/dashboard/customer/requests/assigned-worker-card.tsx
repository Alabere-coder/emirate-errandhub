import Link from "next/link";
import { UserRound, ShieldCheck, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AssignedWorkerCardProps = {
  worker: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  workerProfile: {
    id: string;
    bio: string | null;
    years_of_experience: number | null;
    verification_status: string;
    is_available: boolean;
  } | null;
};

export function AssignedWorkerCard({
  worker,
  workerProfile,
}: AssignedWorkerCardProps) {
  if (!worker || !workerProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Worker</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Worker information is currently unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const name =
    [worker.first_name, worker.last_name].filter(Boolean).join(" ") ||
    "Service Provider";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Worker</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted">
            {worker.avatar_url ? (
              <img
                src={worker.avatar_url}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div>
            <h3 className="font-semibold">{name}</h3>

            {workerProfile.verification_status === "verified" && (
              <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified provider
              </div>
            )}
          </div>
        </div>

        {workerProfile.bio && (
          <div>
            <p className="text-sm font-medium">About</p>

            <p className="mt-1 text-sm text-muted-foreground">
              {workerProfile.bio}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" />

          <span>
            {workerProfile.years_of_experience ?? 0} years of experience
          </span>
        </div>

        <Button variant="outline" className="w-full">
          <Link href={`/workers/${workerProfile.id}`}>View Worker Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
