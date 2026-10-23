"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  savePersonalLocalizationPreferences,
  type PersonalLocalizationActionState,
} from "./actions";

type LocalizationValues = {
  default_country: string;
  default_language: string;
  default_currency: string;
  default_date_format: string;
  default_time_format: string;
  default_time_zone: string;
};

type PersonalPreferences = {
  country: string | null;
  language: string | null;
  display_currency: string | null;
  date_format: string | null;
  time_format: string | null;
  time_zone: string | null;
} | null;

type TimeZoneOption = {
  time_zone: string;
  label: string;
};

type Props = {
  platform: LocalizationValues;
  preferences: PersonalPreferences;
  timeZones: TimeZoneOption[];
};

const initialState: PersonalLocalizationActionState = {};

const countries = [
  "United Arab Emirates",
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United Kingdom",
];

const currencies = [
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "USD", label: "USD — US Dollar" },
];

const fieldClassName =
  "mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function PersonalLocalizationSettingsForm({
  platform,
  preferences,
  timeZones,
}: Props) {
  const [state, formAction, pending] = useActionState(
    savePersonalLocalizationPreferences,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Platform defaults: {platform.default_country},{" "}
        {platform.default_currency}, {platform.default_language.toUpperCase()},{" "}
        {platform.default_time_zone}.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className="text-sm font-medium">
            Country
          </label>
          <select
            id="country"
            name="country"
            defaultValue={preferences?.country ?? ""}
            className={fieldClassName}
          >
            <option value="">
              Use platform default ({platform.default_country})
            </option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="language" className="text-sm font-medium">
            Language
          </label>
          <select
            id="language"
            name="language"
            defaultValue={preferences?.language ?? ""}
            className={fieldClassName}
          >
            <option value="">
              Use platform default ({platform.default_language.toUpperCase()})
            </option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Arabic translations and right-to-left layout will be added
            separately.
          </p>
        </div>

        <div>
          <label htmlFor="display_currency" className="text-sm font-medium">
            Display currency
          </label>
          <select
            id="display_currency"
            name="display_currency"
            defaultValue={preferences?.display_currency ?? ""}
            className={fieldClassName}
          >
            <option value="">
              Use platform default ({platform.default_currency})
            </option>
            {currencies.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Display preference only. Payments and payouts are unchanged.
          </p>
        </div>

        <div>
          <label htmlFor="date_format" className="text-sm font-medium">
            Date format
          </label>
          <select
            id="date_format"
            name="date_format"
            defaultValue={preferences?.date_format ?? ""}
            className={fieldClassName}
          >
            <option value="">
              Use platform default ({platform.default_date_format})
            </option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label htmlFor="time_format" className="text-sm font-medium">
            Time format
          </label>
          <select
            id="time_format"
            name="time_format"
            defaultValue={preferences?.time_format ?? ""}
            className={fieldClassName}
          >
            <option value="">
              Use platform default ({platform.default_time_format}-hour)
            </option>
            <option value="12">12-hour (e.g. 2:30 PM)</option>
            <option value="24">24-hour (e.g. 14:30)</option>
          </select>
        </div>

        <div>
          <label htmlFor="time_zone" className="text-sm font-medium">
            Time zone
          </label>
          <select
            id="time_zone"
            name="time_zone"
            defaultValue={preferences?.time_zone ?? ""}
            className={fieldClassName}
          >
            <option value="">
              Use platform default ({platform.default_time_zone})
            </option>
            {timeZones.map((zone) => (
              <option key={zone.time_zone} value={zone.time_zone}>
                {zone.label} ({zone.time_zone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-green-600">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving preferences..." : "Save my preferences"}
      </Button>
    </form>
  );
}
