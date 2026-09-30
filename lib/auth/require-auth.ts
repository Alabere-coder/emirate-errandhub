import { redirect } from "next/navigation";
import { getCurrentUser } from "./get-user";

export async function requireAuth() {
  const result = await getCurrentUser();

  if (!result) {
    redirect("/login");
  }

  return result;
}
