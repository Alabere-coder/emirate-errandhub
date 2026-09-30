import { redirect } from "next/navigation";
import { getCurrentUser } from "./get-user";

export async function requireRole(
  allowedRoles: Array<"customer" | "worker" | "admin">,
) {
  const result = await getCurrentUser();

  if (!result) {
    redirect("/login");
  }

  if (!allowedRoles.includes(result.profile.role)) {
    redirect("/dashboard");
  }

  return result;
}
