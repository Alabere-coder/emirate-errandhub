import { redirect } from "next/navigation";
import { getCurrentUser } from "./get-user";

export type AppRole = "customer" | "worker" | "admin" | "super_admin";

export async function requireRole(allowedRoles: AppRole[]) {
  const result = await getCurrentUser();

  if (!result) {
    redirect("/login");
  }

  const userRole = result.profile.role as AppRole;

  // Super admins inherit all regular admin permissions.
  const hasRequiredRole =
    allowedRoles.includes(userRole) ||
    (userRole === "super_admin" && allowedRoles.includes("admin"));

  // if (!hasRequiredRole) {
  //   redirect(`/dashboard/${userRole}`);
  // }

  if (!hasRequiredRole) {
    redirect("/access-denied");
  }

  return result;
}
