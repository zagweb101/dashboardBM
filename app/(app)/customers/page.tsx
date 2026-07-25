import type { Metadata } from "next";
import { CustomersModule } from "@/components/customers/customers-module";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "العملاء",
};

export default async function CustomersPage() {
  const user = await requirePermission("customers:view");

  const [customers, stats] = await Promise.all([
    db.getCustomers(user.organizationId),
    db.getCustomerStats(user.organizationId),
  ]);

  return (
    <CustomersModule
      initialCustomers={customers}
      stats={stats}
      canCreate={hasPermission(user.role, "customers:create")}
      canEdit={hasPermission(user.role, "customers:edit")}
      canDelete={hasPermission(user.role, "customers:delete")}
    />
  );
}
