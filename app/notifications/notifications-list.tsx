"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationsListProps = {
  initialNotifications: Notification[];
};

export function NotificationsList({
  initialNotifications,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const filteredNotifications = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((item) => !item.is_read)
        : notifications,
    [notifications, filter],
  );

  async function markAsRead(id: string) {
    startTransition(async () => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true } : item,
        ),
      );
    });
  }

  async function markAllAsRead() {
    startTransition(async () => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true })),
      );
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCheck className="h-4 w-4 text-emerald-600" />
          <span>
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </span>
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          disabled={unreadCount === 0 || isPending}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === "all"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === "unread"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Bell className="mb-3 h-8 w-8 text-slate-300" />
            <h2 className="font-semibold text-slate-900">
              {filter === "unread"
                ? "You're all caught up"
                : "No notifications yet"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "unread"
                ? "You have no unread notifications."
                : "Updates about your jobs, payments, and account will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-4 p-5 transition hover:bg-slate-50 ${
                  !notification.is_read ? "bg-emerald-50/40" : ""
                }`}
              >
                <div className="mt-1 h-2.5 w-2.5 shrink-0">
                  {!notification.is_read && (
                    <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="font-semibold text-slate-900">
                      {notification.title}
                    </h3>
                    <time className="shrink-0 text-xs text-slate-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </time>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    {notification.link && (
                      <Link
                        href={notification.link}
                        onClick={() => {
                          if (!notification.is_read) {
                            void markAsRead(notification.id);
                          }
                        }}
                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        View details →
                      </Link>
                    )}

                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => void markAsRead(notification.id)}
                        disabled={isPending}
                        className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
