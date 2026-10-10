"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

export type AddressActionState = {
  error?: string;
  success?: string;
};

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(formData: FormData, key: string): string | null {
  return getText(formData, key) || null;
}

function getCoordinates(
  formData: FormData,
): { latitude: number | null; longitude: number | null } | null {
  const latitudeText = getText(formData, "latitude");
  const longitudeText = getText(formData, "longitude");

  if (!latitudeText && !longitudeText) {
    return { latitude: null, longitude: null };
  }

  if (!latitudeText || !longitudeText) return null;

  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function validateAddress(formData: FormData) {
  const label = getText(formData, "label");
  const recipientName = getOptionalText(formData, "recipient_name");
  const phone = getOptionalText(formData, "phone");
  const addressLine = getText(formData, "address_line");
  const city = getText(formData, "city");
  const state = getText(formData, "state");
  const country = getText(formData, "country") || "Nigeria";
  const postalCode = getOptionalText(formData, "postal_code");
  const coordinates = getCoordinates(formData);

  if (!label || !addressLine || !city || !state) {
    return {
      error: "Label, street address, city, and state are required.",
    } as const;
  }

  if (
    label.length > 60 ||
    addressLine.length > 250 ||
    city.length > 100 ||
    state.length > 100 ||
    country.length > 100 ||
    (recipientName && recipientName.length > 120) ||
    (phone && phone.length > 30) ||
    (postalCode && postalCode.length > 20)
  ) {
    return { error: "One or more address fields are too long." } as const;
  }

  if (!coordinates) {
    return {
      error: "Please provide valid latitude and longitude values.",
    } as const;
  }

  return {
    data: {
      label,
      recipient_name: recipientName,
      phone,
      address_line: addressLine,
      city,
      state,
      country,
      postal_code: postalCode,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
  } as const;
}

async function makeDefaultAddress(
  supabase: Awaited<ReturnType<typeof requireRole>>["supabase"],
  customerId: string,
  addressId: string,
) {
  const { data: address, error: lookupError } = await supabase
    .from("customer_addresses")
    .select("id")
    .eq("id", addressId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (lookupError || !address) {
    return { error: "Address not found." };
  }

  const { error: clearError } = await supabase
    .from("customer_addresses")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("customer_id", customerId);

  if (clearError) {
    console.error("Clear default address error:", clearError);
    return { error: "Unable to update the default address." };
  }

  const { error: setError } = await supabase
    .from("customer_addresses")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", addressId)
    .eq("customer_id", customerId);

  if (setError) {
    console.error("Set default address error:", setError);
    return { error: "Unable to set the default address." };
  }

  return { success: "Default address updated successfully." };
}

export async function createAddress(
  _previousState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const { user, supabase } = await requireRole(["customer"]);
  const validated = validateAddress(formData);

  if ("error" in validated) return validated;

  const { count, error: countError } = await supabase
    .from("customer_addresses")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", user.id);

  if (countError) {
    console.error("Count customer addresses error:", countError);
    return { error: "Unable to check your saved addresses." };
  }

  if ((count ?? 0) >= 20) {
    return { error: "You can save up to 20 addresses." };
  }

  const { data: existingDefault, error: defaultLookupError } = await supabase
    .from("customer_addresses")
    .select("id")
    .eq("customer_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  if (defaultLookupError) {
    console.error("Default address lookup error:", defaultLookupError);
    return { error: "Unable to check your default address." };
  }

  const requestedDefault = formData.get("is_default") === "on";
  const shouldBeDefault = requestedDefault || !existingDefault;

  const { data: created, error } = await supabase
    .from("customer_addresses")
    .insert({
      ...validated.data,
      customer_id: user.id,
      is_default: false,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Create customer address error:", error);
    return { error: "Unable to save this address. Please try again." };
  }

  if (shouldBeDefault) {
    const result = await makeDefaultAddress(supabase, user.id, created.id);

    if ("error" in result) {
      return {
        error:
          "Address saved, but setting it as default failed. Please try again.",
      };
    }
  }

  revalidatePath("/dashboard/customer/addresses");
  revalidatePath("/dashboard/customer/requests/new");

  return { success: "Address saved successfully." };
}

export async function updateAddress(
  _previousState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const { user, supabase } = await requireRole(["customer"]);
  const addressId = getText(formData, "address_id");

  if (!addressId) return { error: "Missing address ID." };

  const validated = validateAddress(formData);
  if ("error" in validated) return validated;

  const { error } = await supabase
    .from("customer_addresses")
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", addressId)
    .eq("customer_id", user.id);

  if (error) {
    console.error("Update customer address error:", error);
    return { error: "Unable to update this address. Please try again." };
  }

  if (formData.get("is_default") === "on") {
    const result = await makeDefaultAddress(supabase, user.id, addressId);

    if ("error" in result) return result;
  }

  revalidatePath("/dashboard/customer/addresses");
  revalidatePath("/dashboard/customer/requests/new");

  return { success: "Address updated successfully." };
}

export async function setDefaultAddress(formData: FormData) {
  const { user, supabase } = await requireRole(["customer"]);
  const addressId = getText(formData, "address_id");

  if (!addressId) return { error: "Missing address ID." };

  const result = await makeDefaultAddress(supabase, user.id, addressId);

  if ("error" in result) return result;

  revalidatePath("/dashboard/customer/addresses");
  revalidatePath("/dashboard/customer/requests/new");

  return { success: "Default address updated." };
}

export async function deleteAddress(formData: FormData) {
  const { user, supabase } = await requireRole(["customer"]);
  const addressId = getText(formData, "address_id");

  if (!addressId) return { error: "Missing address ID." };

  const { data: address, error: lookupError } = await supabase
    .from("customer_addresses")
    .select("is_default")
    .eq("id", addressId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (lookupError || !address) {
    return { error: "Address not found." };
  }

  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", user.id);

  if (error) {
    console.error("Delete customer address error:", error);
    return { error: "Unable to delete this address. Please try again." };
  }

  if (address.is_default) {
    const { data: nextAddress } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextAddress) {
      const result = await makeDefaultAddress(
        supabase,
        user.id,
        nextAddress.id,
      );

      if ("error" in result) {
        console.error(
          "Choose replacement default address error:",
          result.error,
        );
      }
    }
  }

  revalidatePath("/dashboard/customer/addresses");
  revalidatePath("/dashboard/customer/requests/new");

  return { success: "Address deleted successfully." };
}
