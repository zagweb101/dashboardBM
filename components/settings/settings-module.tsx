"use client";

/**
 * إعدادات بيت المصور — تبويبات: الملف | الفريق | الأمان
 */
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Shield,
  Trash2,
  UserCircle2,
  UserPlus,
  Users,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";
import type { AuthSessionRow, Profile } from "@/types/database";
import type { Role } from "@/types/rbac";
import { ROLES } from "@/types/rbac";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { useToast } from "@/components/ui/toast";
import { getRoleLabel, ROLE_DEFINITIONS } from "@/lib/rbac/roles";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  changePasswordAction,
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
  updateProfileAction,
  type SettingsActionState,
} from "@/app/(app)/settings/actions";

type Tab = "profile" | "team" | "security";

type Props = {
  user: AuthUser;
  members: Profile[];
  sessions: AuthSessionRow[];
  canManageTeam: boolean;
};

const initial: SettingsActionState = { success: false };

export function SettingsModule({
  user,
  members: initialMembers,
  sessions,
  canManageTeam,
}: Props) {
  const { locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const ar = locale === "ar";

  const [tab, setTab] = useState<Tab>("profile");
  const [members, setMembers] = useState(initialMembers);

  // مزامنة أعضاء من السيرفر عند revalidate
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const tabs: { id: Tab; label: string; icon: typeof UserCircle2 }[] = [
    {
      id: "profile",
      label: ar ? "الملف الشخصي" : "Profile",
      icon: UserCircle2,
    },
    { id: "team", label: ar ? "الفريق" : "Team", icon: Users },
    { id: "security", label: ar ? "الأمان" : "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{ar ? "الإعدادات" : "Settings"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "إدارة حسابك، أعضاء الفريق، والأمان."
            : "Manage your account, team members, and security."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" ? (
        <ProfileTab user={user} ar={ar} setLocale={setLocale} setTheme={setTheme} theme={theme} toast={toast} />
      ) : null}
      {tab === "team" ? (
        <TeamTab
          user={user}
          members={members}
          setMembers={setMembers}
          canManage={canManageTeam}
          ar={ar}
          locale={locale}
          toast={toast}
        />
      ) : null}
      {tab === "security" ? (
        <SecurityTab ar={ar} sessions={sessions} toast={toast} />
      ) : null}

      {/* مصفوفة الأدوار — مرجع */}
      {tab === "team" ? (
        <Card>
          <CardHeader
            title={ar ? "مرجع الأدوار" : "Roles reference"}
            description={
              ar
                ? "صلاحيات كل دور في النظام"
                : "Permissions available for each role"
            }
          />
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Object.values(ROLE_DEFINITIONS).map((role) => (
              <div
                key={role.id}
                className="rounded-2xl border border-border bg-muted/30 p-4"
              >
                <p className="font-bold">{role.label[locale]}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {role.description[locale]}
                </p>
                <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                  {role.permissions.length}{" "}
                  {ar ? "صلاحية" : "permissions"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ── Profile ────────────────────────────────────────────────────────────

function ProfileTab({
  user,
  ar,
  setLocale,
  setTheme,
  theme,
  toast,
}: {
  user: AuthUser;
  ar: boolean;
  setLocale: (l: "ar" | "en") => void;
  setTheme: (t: "light" | "dark" | "system") => void;
  theme: "light" | "dark" | "system";
  toast: (i: { title: string; description?: string; tone?: "success" | "error" | "info" }) => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initial,
  );
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl ?? "");

  useEffect(() => {
    if (state.success) {
      toast({
        title: state.message ?? (ar ? "تم الحفظ" : "Saved"),
        tone: "success",
      });
      // طبّق اللغة/المظهر محلياً فوراً
      const formLocale = document.querySelector<HTMLSelectElement>(
        'select[name="locale"]',
      )?.value;
      const formTheme = document.querySelector<HTMLSelectElement>(
        'select[name="theme"]',
      )?.value;
      if (formLocale === "ar" || formLocale === "en") setLocale(formLocale);
      if (
        formTheme === "light" ||
        formTheme === "dark" ||
        formTheme === "system"
      ) {
        setTheme(formTheme);
      }
    } else if (state.error) {
      toast({
        title: ar ? "خطأ" : "Error",
        description: state.error,
        tone: "error",
      });
    }
  }, [state, ar, toast, setLocale, setTheme]);

  return (
    <Card>
      <CardHeader
        title={ar ? "الملف الشخصي" : "Profile"}
        description={
          ar
            ? "بيانات تظهر في الشريط الجانبي والجلسات"
            : "Shown in the sidebar and session"
        }
      />
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-extrabold text-primary">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(user.fullName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Input
                name="avatarUrl"
                label={ar ? "رابط الصورة (URL أو data:)" : "Avatar URL / data URI"}
                defaultValue={user.avatarUrl ?? ""}
                placeholder="https://... or data:image/..."
                onChange={(e) => setAvatarPreview(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {ar
                  ? "لاحقاً يمكن ربط رفع ملفات (S3/Uploadthing)."
                  : "File upload (S3/Uploadthing) can be wired later."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              name="fullName"
              label={ar ? "الاسم الكامل" : "Full name"}
              defaultValue={user.fullName}
              required
              error={state.fieldErrors?.fullName}
            />
            <Input
              name="email"
              type="email"
              label={ar ? "البريد" : "Email"}
              defaultValue={user.email}
              error={state.fieldErrors?.email}
            />
            <Input
              name="phone"
              label={ar ? "الجوال" : "Phone"}
              defaultValue={user.phone ?? ""}
              placeholder="05xxxxxxxx"
            />
            <Input
              name="organization"
              label={ar ? "المؤسسة" : "Organization"}
              defaultValue={user.organizationName}
              disabled
            />
            <Input
              name="roleDisplay"
              label={ar ? "الدور" : "Role"}
              defaultValue={getRoleLabel(user.role, ar ? "ar" : "en")}
              disabled
            />
            <Select
              name="locale"
              label={ar ? "اللغة المفضلة" : "Preferred language"}
              defaultValue={user.locale}
              options={[
                { value: "ar", label: "العربية" },
                { value: "en", label: "English" },
              ]}
            />
            <Select
              name="theme"
              label={ar ? "المظهر" : "Theme"}
              defaultValue={user.theme ?? theme}
              options={[
                { value: "light", label: ar ? "فاتح" : "Light" },
                { value: "dark", label: ar ? "داكن" : "Dark" },
                { value: "system", label: ar ? "تلقائي" : "System" },
              ]}
            />
          </div>

          {state.error && !state.success ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending
              ? ar
                ? "جارٍ الحفظ..."
                : "Saving..."
              : ar
                ? "حفظ التغييرات"
                : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Team ───────────────────────────────────────────────────────────────

function TeamTab({
  user,
  members,
  setMembers,
  canManage,
  ar,
  locale,
  toast,
}: {
  user: AuthUser;
  members: Profile[];
  setMembers: React.Dispatch<React.SetStateAction<Profile[]>>;
  canManage: boolean;
  ar: boolean;
  locale: "ar" | "en";
  toast: (i: { title: string; description?: string; tone?: "success" | "error" | "info" }) => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    inviteMemberAction,
    initial,
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast({
        title: state.message ?? (ar ? "تمت الإضافة" : "Member added"),
        tone: "success",
      });
      router.refresh();
    } else if (state.error) {
      toast({
        title: ar ? "خطأ" : "Error",
        description: state.error,
        tone: "error",
      });
    }
  }, [state, ar, toast, router]);

  const assignableRoles = useMemo(
    () => ROLES.filter((r) => r !== "owner"),
    [],
  );

  const onRoleChange = (memberId: string, role: string) => {
    startTransition(async () => {
      const res = await updateMemberRoleAction(memberId, role);
      if (res.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId ? { ...m, role: role as Role } : m,
          ),
        );
        toast({
          title: res.message ?? (ar ? "تم التحديث" : "Updated"),
          tone: "success",
        });
      } else {
        toast({
          title: ar ? "خطأ" : "Error",
          description: res.error,
          tone: "error",
        });
      }
    });
  };

  const onRemove = (member: Profile) => {
    if (
      !window.confirm(
        ar
          ? `إزالة ${member.fullName} من الفريق؟`
          : `Remove ${member.fullName} from the team?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await removeMemberAction(member.id);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        toast({
          title: res.message ?? (ar ? "تمت الإزالة" : "Removed"),
          tone: "success",
        });
      } else {
        toast({
          title: ar ? "خطأ" : "Error",
          description: res.error,
          tone: "error",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={ar ? "أعضاء الفريق" : "Team members"}
          description={`${members.length} ${ar ? "عضو" : "members"}`}
        />
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "العضو" : "Member"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "الدور" : "Role"}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {ar ? "البريد" : "Email"}
                </th>
                {canManage ? (
                  <th className="px-4 py-3 text-start font-semibold" />
                ) : null}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isSelf = m.id === user.id;
                const isSoleOwner =
                  m.role === "owner" &&
                  members.filter((x) => x.role === "owner").length === 1;
                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(m.fullName)}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {m.fullName}
                            {isSelf ? (
                              <span className="ms-1 text-xs text-muted-foreground">
                                ({ar ? "أنت" : "you"})
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {canManage && !isSoleOwner ? (
                        <select
                          className="h-9 rounded-lg border border-border bg-background px-2 text-xs font-semibold"
                          value={m.role}
                          onChange={(e) => onRoleChange(m.id, e.target.value)}
                          disabled={isSelf && m.role === "owner"}
                        >
                          {ROLES.map((r) => (
                            <option
                              key={r}
                              value={r}
                              disabled={
                                r === "owner" && user.role !== "owner"
                              }
                            >
                              {getRoleLabel(r, locale)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge>{getRoleLabel(m.role, locale)}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                      {m.email}
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        {!isSelf && !isSoleOwner ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-rose-600"
                            onClick={() => onRemove(m)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader
            title={ar ? "إضافة عضو" : "Invite member"}
            description={
              ar
                ? "يُنشأ حساب بكلمة مرور مؤقتة: password123"
                : "Creates an account with temporary password: password123"
            }
          />
          <CardContent>
            <form action={formAction} className="grid gap-4 md:grid-cols-3">
              <Input
                name="fullName"
                label={ar ? "الاسم" : "Name"}
                required
                placeholder={ar ? "الاسم الكامل" : "Full name"}
              />
              <Input
                name="email"
                type="email"
                label={ar ? "البريد" : "Email"}
                required
                placeholder="name@example.com"
              />
              <Select
                name="role"
                label={ar ? "الدور" : "Role"}
                defaultValue="employee"
                options={assignableRoles.map((r) => ({
                  value: r,
                  label: getRoleLabel(r, locale),
                }))}
              />
              <div className="md:col-span-3">
                {state.error ? (
                  <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {state.error}
                  </p>
                ) : null}
                {state.success && state.message ? (
                  <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {state.message}
                  </p>
                ) : null}
                <Button type="submit" disabled={pending}>
                  <UserPlus className="h-4 w-4" />
                  {pending
                    ? ar
                      ? "جارٍ الإضافة..."
                      : "Adding..."
                    : ar
                      ? "إضافة العضو"
                      : "Add member"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          {ar
            ? "ليس لديك صلاحية إدارة الفريق (users:manage)."
            : "You lack team management permission (users:manage)."}
        </p>
      )}
    </div>
  );
}

// ── Security ───────────────────────────────────────────────────────────

function SecurityTab({
  ar,
  sessions,
  toast,
}: {
  ar: boolean;
  sessions: AuthSessionRow[];
  toast: (i: { title: string; description?: string; tone?: "success" | "error" | "info" }) => void;
}) {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initial,
  );

  useEffect(() => {
    if (state.success) {
      toast({
        title: state.message ?? (ar ? "تم التحديث" : "Updated"),
        tone: "success",
      });
    } else if (state.error) {
      toast({
        title: ar ? "خطأ" : "Error",
        description: state.error,
        tone: "error",
      });
    }
  }, [state, ar, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={ar ? "تغيير كلمة المرور" : "Change password"}
          description={
            ar
              ? "أدخل كلمة المرور الحالية ثم الجديدة"
              : "Enter your current password, then the new one"
          }
        />
        <CardContent>
          <form action={formAction} className="grid max-w-lg gap-4">
            <Input
              name="currentPassword"
              type="password"
              label={ar ? "كلمة المرور الحالية" : "Current password"}
              required
              autoComplete="current-password"
            />
            <Input
              name="newPassword"
              type="password"
              label={ar ? "كلمة المرور الجديدة" : "New password"}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Input
              name="confirmPassword"
              type="password"
              label={ar ? "تأكيد كلمة المرور" : "Confirm password"}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {state.error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {state.message}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              <KeyRound className="h-4 w-4" />
              {pending
                ? ar
                  ? "جارٍ التحديث..."
                  : "Updating..."
                : ar
                  ? "تحديث كلمة المرور"
                  : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={ar ? "الجلسات" : "Sessions"}
          description={
            ar
              ? "جلسات Auth.js المخزّنة (إن وُجدت في Postgres)"
              : "Stored Auth.js sessions (when using Postgres)"
          }
        />
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {ar
                ? "لا جلسات مسجّلة في جدول sessions (وضع JWT لا يخزّن صفوفاً دائماً)."
                : "No rows in sessions table (JWT mode may not persist sessions)."}
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                  {s.sessionToken.slice(0, 16)}…
                </span>
                <span className="text-muted-foreground">
                  {ar ? "ينتهي" : "expires"}{" "}
                  {formatDate(s.expires, ar ? "ar" : "en", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
