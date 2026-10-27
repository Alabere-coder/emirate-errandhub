import { requireRole } from "@/lib/auth/require-role";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAdminForm } from "./create-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminManagementPage() {
  await requireRole(["super_admin"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Management</h1>
        <p className="text-muted-foreground">
          Create and manage administrator accounts for Emirate ErrandHub.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Administrator</CardTitle>
        </CardHeader>

        <CardContent>
          <CreateAdminForm />
        </CardContent>
      </Card>
    </div>
  );
}
