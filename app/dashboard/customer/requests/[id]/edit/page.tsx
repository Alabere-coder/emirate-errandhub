import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewRequestForm from "@/components/dashboard/customer/requests/new-request-form";

type EditRequestPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerRequestPage({
  params,
}: EditRequestPageProps) {
  const { user } = await requireRole(["customer"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("service_requests")
    .select(
      "id, customer_id, category_id, service_id, title, description, budget, currency, preferred_date, preferred_time, is_urgent, address, city, state, latitude, longitude, status",
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Load request for editing error:", error);
    redirect(`/dashboard/customer/requests/${id}`);
  }

  if (!request) {
    notFound();
  }

  if (request.status !== "pending") {
    redirect(`/dashboard/customer/requests/${id}`);
  }

  const [
    { data: categories, error: categoriesError },
    { data: services, error: servicesError },
    { data: savedAddresses, error: addressesError },
  ] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("services")
      .select("id, category_id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase.from("customer_addresses").select("*").eq("customer_id", user.id),
  ]);

  if (categoriesError) {
    console.error("Load categories for editing error:", categoriesError);
  }

  if (servicesError) {
    console.error("Load services for editing error:", servicesError);
  }

  if (addressesError) {
    console.error("Load saved addresses for editing error:", addressesError);
  }

  const { data: mediaRows, error: mediaError } = await supabase
    .from("service_request_media")
    .select("id, file_url, file_type")
    .eq("request_id", request.id);

  if (mediaError) {
    console.error("Load request media error:", mediaError);
  }

  const existingMedia = await Promise.all(
    (mediaRows ?? []).map(async (media) => {
      const { data, error } = await supabase.storage
        .from("request-media")
        .createSignedUrl(media.file_url, 3600);

      if (error) {
        console.error("Create signed media URL error:", error);
      }

      return {
        ...media,
        file_url: data?.signedUrl ?? "",
      };
    }),
  );

  if (mediaError) {
    console.error("Load request media error:", mediaError);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
      <Button variant="ghost" className="-ml-2 rounded-xl">
        <Link href={`/dashboard/customer/requests/${request.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Request
        </Link>
      </Button>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-6 py-5">
          <CardTitle className="text-xl font-bold">
            Edit Service Request
          </CardTitle>
          <p className="text-sm text-slate-500">
            Update the details of your pending request.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Changes can only be made while this request is pending.
          </div>

          <NewRequestForm
            categories={(categories ?? []).map((category) => ({
              ...category,
              description: null,
              icon: null,
            }))}
            services={(services ?? []).map((service) => ({
              ...service,
              description: null,
              icon: null,
            }))}
            initialCategoryId={request.category_id}
            initialServiceId={request.service_id}
            selectedWorkerId={null}
            selectedWorkerName={null}
            savedAddresses={savedAddresses ?? []}
            initialRequest={{
              id: request.id,
              category_id: request.category_id,
              service_id: request.service_id,
              title: request.title,
              description: request.description,
              budget: request.budget,
              currency: request.currency,
              preferred_date: request.preferred_date,
              preferred_time: request.preferred_time,
              is_urgent: request.is_urgent,
              address: request.address,
              city: request.city,
              state: request.state,
              latitude: request.latitude,
              longitude: request.longitude,
            }}
            existingMedia={existingMedia ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
