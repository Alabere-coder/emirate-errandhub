import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { RequestsJobsClient } from "./requests-jobs-client";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  await requireRole(["admin"]);

  const supabase = createAdminClient();

  const [
    requestsResult,
    jobsResult,
    profilesResult,
    categoriesResult,
    servicesResult,
    workerProfilesResult,
  ] = await Promise.all([
    supabase
      .from("service_requests")
      .select(
        "id, customer_id, category_id, service_id, title, description, budget, currency, preferred_date, preferred_time, is_urgent, address, city, state, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),

    supabase
      .from("jobs")
      .select(
        "id, request_id, customer_id, worker_id, agreed_amount, currency, scheduled_at, started_at, completed_at, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),

    supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, role, is_active"),

    supabase.from("service_categories").select("id, name"),

    supabase.from("services").select("id, name"),

    supabase.from("worker_profiles").select("id, user_id"),
  ]);

  if (requestsResult.error) {
    console.error("Admin requests query failed:", requestsResult.error.message);
    throw new Error("Unable to load service requests.");
  }

  if (jobsResult.error) {
    console.error("Admin jobs query failed:", jobsResult.error.message);
    throw new Error("Unable to load jobs.");
  }

  if (profilesResult.error) {
    console.error("Admin profiles query failed:", profilesResult.error.message);
    throw new Error("Unable to load user information.");
  }

  if (categoriesResult.error) {
    console.error(
      "Admin categories query failed:",
      categoriesResult.error.message,
    );
    throw new Error("Unable to load service categories.");
  }

  if (servicesResult.error) {
    console.error("Admin services query failed:", servicesResult.error.message);
    throw new Error("Unable to load services.");
  }

  if (workerProfilesResult.error) {
    console.error(
      "Admin worker profiles query failed:",
      workerProfilesResult.error.message,
    );
    throw new Error("Unable to load worker profiles.");
  }

  const profiles = profilesResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const services = servicesResult.data ?? [];

  const profileMap = Object.fromEntries(
    profiles.map((profile) => [
      profile.id,
      {
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        phone: profile.phone,
        role: profile.role,
        isActive: profile.is_active,
      },
    ]),
  );

  const workerProfiles = workerProfilesResult.data ?? [];

  const workerProfileMap = Object.fromEntries(
    workerProfiles.map((worker) => [worker.id, profileMap[worker.user_id]]),
  );

  const categoryMap = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );

  const serviceMap = Object.fromEntries(
    services.map((service) => [service.id, service.name]),
  );

  const requests = (requestsResult.data ?? []).map((request) => ({
    ...request,
    customerName: profileMap[request.customer_id]?.name ?? "Unknown customer",
    customerPhone: profileMap[request.customer_id]?.phone ?? null,
    categoryName: request.category_id
      ? (categoryMap[request.category_id] ?? "Unknown category")
      : "Not specified",
    serviceName: request.service_id
      ? (serviceMap[request.service_id] ?? "Unknown service")
      : "General request",
  }));

  const jobs = (jobsResult.data ?? []).map((job) => ({
    ...job,
    customerName: profileMap[job.customer_id]?.name ?? "Unknown customer",

    workerName: job.worker_id
      ? (workerProfileMap[job.worker_id]?.name ?? "Unknown worker")
      : "Not assigned",

    workerPhone: job.worker_id
      ? (workerProfileMap[job.worker_id]?.phone ?? null)
      : null,
    requestTitle:
      requests.find((request) => request.id === job.request_id)?.title ??
      "Service request",
  }));

  return <RequestsJobsClient requests={requests} jobs={jobs} />;
}
