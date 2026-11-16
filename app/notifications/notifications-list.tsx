"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

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

const categories = [
  { key: "payments", label: "Payments" },
  { key: "jobs", label: "Jobs" },
  { key: "requests", label: "Requests & Quotations" },
  { key: "disputes", label: "Disputes" },
  { key: "messages", label: "Messages" },
  { key: "support", label: "Support" },
  { key: "others", label: "Others" },
] as const;

type CategoryKey = (typeof categories)[number]["key"];
type CategoryFilter = "all" | CategoryKey;
type ReadFilter = "all" | "unread";

function getNotificationCategory(type: string): CategoryKey {
  if (type.startsWith("payment_") || type.startsWith("earnings_")) {
    return "payments";
  }

  if (type.startsWith("job_")) {
    return "jobs";
  }

  if (
    type.startsWith("request_") ||
    type.startsWith("service_request_") ||
    type.startsWith("quotation_")
  ) {
    return "requests";
  }

  if (type.startsWith("dispute_")) {
    return "disputes";
  }

  if (type === "new_message" || type.startsWith("message_")) {
    return "messages";
  }

  if (type.startsWith("support_")) {
    return "support";
  }

  return "others";
}

export function NotificationsList({
  initialNotifications,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const [category, setCategory] = useState<CategoryFilter>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const [isPending, startTransition] = useTransition();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, { total: number; unread: number }> = {
      payments: { total: 0, unread: 0 },
      jobs: { total: 0, unread: 0 },
      requests: { total: 0, unread: 0 },
      disputes: { total: 0, unread: 0 },
      messages: { total: 0, unread: 0 },
      support: { total: 0, unread: 0 },
      others: { total: 0, unread: 0 },
    };

    notifications.forEach((notification) => {
      const notificationCategory = getNotificationCategory(notification.type);

      counts[notificationCategory].total += 1;

      if (!notification.is_read) {
        counts[notificationCategory].unread += 1;
      }
    });

    return counts;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesCategory =
        category === "all" ||
        getNotificationCategory(notification.type) === category;

      const matchesReadStatus = readFilter === "all" || !notification.is_read;

      return matchesCategory && matchesReadStatus;
    });
  }, [notifications, category, readFilter]);

  const selectedCategoryLabel =
    category === "all"
      ? "All notifications"
      : (categories.find((item) => item.key === category)?.label ??
        "Notifications");

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
  }

  async function markAsRead(id: string) {
    startTransition(async () => {
      setFeedback(null);

      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id }),
        });

        if (!response.ok) {
          showFeedback("error", "Unable to mark notification as read.");
          return;
        }

        setNotifications((current) =>
          current.map((item) =>
            item.id === id ? { ...item, is_read: true } : item,
          ),
        );
      } catch {
        showFeedback("error", "Something went wrong. Please try again.");
      }
    });
  }

  async function markAllAsRead() {
    startTransition(async () => {
      setFeedback(null);

      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAll: true }),
        });

        if (!response.ok) {
          showFeedback("error", "Unable to mark all notifications as read.");
          return;
        }

        setNotifications((current) =>
          current.map((item) => ({ ...item, is_read: true })),
        );

        showFeedback("success", "All notifications marked as read.");
      } catch {
        showFeedback("error", "Something went wrong. Please try again.");
      }
    });
  }

  async function deleteNotification(id: string) {
    startTransition(async () => {
      setFeedback(null);

      try {
        const response = await fetch("/api/notifications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id }),
        });

        if (!response.ok) {
          showFeedback("error", "Unable to delete notification.");
          return;
        }

        setNotifications((current) => current.filter((item) => item.id !== id));

        showFeedback("success", "Notification deleted.");
      } catch {
        showFeedback("error", "Something went wrong. Please try again.");
      }
    });
  }

  async function clearAllNotifications() {
    startTransition(async () => {
      setFeedback(null);

      try {
        const response = await fetch("/api/notifications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleteAll: true }),
        });

        if (!response.ok) {
          showFeedback("error", "Unable to clear notifications.");
          return;
        }

        setNotifications([]);
        setShowClearConfirm(false);
        setCategory("all");
        setReadFilter("all");

        showFeedback("success", "All notifications have been cleared.");
      } catch {
        showFeedback("error", "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Notification summary and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCheck className="h-4 w-4 text-emerald-600" />
          <span>
            {unreadCount} unread notification
            {unreadCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
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

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={isPending}
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}

          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
            className="ml-auto rounded-md p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Category navigation */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Notification categories
        </h2>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${
              category === "all"
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-slate-50"
            }`}
          >
            <span className="block text-sm font-semibold">All</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              {notifications.length} total
              {unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
            </span>
          </button>

          {categories.map((item) => {
            const counts = categoryCounts[item.key];
            const isSelected = category === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setCategory(item.key)}
                aria-pressed={isSelected}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {item.label}
                </span>

                <span className="mt-0.5 block text-xs text-slate-500">
                  {counts.total} total
                  {counts.unread > 0 ? ` · ${counts.unread} unread` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Read status filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReadFilter("all")}
            aria-pressed={readFilter === "all"}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              readFilter === "all"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setReadFilter("unread")}
            aria-pressed={readFilter === "unread"}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              readFilter === "unread"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Showing {filteredNotifications.length} of {notifications.length}
        </p>
      </div>

      {/* Notification list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Bell className="mb-3 h-8 w-8 text-slate-300" />

            <h2 className="font-semibold text-slate-900">
              {readFilter === "unread"
                ? "You're all caught up"
                : category === "all"
                  ? "No notifications yet"
                  : `No ${selectedCategoryLabel.toLowerCase()} notifications`}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {readFilter === "unread"
                ? "There are no unread notifications in this view."
                : category === "all"
                  ? "Updates about your jobs, payments, messages, and account will appear here."
                  : "Notifications in this category will appear here when available."}
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

                    <time
                      dateTime={notification.created_at}
                      className="shrink-0 text-xs text-slate-400"
                    >
                      {formatNotificationDate(notification.created_at)}
                    </time>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
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

                    <button
                      type="button"
                      onClick={() => void deleteNotification(notification.id)}
                      disabled={isPending}
                      aria-label={`Delete notification: ${notification.title}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear all confirmation */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => {
            if (!isPending) setShowClearConfirm(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-notifications-title"
            aria-describedby="clear-notifications-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <h2
              id="clear-notifications-title"
              className="text-lg font-semibold text-slate-900"
            >
              Clear all notifications?
            </h2>

            <p
              id="clear-notifications-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              This will permanently delete all {notifications.length}{" "}
              notifications in your notification centre. This action cannot be
              undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isPending}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void clearAllNotifications()}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Clear all notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
