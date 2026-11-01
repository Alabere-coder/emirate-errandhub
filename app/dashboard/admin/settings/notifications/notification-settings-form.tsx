
"use client";

import { useActionState } from "react";
import { Bell, Mail, MessageSquare, Smartphone, CreditCard, BriefcaseBusiness, Megaphone } from "lucide-react";

import {
  updateNotificationSettings,
  type NotificationSettingsState,
  type PlatformNotificationSettings,
} from "./actions";

import { Button } from "@/components/ui/button";

const initialState: NotificationSettingsState = {};

type Props = {
  initialSettings: PlatformNotificationSettings;
  canEdit: boolean;
};

const defaultOptions = [
  {
    name: "default_email_notifications",
    label: "Email notifications",
    description: "Default email notification preference for new users.",
    icon: Mail,
  },
  {
    name: "default_push_notifications",
    label: "Push notifications",
    description: "Default browser and device push notification preference.",
    icon: Bell,
  },
  {
    name: "default_sms_notifications",
    label: "SMS notifications",
    description: "Default SMS notification preference for new users.",
    icon: Smartphone,
  },
  {
    name: "default_job_updates",
    label: "Job updates",
    description: "Updates about job requests, assignments and progress.",
    icon: BriefcaseBusiness,
  },
  {
    name: "default_message_notifications",
    label: "Message notifications",
    description: "Alerts when users receive new messages.",
    icon: MessageSquare,
  },
  {
    name: "default_payment_notifications",
    label: "Payment notifications",
    description: "Updates about payments, earnings and transactions.",
    icon: CreditCard,
  },
  {
    name: "default_marketing_notifications",
    label: "Marketing notifications",
    description: "Promotions, announcements and platform news.",
    icon: Megaphone,
  },
] as const;

const adminOptions = [
  {
    name: "admin_email_notifications",
    label: "Email alerts",
    description: "Receive platform alerts through email.",
    icon: Mail,
  },
  {
    name: "admin_push_notifications",
    label: "Push alerts",
    description: "Receive platform alerts through browser push notifications.",
    icon: Bell,
  },
  {
    name: "admin_sms_notifications",
    label: "SMS alerts",
    description: "Receive important platform alerts through SMS.",
    icon: Smartphone,
  },
  {
    name: "admin_job_updates",
    label: "Job alerts",
    description: "Receive alerts about job activity.",
    icon: BriefcaseBusiness,
  },
  {
    name: "admin_message_notifications",
    label: "Message alerts",
    description: "Receive alerts about new messages.",
    icon: MessageSquare,
  },
  {
    name: "admin_payment_notifications",
    label: "Payment alerts",
    description: "Receive alerts about payments and transactions.",
    icon: CreditCard,
  },
] as const;

export default function NotificationSettingsForm({
  initialSettings,
  canEdit,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateNotificationSettings,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">New User Defaults</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Default notification preferences assigned to newly registered
            customers and workers. Existing users' preferences are not changed.
          </p>
        </div>

        <div className="divide-y rounded-xl border">
          {defaultOptions.map((option) => {
            const Icon = option.icon;

            return (
              <label
                key={option.name}
                className="flex items-center justify-between gap-4 p-4"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <span className="rounded-lg bg-muted p-2">
                    <Icon className="size-4" />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </span>

                <input
                  type="hidden"
                  name={option.name}
                  value="false"
                />
                <input
                  type="checkbox"
                  name={option.name}
                  value="true"
                  defaultChecked={initialSettings[option.name]}
                  disabled={!canEdit || isPending}
                  className="size-5 shrink-0 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Administrator Alerts</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure the notification channels and activity alerts for
            administrators and super administrators.
          </p>
        </div>

        <div className="divide-y rounded-xl border">
          {adminOptions.map((option) => {
            const Icon = option.icon;

            return (
              <label
                key={option.name}
                className="flex items-center justify-between gap-4 p-4"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <span className="rounded-lg bg-muted p-2">
                    <Icon className="size-4" />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </span>

                <input
                  type="hidden"
                  name={option.name}
                  value="false"
                />
                <input
                  type="checkbox"
                  name={option.name}
                  value="true"
                  defaultChecked={initialSettings[option.name]}
                  disabled={!canEdit || isPending}
                  className="size-5 shrink-0 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
                />
              </label>
            );
          })}
        </div>
      </section>

      {!canEdit && (
        <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          You can view these settings, but only a super administrator can
          change them.
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-emerald-600">
          {state.success}
        </p>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Notification Settings"}
          </Button>
        </div>
      )}
    </form>
  );
}
