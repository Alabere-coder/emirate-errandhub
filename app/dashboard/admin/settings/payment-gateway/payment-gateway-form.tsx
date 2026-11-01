"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentGatewayFormProps = {
  initialProvider: "paystack" | "flutterwave";
  initialEnvironment: "test" | "live";
  initialIsEnabled: boolean;
  canEdit: boolean;
};

export default function PaymentGatewayForm({
  initialProvider,
  initialEnvironment,
  initialIsEnabled,
  canEdit,
}: PaymentGatewayFormProps) {
  const [provider, setProvider] = useState(initialProvider);
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [isEnabled, setIsEnabled] = useState(initialIsEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("payment_gateway_settings")
      .update({
        provider,
        environment,
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("singleton", true);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setMessage("Payment gateway settings saved successfully.");
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Gateway status</p>
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? "The gateway is marked as enabled."
                : "The gateway is currently disabled."}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isEnabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payment-provider">Payment provider</Label>
          <Select
            value={provider}
            onValueChange={(value) =>
              setProvider(value as "paystack" | "flutterwave")
            }
            disabled={!canEdit || saving}
          >
            <SelectTrigger id="payment-provider">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paystack">Paystack</SelectItem>
              <SelectItem value="flutterwave">Flutterwave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-environment">Environment</Label>
          <Select
            value={environment}
            onValueChange={(value) => setEnvironment(value as "test" | "live")}
            disabled={!canEdit || saving}
          >
            <SelectTrigger id="payment-environment">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test">Test mode</SelectItem>
              <SelectItem value="live">Live mode</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => setIsEnabled(event.target.checked)}
            disabled={!canEdit || saving}
            className="mt-1 size-4 accent-emerald-600"
          />
          <span>
            <span className="block text-sm font-medium">
              Enable payment gateway
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              This saves the gateway's enabled setting. Actual payment
              processing will remain unavailable until credentials and
              server-side payment integration are configured.
            </span>
          </span>
        </label>
      </div>

      {!canEdit && (
        <p className="text-sm text-muted-foreground">
          Only super admins can change payment gateway settings.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {message && <p className="text-sm text-emerald-600">{message}</p>}

      {canEdit && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Payment Settings"}
        </Button>
      )}
    </div>
  );
}
