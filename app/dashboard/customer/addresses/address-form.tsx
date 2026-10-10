"use client";

import { useActionState } from "react";
import {
  createAddress,
  updateAddress,
  type AddressActionState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, LoaderCircle, MapPin } from "lucide-react";

type AddressFormValues = {
  id?: string;
  label?: string;
  recipient_name?: string | null;
  phone?: string | null;
  address_line?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
};

type AddressFormProps = {
  address?: AddressFormValues;
  onCancel?: () => void;
};

const initialState: AddressActionState = {};

export function AddressForm({ address, onCancel }: AddressFormProps) {
  const action = address?.id ? updateAddress : createAddress;

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {address?.id && (
        <input type="hidden" name="address_id" value={address.id} />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="label">Address label *</Label>
          <Input
            id="label"
            name="label"
            placeholder="e.g. Home, Work"
            defaultValue={address?.label ?? "Home"}
            maxLength={60}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient_name">Recipient name</Label>
          <Input
            id="recipient_name"
            name="recipient_name"
            placeholder="Who should we contact?"
            defaultValue={address?.recipient_name ?? ""}
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Contact phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="e.g. 08012345678"
            defaultValue={address?.phone ?? ""}
            maxLength={30}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            name="country"
            defaultValue={address?.country ?? "Nigeria"}
            maxLength={100}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address_line">Street address *</Label>
          <Textarea
            id="address_line"
            name="address_line"
            placeholder="House number, street, estate or nearby landmark"
            defaultValue={address?.address_line ?? ""}
            maxLength={250}
            required
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City or town *</Label>
          <Input
            id="city"
            name="city"
            placeholder="e.g. Ibadan"
            defaultValue={address?.city ?? ""}
            maxLength={100}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            name="state"
            placeholder="e.g. Oyo"
            defaultValue={address?.state ?? ""}
            maxLength={100}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code</Label>
          <Input
            id="postal_code"
            name="postal_code"
            placeholder="Optional"
            defaultValue={address?.postal_code ?? ""}
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude (optional)</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            placeholder="e.g. 7.3775"
            defaultValue={address?.latitude ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude (optional)</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            placeholder="e.g. 3.9470"
            defaultValue={address?.longitude ?? ""}
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border p-4">
        <MapPin className="mt-0.5 size-5 text-primary" />
        <div className="flex-1 space-y-1">
          <Label htmlFor="is_default" className="font-medium">
            Set as default address
          </Label>
          <p className="text-sm text-muted-foreground">
            Use this address as the preferred location for future service
            requests.
          </p>
        </div>
        <Checkbox
          id="is_default"
          name="is_default"
          value="on"
          defaultChecked={address?.is_default ?? false}
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <p>{state.success}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
          {isPending
            ? "Saving address..."
            : address?.id
              ? "Save changes"
              : "Save address"}
        </Button>
      </div>
    </form>
  );
}
