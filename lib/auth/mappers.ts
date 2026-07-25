import type { AuthUser } from "@/types/auth";
import type { Profile } from "@/types/database";
import { getInitials } from "@/lib/utils";
import { db } from "@/lib/db";

export function profileToAuthUser(
  profile: Profile,
  organizationName = "بيت المصور",
): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    avatarInitials: getInitials(profile.fullName),
    role: profile.role,
    organizationId: profile.organizationId,
    organizationName,
    locale: profile.locale,
    theme: profile.theme ?? "system",
    createdAt: profile.createdAt,
  };
}

export async function enrichProfile(profile: Profile): Promise<AuthUser> {
  const org = await db.getOrganization(profile.organizationId);
  return profileToAuthUser(profile, org?.name ?? "بيت المصور");
}
