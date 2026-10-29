"use client";

import { useActionState } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

import { updateGeneralSettings, type GeneralSettingsState } from "./actions";

const initialState: GeneralSettingsState = {};

type GeneralSettingsFormProps = {
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  supportPhone: string;
  canEdit: boolean;
};

export default function GeneralSettingsForm({
  platformName,
  platformDescription,
  supportEmail,
  supportPhone,
  canEdit,
}: GeneralSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateGeneralSettings,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="platformName" className="text-sm font-medium">
          Platform name
        </label>
        <input
          id="platformName"
          name="platformName"
          defaultValue={platformName}
          required
          maxLength={100}
          disabled={!canEdit || pending}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="platformDescription" className="text-sm font-medium">
          Platform description
        </label>
        <textarea
          id="platformDescription"
          name="platformDescription"
          defaultValue={platformDescription}
          maxLength={500}
          rows={3}
          disabled={!canEdit || pending}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          Briefly describe your platform. Maximum 500 characters.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="supportEmail" className="text-sm font-medium">
          Support email
        </label>
        <input
          id="supportEmail"
          name="supportEmail"
          type="email"
          defaultValue={supportEmail}
          maxLength={254}
          disabled={!canEdit || pending}
          placeholder="support@example.com"
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="supportPhone" className="text-sm font-medium">
          Support phone
        </label>
        <input
          id="supportPhone"
          name="supportPhone"
          type="tel"
          defaultValue={supportPhone}
          maxLength={30}
          disabled={!canEdit || pending}
          placeholder="+234..."
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {state.success}
        </p>
      )}

      {canEdit ? (
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save general settings
            </>
          )}
        </button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only a super admin can modify general platform settings.
        </p>
      )}
    </form>
  );
}
