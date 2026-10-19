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
    quotesResult,
    paymentsResult,
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
      // .select(
      //   "id, request_id, customer_id, worker_id, agreed_amount, currency, scheduled_at, started_at, completed_at, status, created_at",
      // )
      .select(
        "id, request_id, customer_id, worker_id, agreed_amount, currency, scheduled_at, started_at, completed_at, status, customer_confirmed_at, earnings_release_approved_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),

    supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, role, is_active"),

    supabase.from("service_categories").select("id, name"),

    supabase.from("services").select("id, name"),

    supabase
      .from("worker_profiles")
      .select("id, user_id, verification_status, is_available"),

    supabase
      .from("quotes")
      .select(
        "id, request_id, worker_id, amount, currency, message, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("payments")
      .select("id, job_id, status, amount, currency, paid_at")
      .limit(500),
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
    console.error("Admin profiles query failed:", profilesResult.error);

    throw new Error(
      `Unable to load user information: ${profilesResult.error.message}`,
    );
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

  if (quotesResult.error) {
    console.error("Admin quotes query failed:", quotesResult.error.message);
    throw new Error("Unable to load quotations.");
  }

  if (paymentsResult.error) {
    console.error("Admin payments query failed:", paymentsResult.error.message);

    throw new Error("Unable to load payment information.");
  }

  const profiles = profilesResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const services = servicesResult.data ?? [];
  const workerProfiles = workerProfilesResult.data ?? [];
  const quoteRecords = quotesResult.data ?? [];

  const paymentRecords = paymentsResult.data ?? [];

  const paymentMap = new Map(
    paymentRecords.map((payment) => [
      payment.job_id,
      {
        id: payment.id,
        status: payment.status,
        amount: Number(payment.amount),
        currency: payment.currency,
        paid_at: payment.paid_at,
      },
    ]),
  );

  // Profiles are indexed by the Supabase Auth user ID.
  const profileMap = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        role: profile.role,
        isActive: profile.is_active,
      },
    ]),
  );

  // Worker profiles are indexed by worker_profiles.id.
  const workerProfileMap = new Map(
    workerProfiles.map((worker) => [worker.id, worker]),
  );

  const providers = workerProfiles.map((worker) => {
    const profile = profileMap.get(worker.user_id);

    return {
      id: worker.id,
      name: profile?.name || "Unnamed provider",
      phone: profile?.phone ?? null,
      verification_status: worker.verification_status ?? "",
      is_available: worker.is_available ?? false,
    };
  });

  const quotes = quoteRecords.map((quote) => {
    const worker = workerProfileMap.get(quote.worker_id);
    const profile = worker ? profileMap.get(worker.user_id) : undefined;

    return {
      id: quote.id,
      request_id: quote.request_id,
      worker_id: quote.worker_id,
      amount: Number(quote.amount),
      currency: quote.currency || "NGN",
      message: quote.message,
      status: quote.status,
      created_at: quote.created_at,
      workerName: profile?.name || "Service provider",
    };
  });

  const categoryMap = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );

  const serviceMap = Object.fromEntries(
    services.map((service) => [service.id, service.name]),
  );

  const requests = (requestsResult.data ?? []).map((request) => ({
    ...request,
    customerName:
      profileMap.get(request.customer_id)?.name || "Unknown customer",
    customerPhone: profileMap.get(request.customer_id)?.phone ?? null,
    categoryName: request.category_id
      ? (categoryMap[request.category_id] ?? "Unknown category")
      : "Not specified",
    serviceName: request.service_id
      ? (serviceMap[request.service_id] ?? "Unknown service")
      : "General request",
  }));

  const jobs = (jobsResult.data ?? []).map((job) => {
    const worker = job.worker_id
      ? workerProfileMap.get(job.worker_id)
      : undefined;

    const workerProfile = worker ? profileMap.get(worker.user_id) : undefined;

    const payment = paymentMap.get(job.id);

    return {
      ...job,
      paymentStatus: payment?.status ?? "no_payment",
      paymentAmount: payment?.amount ?? null,
      paymentCurrency: payment?.currency ?? null,
      paymentPaidAt: payment?.paid_at ?? null,
      customerName: profileMap.get(job.customer_id)?.name ?? "Unknown customer",
      workerName:
        workerProfile?.name ??
        (job.worker_id ? "Unknown worker" : "Not assigned"),
      workerPhone: workerProfile?.phone ?? null,
      requestTitle:
        requests.find((request) => request.id === job.request_id)?.title ??
        "Service request",
    };
  });

  return (
    <RequestsJobsClient
      requests={requests}
      jobs={jobs}
      providers={providers}
      quotes={quotes}
    />
  );
}
