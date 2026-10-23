"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  savePlatformLocalizationSettings,
  type LocalizationActionState,
} from "./actions";

type LocalizationSettings = {
  default_country: string;
  default_language: string;
  default_currency: string;
  default_date_format: string;
  default_time_format: string;
  default_time_zone: string;
};

type TimeZoneOption = {
  time_zone: string;
  label: string;
};

type Props = {
  settings: LocalizationSettings;
  timeZones: TimeZoneOption[];
};

const initialState: LocalizationActionState = {};

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

export function LocalizationSettingsForm({ settings, timeZones }: Props) {
  const [state, formAction, pending] = useActionState(
    savePlatformLocalizationSettings,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="default_country" className="text-sm font-medium">
            Default country
          </label>
          <select
            id="default_country"
            name="default_country"
            defaultValue={settings.default_country}
            required
            className={fieldClassName}
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="default_language" className="text-sm font-medium">
            Default language
          </label>
          <select
            id="default_language"
            name="default_language"
            defaultValue={settings.default_language}
            required
            className={fieldClassName}
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>

        <div>
          <label htmlFor="default_currency" className="text-sm font-medium">
            Display currency
          </label>
          <select
            id="default_currency"
            name="default_currency"
            defaultValue={settings.default_currency}
            required
            className={fieldClassName}
          >
            {currencies.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            This changes display preferences only, not payment or payout
            currency.
          </p>
        </div>

        <div>
          <label htmlFor="default_date_format" className="text-sm font-medium">
            Date format
          </label>
          <select
            id="default_date_format"
            name="default_date_format"
            defaultValue={settings.default_date_format}
            required
            className={fieldClassName}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label htmlFor="default_time_format" className="text-sm font-medium">
            Time format
          </label>
          <select
            id="default_time_format"
            name="default_time_format"
            defaultValue={settings.default_time_format}
            required
            className={fieldClassName}
          >
            <option value="12">12-hour (e.g. 2:30 PM)</option>
            <option value="24">24-hour (e.g. 14:30)</option>
          </select>
        </div>

        <div>
          <label htmlFor="default_time_zone" className="text-sm font-medium">
            Default time zone
          </label>
          <select
            id="default_time_zone"
            name="default_time_zone"
            defaultValue={settings.default_time_zone}
            required
            className={fieldClassName}
          >
            {timeZones.map((zone) => (
              <option key={zone.time_zone} value={zone.time_zone}>
                {zone.label} ({zone.time_zone})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Select the platform's default time zone from the supported list.
          </p>
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
        {pending ? "Saving settings..." : "Save platform defaults"}
      </Button>
    </form>
  );
}
