"use client";

import { useActionState, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CreditCard,
  Mail,
  MessageCircle,
  Smartphone,
  BellRing,
  Megaphone,
  Save,
} from "lucide-react";

import {
  updateMyNotificationPreferences,
  type NotificationPreferencesState,
} from "./actions";

type NotificationPreferences = {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  job_updates: boolean;
  message_notifications: boolean;
  payment_notifications: boolean;
  marketing_notifications: boolean;
};

type Props = {
  initialSettings: NotificationPreferences;
};

const initialState: NotificationPreferencesState = {};

const sections = [
  {
    title: "Delivery channels",
    description: "Choose how you would like to receive notifications.",
    items: [
      {
        name: "email_notifications",
        label: "Email notifications",
        description: "Receive updates through your registered email address.",
        icon: Mail,
      },
      {
        name: "push_notifications",
        label: "Push notifications",
        description: "Receive push alerts when supported by your device.",
        icon: BellRing,
      },
      {
        name: "sms_notifications",
        label: "SMS notifications",
        description: "Receive text message alerts on your phone.",
        icon: Smartphone,
      },
    ],
  },
  {
    title: "Activity notifications",
    description: "Choose which types of activity updates you want to receive.",
    items: [
      {
        name: "job_updates",
        label: "Job updates",
        description: "Updates about service requests, jobs, and job progress.",
        icon: BriefcaseBusiness,
      },
      {
        name: "message_notifications",
        label: "Messages",
        description: "Alerts when you receive new messages.",
        icon: MessageCircle,
      },
      {
        name: "payment_notifications",
        label: "Payment notifications",
        description: "Updates about payments, earnings, and transactions.",
        icon: CreditCard,
      },
      {
        name: "marketing_notifications",
        label: "Promotional updates",
        description: "Occasional news, offers, and platform announcements.",
        icon: Megaphone,
      },
    ],
  },
] as const;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function NotificationPreferencesForm({ initialSettings }: Props) {
  const [state, formAction, isPending] = useActionState(
    updateMyNotificationPreferences,
    initialState,
  );

  // const [pushEnabled, setPushEnabled] = useState(
  //   initialSettings.push_notifications,
  // );

  const [preferences, setPreferences] = useState(initialSettings);

  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  async function handlePushChange(enabled: boolean) {
    setPushError("");
    setPushBusy(true);

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error(
          "Your browser does not support browser push notifications.",
        );
      }

      if (!("Notification" in window)) {
        throw new Error("Your browser does not support desktop notifications.");
      }

      if (enabled) {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!publicKey) {
          throw new Error(
            "The push notification public key is not configured.",
          );
        }

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          throw new Error(
            "Notification permission was not granted. Please allow notifications in your browser settings.",
          );
        }

        const registration = await navigator.serviceWorker.register("/sw.js");

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        const response = await fetch("/api/notifications/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to register browser notifications.",
          );
        }

        setPreferences((current) => ({
          ...current,
          push_notifications: true,
        }));
      } else {
        const registration =
          await navigator.serviceWorker.getRegistration("/sw.js");

        const subscription = await registration?.pushManager.getSubscription();

        if (subscription) {
          const response = await fetch("/api/notifications/push/subscribe", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.error || "Unable to disable browser notifications.",
            );
          }

          await subscription.unsubscribe();
        }

        setPreferences((current) => ({
          ...current,
          push_notifications: false,
        }));
      }
    } catch (error) {
      setPushError(
        error instanceof Error
          ? error.message
          : "Unable to update browser push notifications.",
      );
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {sections.map((section) => (
        <section
          key={section.title}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{section.description}</p>
          </div>

          <div className="divide-y divide-slate-100">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isPush = item.name === "push_notifications";
              const checked = preferences[item.name];

              return (
                <label
                  key={item.name}
                  className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </span>

                  <span className="relative inline-flex shrink-0 items-center">
                    <input type="hidden" name={item.name} value="false" />
                    {/* <input
                      type="checkbox"
                      name={item.name}
                      value="true"
                      checked={checked}
                      disabled={isPush && pushBusy}
                      onChange={
                        isPush
                          ? (event) =>
                              void handlePushChange(event.target.checked)
                          : undefined
                      }
                      defaultChecked={isPush ? undefined : checked}
                      className="peer sr-only"
                    /> */}

                    <input
                      type="checkbox"
                      name={item.name}
                      value="true"
                      checked={checked}
                      disabled={isPush && pushBusy}
                      onChange={(event) => {
                        const enabled = event.target.checked;

                        if (isPush) {
                          void handlePushChange(enabled);
                          return;
                        }

                        setPreferences((current) => ({
                          ...current,
                          [item.name]: enabled,
                        }));
                      }}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600 peer-disabled:opacity-50" />
                    <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}

      {pushBusy && (
        <p className="text-sm text-slate-500" role="status">
          Updating browser push settings...
        </p>
      )}

      {pushError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {pushError}
        </p>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {state.success}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || pushBusy}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
