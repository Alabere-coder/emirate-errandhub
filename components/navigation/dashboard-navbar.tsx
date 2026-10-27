"use client";

import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

type UserRole = "customer" | "worker" | "admin" | "super_admin";

type DashboardNavbarProps = {
  role: UserRole;
  currentPage: string;
  onMenuClick: () => void;
  children: React.ReactNode;
};

function getRoleLabel(role: UserRole) {
  switch (role) {
    case "customer":
      return "Customer";
    case "worker":
      return "Service Provider";
    case "admin":
      return "Administrator";
    case "super_admin":
      return "Super Administrator";
  }
}

export function DashboardNavbar({
  role,
  currentPage,
  onMenuClick,
  children,
}: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:block">
            {getRoleLabel(role)} workspace
          </p>
          <h1 className="truncate text-sm font-bold text-slate-900 sm:mt-0.5 sm:text-base">
            {currentPage}
          </h1>
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3">
        {/* <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <Bell className="h-4.5 w-4.5" />
        </Link> */}

        <NotificationBell />

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {children}
      </div>
    </header>
  );
}

// "use client";

// import Link from "next/link";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Bell,
//   ChevronDown,
//   LayoutDashboard,
//   LogOut,
//   Menu,
//   Settings,
//   UserRound,
//   X,
//   Zap,
// } from "lucide-react";

// type DashboardNavbarProps = {
//   role: "customer" | "worker" | "admin";
//   firstName?: string;
//   lastName?: string;
//   onMenuClick?: () => void;
// };

// const roleLabels = {
//   customer: "Customer account",
//   worker: "Service provider",
//   admin: "Administrator",
// };

// const dashboardPaths = {
//   customer: "/dashboard/customer",
//   worker: "/dashboard/worker",
//   admin: "/dashboard/admin",
// };

// export function DashboardNavbar({
//   role,
//   firstName,
//   lastName,
//   onMenuClick,
// }: DashboardNavbarProps) {
//   const router = useRouter();
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [loggingOut, setLoggingOut] = useState(false);

//   const fullName =
//     [firstName, lastName].filter(Boolean).join(" ") || "My account";

//   const initials =
//     [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
//     "U";

//   async function handleLogout() {
//     if (loggingOut) return;

//     setLoggingOut(true);

//     try {
//       const response = await fetch("/api/auth/logout", {
//         method: "POST",
//       });

//       if (!response.ok) {
//         throw new Error("Logout failed");
//       }

//       router.replace("/login");
//       router.refresh();
//     } catch (error) {
//       console.error("Logout error:", error);
//       setLoggingOut(false);
//     }
//   }

//   return (
//     <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
//       <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
//         {/* Left section */}
//         <div className="flex min-w-0 items-center gap-3">
//           {onMenuClick && (
//             <button
//               type="button"
//               onClick={onMenuClick}
//               aria-label="Toggle navigation menu"
//               className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
//             >
//               <Menu size={20} />
//             </button>
//           )}

//           <Link
//             href={dashboardPaths[role]}
//             className="flex min-w-0 items-center gap-2.5"
//           >
//             <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
//               <Zap size={21} fill="currentColor" />
//             </span>

//             <span className="min-w-0">
//               <span className="block truncate text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
//                 Emirate <span className="text-emerald-600">ErrandHub</span>
//               </span>
//               <span className="hidden text-xs text-slate-500 sm:block">
//                 {roleLabels[role]}
//               </span>
//             </span>
//           </Link>
//         </div>

//         {/* Right section */}
//         <div className="flex shrink-0 items-center gap-2 sm:gap-3">
//           <Link
//             href={dashboardPaths[role]}
//             aria-label="Dashboard home"
//             title="Dashboard"
//             className="hidden size-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700 sm:flex"
//           >
//             <LayoutDashboard size={19} />
//           </Link>

//           <Link
//             href={`${dashboardPaths[role]}/notifications`}
//             aria-label="Notifications"
//             title="Notifications"
//             className="relative flex size-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700"
//           >
//             <Bell size={19} />
//           </Link>

//           <div className="relative">
//             <button
//               type="button"
//               onClick={() => setProfileOpen((open) => !open)}
//               aria-expanded={profileOpen}
//               aria-haspopup="menu"
//               className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-100 sm:gap-3 sm:pl-2"
//             >
//               <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
//                 {initials}
//               </span>

//               <span className="hidden max-w-36 text-left sm:block">
//                 <span className="block truncate text-sm font-semibold text-slate-800">
//                   {fullName}
//                 </span>
//                 <span className="block text-xs capitalize text-slate-500">
//                   {role}
//                 </span>
//               </span>

//               <ChevronDown
//                 size={16}
//                 className="hidden text-slate-400 sm:block"
//               />
//             </button>

//             {profileOpen && (
//               <>
//                 <button
//                   type="button"
//                   aria-label="Close profile menu"
//                   className="fixed inset-0 z-40 cursor-default"
//                   onClick={() => setProfileOpen(false)}
//                 />

//                 <div
//                   role="menu"
//                   className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
//                 >
//                   <div className="border-b border-slate-100 px-3 py-3">
//                     <p className="truncate text-sm font-semibold text-slate-900">
//                       {fullName}
//                     </p>
//                     <p className="mt-1 text-xs capitalize text-slate-500">
//                       {roleLabels[role]}
//                     </p>
//                   </div>

//                   <Link
//                     href={`${dashboardPaths[role]}/profile`}
//                     role="menuitem"
//                     onClick={() => setProfileOpen(false)}
//                     className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
//                   >
//                     <UserRound size={17} />
//                     My profile
//                   </Link>

//                   <Link
//                     href={`${dashboardPaths[role]}/settings`}
//                     role="menuitem"
//                     onClick={() => setProfileOpen(false)}
//                     className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
//                   >
//                     <Settings size={17} />
//                     Settings
//                   </Link>

//                   <div className="my-1 border-t border-slate-100" />

//                   <button
//                     type="button"
//                     role="menuitem"
//                     onClick={handleLogout}
//                     disabled={loggingOut}
//                     className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
//                   >
//                     <LogOut size={17} />
//                     {loggingOut ? "Logging out..." : "Log out"}
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }
