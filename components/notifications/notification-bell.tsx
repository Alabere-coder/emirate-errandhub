"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Bell,
  CheckCheck,
  Loader2,
  Trash2,
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

  return `${message.slice(0, maxLength).trimEnd()}...`;
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
        className="relative flex size-10 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground transition-colors hover:border-emerald-500/40 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Bell className="size-4.5" />

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

          <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-4.5rem))] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Notifications
                </h3>

                <p className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={updatingId !== null || deletingId !== null}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {updatingId === "all" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCheck className="size-4" />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-95 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto size-8 text-muted-foreground/40" />

                  <p className="mt-3 text-sm font-semibold text-foreground">
                    No notifications yet
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    We'll let you know when something happens.
                  </p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-border px-4 py-3 transition-colors hover:bg-muted ${
                      !notification.is_read ? "bg-emerald-500/5" : "bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => void openNotification(notification)}
                        disabled={updatingId === notification.id}
                        className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {notification.title}
                          </p>

                          {!notification.is_read && (
                            <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {getMessagePreview(notification.message)}
                        </p>

                        <p className="mt-2 text-[10px] text-muted-foreground/70">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteNotification(notification)}
                        disabled={updatingId !== null || deletingId !== null}
                        aria-label={`Delete ${notification.title}`}
                        title="Delete notification"
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/70 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-rose-400"
                      >
                        {deletingId === notification.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-3">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg bg-muted px-3 py-2 text-center text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
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
        <DialogContent className="max-w-md rounded-2xl border-border bg-card text-card-foreground">
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">
                  {selectedNotification.title}
                </DialogTitle>

                <DialogDescription className="flex items-center gap-1 text-xs">
                  <Clock className="size-3.5" />
                  {formatNotificationDate(selectedNotification.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-border bg-muted p-5 sm:p-8">
                <p className="wrap-break-word whitespace-pre-wrap text-base leading-7 text-foreground">
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  View details
                  <ExternalLink className="size-4" />
                </Link>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
