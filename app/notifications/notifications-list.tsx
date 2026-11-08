"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Bell,
  CheckCheck,
  Loader2,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
        setFilter("all");

        showFeedback("success", "All notifications have been cleared.");
      } catch {
        showFeedback("error", "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-5">
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

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
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

// "use client";

// import Link from "next/link";
// import { useMemo, useState, useTransition } from "react";
// import { Bell, CheckCheck, Loader2 } from "lucide-react";

// export type Notification = {
//   id: string;
//   type: string;
//   title: string;
//   message: string;
//   link: string | null;
//   is_read: boolean;
//   created_at: string;
// };

// type NotificationsListProps = {
//   initialNotifications: Notification[];
// };

// export function NotificationsList({
//   initialNotifications,
// }: NotificationsListProps) {
//   const [notifications, setNotifications] = useState(initialNotifications);
//   const [filter, setFilter] = useState<"all" | "unread">("all");
//   const [isPending, startTransition] = useTransition();

//   const unreadCount = useMemo(
//     () => notifications.filter((item) => !item.is_read).length,
//     [notifications],
//   );

//   const filteredNotifications = useMemo(
//     () =>
//       filter === "unread"
//         ? notifications.filter((item) => !item.is_read)
//         : notifications,
//     [notifications, filter],
//   );

//   async function markAsRead(id: string) {
//     startTransition(async () => {
//       const response = await fetch("/api/notifications", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ notificationId: id }),
//       });

//       if (!response.ok) return;

//       setNotifications((current) =>
//         current.map((item) =>
//           item.id === id ? { ...item, is_read: true } : item,
//         ),
//       );
//     });
//   }

//   async function markAllAsRead() {
//     startTransition(async () => {
//       const response = await fetch("/api/notifications", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ markAll: true }),
//       });

//       if (!response.ok) return;

//       setNotifications((current) =>
//         current.map((item) => ({ ...item, is_read: true })),
//       );
//     });
//   }

//   return (
//     <div className="space-y-5">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div className="flex items-center gap-2 text-sm text-slate-600">
//           <CheckCheck className="h-4 w-4 text-emerald-600" />
//           <span>
//             {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
//           </span>
//         </div>

//         <button
//           type="button"
//           onClick={markAllAsRead}
//           disabled={unreadCount === 0 || isPending}
//           className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
//         >
//           {isPending ? (
//             <Loader2 className="h-4 w-4 animate-spin" />
//           ) : (
//             <CheckCheck className="h-4 w-4" />
//           )}
//           Mark all as read
//         </button>
//       </div>

//       <div className="flex gap-2">
//         <button
//           type="button"
//           onClick={() => setFilter("all")}
//           className={`rounded-full px-4 py-2 text-sm font-medium transition ${
//             filter === "all"
//               ? "bg-emerald-600 text-white"
//               : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//           }`}
//         >
//           All ({notifications.length})
//         </button>

//         <button
//           type="button"
//           onClick={() => setFilter("unread")}
//           className={`rounded-full px-4 py-2 text-sm font-medium transition ${
//             filter === "unread"
//               ? "bg-emerald-600 text-white"
//               : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//           }`}
//         >
//           Unread ({unreadCount})
//         </button>
//       </div>

//       <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//         {filteredNotifications.length === 0 ? (
//           <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
//             <Bell className="mb-3 h-8 w-8 text-slate-300" />
//             <h2 className="font-semibold text-slate-900">
//               {filter === "unread"
//                 ? "You're all caught up"
//                 : "No notifications yet"}
//             </h2>
//             <p className="mt-1 text-sm text-slate-500">
//               {filter === "unread"
//                 ? "You have no unread notifications."
//                 : "Updates about your jobs, payments, and account will appear here."}
//             </p>
//           </div>
//         ) : (
//           <div className="divide-y divide-slate-100">
//             {filteredNotifications.map((notification) => (
//               <div
//                 key={notification.id}
//                 className={`flex gap-4 p-5 transition hover:bg-slate-50 ${
//                   !notification.is_read ? "bg-emerald-50/40" : ""
//                 }`}
//               >
//                 <div className="mt-1 h-2.5 w-2.5 shrink-0">
//                   {!notification.is_read && (
//                     <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500" />
//                   )}
//                 </div>

//                 <div className="min-w-0 flex-1">
//                   <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
//                     <h3 className="font-semibold text-slate-900">
//                       {notification.title}
//                     </h3>
//                     <time className="shrink-0 text-xs text-slate-400">
//                       {new Date(notification.created_at).toLocaleString()}
//                     </time>
//                   </div>

//                   <p className="mt-1 text-sm leading-6 text-slate-600">
//                     {notification.message}
//                   </p>

//                   <div className="mt-3 flex flex-wrap items-center gap-4">
//                     {notification.link && (
//                       <Link
//                         href={notification.link}
//                         onClick={() => {
//                           if (!notification.is_read) {
//                             void markAsRead(notification.id);
//                           }
//                         }}
//                         className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
//                       >
//                         View details →
//                       </Link>
//                     )}

//                     {!notification.is_read && (
//                       <button
//                         type="button"
//                         onClick={() => void markAsRead(notification.id)}
//                         disabled={isPending}
//                         className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
//                       >
//                         Mark as read
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
