"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Loader2,
  Trash2,
  X,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

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

function getMessagePreview(message: string, maxLength = 55) {
  if (message.length <= maxLength) return message;
  return `${message.slice(0, maxLength).trimEnd()}........`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load notifications.");
      }

      const result = await response.json();

      setNotifications(result.notifications ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch (error) {
      console.error("Notification loading error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          void loadNotifications();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadNotifications, supabase]);

  async function markAsRead(id: string) {
    setUpdatingId(id);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: id }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notification as read.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true } : item,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  }

  async function markAllAsRead() {
    setUpdatingId("all");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notifications as read.");
      }

      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteNotification(notification: Notification) {
    setDeletingId(notification.id);

    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: notification.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to delete notification.");
      }

      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );

      if (!notification.is_read) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      if (selectedNotification?.id === notification.id) {
        setSelectedNotification(null);
      }
    } catch (error) {
      console.error("Notification deletion error:", error);
    } finally {
      setDeletingId(null);
    }
  }

  async function openNotification(notification: Notification) {
    setSelectedNotification(notification);

    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        <Bell className="h-4.5 w-4.5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-4.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Notifications
                </h3>
                <p className="text-xs text-slate-500">{unreadCount} unread</p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={updatingId !== null || deletingId !== null}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                >
                  {updatingId === "all" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-95 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    We'll let you know when something happens.
                  </p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => void openNotification(notification)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void openNotification(notification);
                      }
                    }}
                    className={`w-full cursor-pointer border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      !notification.is_read ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {notification.title}
                          </p>

                          {!notification.is_read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {getMessagePreview(notification.message)}
                        </p>

                        <p className="mt-2 text-[10px] text-slate-400">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void deleteNotification(notification);
                        }}
                        disabled={updatingId !== null || deletingId !== null}
                        aria-label={`Delete ${notification.title}`}
                        title="Delete notification"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === notification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 p-3">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={selectedNotification !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedNotification(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {selectedNotification.title}
                </DialogTitle>

                <DialogDescription className="flex items-center gap-1 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  {formatNotificationDate(selectedNotification.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl bg-slate-50 p-8">
                <p className="whitespace-pre-wrap wrap-break-word text-lg leading-7 text-slate-700">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.link && (
                <Link
                  href={selectedNotification.link}
                  onClick={() => {
                    setSelectedNotification(null);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  View details
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
