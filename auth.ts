/**
 * Auth.js (NextAuth v5) — بيت المصور
 *
 * - Credentials (email + password) + bcrypt
 * - @auth/pg-adapter عند DATABASE_URL
 * - JWT sessions (مطلوب مع Credentials)
 * - بدون DATABASE_URL: mock profiles للتطوير
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import { authConfig } from "@/auth.config";
import { getPool, isDatabaseConfigured, queryOne } from "@/lib/db/postgres";
import { verifyPassword } from "@/lib/auth/password";
import {
  MOCK_PASSWORD,
  mockOrganizations,
  mockPasswordStore,
  mockProfiles,
} from "@/lib/db/mock-data";
import type { Role } from "@/types/rbac";

export type AuthUserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  locale: "ar" | "en";
  image?: string | null;
};

async function authorizeFromPostgres(
  email: string,
  password: string,
): Promise<AuthUserRow | null> {
  const row = await queryOne<{
    id: string;
    email: string;
    name: string | null;
    password_hash: string | null;
    role: string;
    organization_id: string | null;
    locale: string;
    image: string | null;
  }>(
    `
    SELECT id, email, name, password_hash, role, organization_id, locale, image
    FROM users
    WHERE lower(email) = lower($1)
    LIMIT 1
    `,
    [email],
  );

  if (!row?.password_hash) return null;
  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return null;

  let organizationName = "بيت المصور";
  if (row.organization_id) {
    const org = await queryOne<{ name: string }>(
      `SELECT name FROM organizations WHERE id = $1`,
      [row.organization_id],
    );
    if (org?.name) organizationName = org.name;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name ?? row.email,
    role: row.role as Role,
    organizationId: row.organization_id ?? "",
    organizationName,
    locale: row.locale === "en" ? "en" : "ar",
    image: row.image,
  };
}

async function authorizeFromMock(
  email: string,
  password: string,
): Promise<AuthUserRow | null> {
  const profile = mockProfiles.find(
    (p) => p.email.toLowerCase() === email.toLowerCase(),
  );
  if (!profile) return null;
  const stored = mockPasswordStore[profile.id] ?? MOCK_PASSWORD;
  if (password !== stored) return null;
  const org = mockOrganizations.find((o) => o.id === profile.organizationId);
  return {
    id: profile.id,
    email: profile.email,
    name: profile.fullName,
    role: profile.role,
    organizationId: profile.organizationId,
    organizationName: org?.name ?? "بيت المصور",
    locale: profile.locale,
    image: profile.avatarUrl ?? null,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        try {
          const user = isDatabaseConfigured()
            ? await authorizeFromPostgres(email, password)
            : await authorizeFromMock(email, password);

          if (!user) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image ?? undefined,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organizationName,
            locale: user.locale,
            fullName: user.name,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  ...(isDatabaseConfigured()
    ? { adapter: PostgresAdapter(getPool()) }
    : {}),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.locale = user.locale;
        token.fullName = user.fullName ?? user.name ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = (token.role as Role) ?? "viewer";
        session.user.organizationId = (token.organizationId as string) ?? "";
        session.user.organizationName =
          (token.organizationName as string) ?? "بيت المصور";
        session.user.locale = token.locale === "en" ? "en" : "ar";
        session.user.fullName =
          (token.fullName as string) ?? session.user.name ?? "";
        if (token.fullName) {
          session.user.name = token.fullName as string;
        }
      }
      return session;
    },
  },
});
