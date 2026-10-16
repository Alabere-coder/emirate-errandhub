import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersPageClient } from "./users-page-client";

export type AdminUser = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  email: string | null;
};

export default async function AdminUsersPage() {
  await requireRole(["admin"]);

  const adminClient = createAdminClient();

  const authUsers: {
    id: string;
    email: string | null;
    created_at: string;
  }[] = [];

  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("Failed to load Auth users:", error.message);
      throw new Error("Unable to load users. Please try again.");
    }

    authUsers.push(
      ...data.users.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
      })),
    );

    if (data.users.length < perPage) break;

    page += 1;
  }

  const profiles: AdminUser[] = [];

  for (let i = 0; i < authUsers.length; i += 100) {
    const batch = authUsers.slice(i, i + 100);
    const ids = batch.map((user) => user.id);

    if (ids.length === 0) continue;

    const { data, error } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, phone, role, is_active, created_at")
      .in("id", ids);

    if (error) {
      console.error("Failed to load profiles:", error.message);
      throw new Error("Unable to load user profiles. Please try again.");
    }

    const profilesById = new Map(
      (data ?? []).map((profile) => [profile.id, profile]),
    );

    for (const authUser of batch) {
      const profile = profilesById.get(authUser.id);

      if (!profile) continue;

      profiles.push({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        role: profile.role,
        is_active: profile.is_active,
        created_at: profile.created_at,
        email: authUser.email,
      });
    }
  }

  profiles.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return <UsersPageClient users={profiles} />;
}
