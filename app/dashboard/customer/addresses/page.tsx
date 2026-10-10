import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, MapPinned } from "lucide-react";
import { AddressList, type CustomerAddress } from "./address-list";

export default async function CustomerAddressesPage() {
  const { user, supabase } = await requireRole(["customer"]);

  const { data, error } = await supabase
    .from("customer_addresses")
    .select(
      "id, label, recipient_name, phone, address_line, city, state, country, postal_code, latitude, longitude, is_default, created_at",
    )
    .eq("customer_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load customer addresses error:", error);

    return (
      <div className="mx-auto max-w-6xl py-10">
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <MapPin className="mx-auto size-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">
              Unable to load addresses
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <header>
        <p className="text-sm font-medium text-primary">Account settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Saved addresses
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Manage the locations where you need services. Choose a default address
          to make future requests easier.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPinned className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saved locations</p>
              <p className="mt-1 text-2xl font-bold">{data.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MapPin className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Default location</p>
              <p className="mt-1 text-lg font-semibold">
                {data.find((address) => address.is_default)?.label ?? "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddressList addresses={(data ?? []) as CustomerAddress[]} />
    </main>
  );
}
