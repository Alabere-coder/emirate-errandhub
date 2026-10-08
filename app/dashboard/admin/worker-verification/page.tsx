import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";

export default async function WorkerVerificationPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: workers, error } = await supabase
    .from("worker_profiles")
    .select(
      `
      id,
      user_id,
      verification_status,
      created_at,
      profiles!worker_profiles_user_id_fkey (
        first_name,
        last_name,
        phone
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load workers:", error);
  }

  const workerList = workers ?? [];

  const verifiedCount = workerList.filter(
    (worker) => worker.verification_status === "verified",
  ).length;

  const pendingCount = workerList.filter(
    (worker) => worker.verification_status === "pending",
  ).length;

  const rejectedCount = workerList.filter(
    (worker) => worker.verification_status === "rejected",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Worker Verification
            </h1>

            <p className="text-sm text-muted-foreground">
              Review workers, inspect their documents, and manage verification
              status.
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Workers
            </p>

            <Users className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">{workerList.length}</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Verified</p>

          <p className="mt-2 text-2xl font-semibold text-green-600">
            {verifiedCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Pending</p>

          <p className="mt-2 text-2xl font-semibold text-yellow-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Rejected</p>

          <p className="mt-2 text-2xl font-semibold text-destructive">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Worker list */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">All Workers</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select a worker to review their profile and submitted documents.
          </p>
        </div>

        {workerList.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50" />

            <h3 className="mt-4 font-medium">No workers found</h3>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              There are currently no worker profiles available for review.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {workerList.map((worker) => {
              const profile = Array.isArray(worker.profiles)
                ? worker.profiles[0]
                : worker.profiles;

              const firstName = profile?.first_name ?? "";
              const lastName = profile?.last_name ?? "";

              const fullName =
                `${firstName} ${lastName}`.trim() || "Unnamed Worker";

              const status = worker.verification_status ?? "pending";

              return (
                <div
                  key={worker.id}
                  className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{fullName}</h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          status === "verified"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : status === "rejected"
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                        }`}
                      >
                        {status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile?.phone || "No phone number"}
                    </p>

                    <p
                      className={`mt-1 text-xs font-medium capitalize ${
                        status === "verified"
                          ? "text-green-600"
                          : status === "rejected"
                            ? "text-destructive"
                            : "text-yellow-600"
                      }`}
                    >
                      Status: {status.replace("_", " ")}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Applied{" "}
                      {new Date(worker.created_at).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/admin/worker-verification/${worker.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Review Worker
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// import Link from "next/link";

// import { requireRole } from "@/lib/auth/require-role";
// import { createClient } from "@/lib/supabase/server";

// export default async function WorkerVerificationPage() {
//   await requireRole(["admin"]);

//   const supabase = await createClient();

//   const { data: workers, error } = await supabase
//     .from("worker_profiles")
//     .select(
//       `
//       id,
//       user_id,
//       verification_status,
//       created_at,
//       profiles!worker_profiles_user_id_fkey (
//         first_name,
//         last_name,
//         phone
//       )
//     `,
//     )
//     .in("verification_status", ["pending", "rejected"])
//     .order("created_at", { ascending: true });

//   if (error) {
//     throw new Error("Unable to load workers awaiting verification.");
//   }

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-semibold tracking-tight">
//           Worker Verification
//         </h1>

//         <p className="mt-1 text-sm text-muted-foreground">
//           Review worker documents and verify eligible workers.
//         </p>
//       </div>

//       <div className="rounded-xl border bg-card">
//         {workers?.length === 0 ? (
//           <div className="p-8 text-center">
//             <p className="font-medium">No workers are awaiting verification.</p>

//             <p className="mt-1 text-sm text-muted-foreground">
//               Workers who submit documents will appear here.
//             </p>
//           </div>
//         ) : (
//           <div className="divide-y">
//             {workers?.map((worker) => {
//               const profile = Array.isArray(worker.profiles)
//                 ? worker.profiles[0]
//                 : worker.profiles;

//               const name =
//                 [profile?.first_name, profile?.last_name]
//                   .filter(Boolean)
//                   .join(" ") || "Unnamed Worker";

//               return (
//                 <div
//                   key={worker.id}
//                   className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
//                 >
//                   <div>
//                     <p className="font-semibold">{name}</p>

//                     {profile?.phone && (
//                       <p className="text-sm text-muted-foreground">
//                         {profile.phone}
//                       </p>
//                     )}

//                     <p className="mt-1 text-xs capitalize text-muted-foreground">
//                       Status: {worker.verification_status.replace("_", " ")}
//                     </p>
//                   </div>

//                   <Link
//                     href={`/dashboard/admin/worker-verification/${worker.id}`}
//                     className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
//                   >
//                     Review Worker
//                   </Link>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
