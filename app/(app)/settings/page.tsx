import type { Metadata } from "next";
import { SettingsModule } from "@/components/settings/settings-module";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "الإعدادات",
};

export default async function SettingsPage() {
  const user = await requirePermission("settings:view");

  const [members, sessions] = await Promise.all([
    db.listProfiles(user.organizationId),
    db.listUserSessions(user.id).catch(() => []),
  ]);

  return (
    <SettingsModule
      user={user}
      members={members}
      sessions={sessions}
      canManageTeam={hasPermission(user.role, "users:manage")}
    />
  );
}
