"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  LoaderCircle,
  House,
  BriefcaseBusiness,
  MapPinned,
} from "lucide-react";

import { AddressForm } from "./address-form";
import { deleteAddress, setDefaultAddress } from "./actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type CustomerAddress = {
  id: string;
  label: string;
  recipient_name: string | null;
  phone: string | null;
  address_line: string;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
};

type AddressListProps = {
  addresses: CustomerAddress[];
};

export function AddressList({ addresses }: AddressListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const router = useRouter();

  function getAddressIcon(label: string) {
    const normalized = label.toLowerCase();

    if (normalized.includes("home")) return House;
    if (normalized.includes("work") || normalized.includes("office")) {
      return BriefcaseBusiness;
    }

    return MapPinned;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Your locations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {addresses.length} of 20 saved addresses
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingAddressId(null);
            setShowCreateForm((current) => !current);
          }}
          disabled={addresses.length >= 20 && !showCreateForm}
        >
          <Plus className="mr-2 size-4" />
          {showCreateForm ? "Close form" : "Add address"}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="rounded-2xl border-primary/20 shadow-sm">
          <CardContent className="p-5 sm:p-7">
            <h3 className="mb-5 text-lg font-semibold">Add a new address</h3>
            <AddressForm onCancel={() => setShowCreateForm(false)} />
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 && !showCreateForm ? (
        <Card className="rounded-2xl border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="size-8" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">
              No saved addresses yet
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Add your home, workplace, or another location so you can use it
              when requesting a service.
            </p>
            <Button className="mt-5" onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 size-4" />
              Add your first address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {addresses.map((address) => {
            const AddressIcon = getAddressIcon(address.label);
            const isEditing = editingAddressId === address.id;

            return (
              <Card
                key={address.id}
                className={`overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md ${
                  address.is_default ? "border-primary/40" : "border-border/70"
                }`}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <AddressIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="wrap-break-word font-semibold">
                          {address.label}
                        </h3>
                        {address.recipient_name && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {address.recipient_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {address.is_default && (
                      <Badge className="shrink-0 rounded-full">
                        <Star className="mr-1 size-3" />
                        Default
                      </Badge>
                    )}
                  </div>

                  <div className="mt-5 space-y-2 text-sm leading-6">
                    <p>{address.address_line}</p>
                    <p className="text-muted-foreground">
                      {[address.city, address.state, address.postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-muted-foreground">{address.country}</p>
                    {address.phone && (
                      <p className="text-muted-foreground">
                        Phone: {address.phone}
                      </p>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-6 border-t pt-5">
                      <h4 className="mb-4 font-semibold">Edit address</h4>
                      <AddressForm
                        address={address}
                        onCancel={() => setEditingAddressId(null)}
                      />
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCreateForm(false);
                          setEditingAddressId(address.id);
                        }}
                      >
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </Button>

                      {!address.is_default && (
                        <form
                          action={async (formData) => {
                            await setDefaultAddress(formData);
                            router.refresh();
                          }}
                        >
                          <input
                            type="hidden"
                            name="address_id"
                            value={address.id}
                          />
                          <Button type="submit" variant="outline" size="sm">
                            <Star className="mr-2 size-4" />
                            Set default
                          </Button>
                        </form>
                      )}

                      <form
                        action={async (formData) => {
                          if (
                            !window.confirm(
                              `Delete the "${address.label}" address?`,
                            )
                          ) {
                            return;
                          }

                          await deleteAddress(formData);
                          router.refresh();
                        }}
                      >
                        <input
                          type="hidden"
                          name="address_id"
                          value={address.id}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
