import type { BillingPlan, PlanId } from "@/types/billing";
import { env } from "@/lib/env";

/**
 * خطط اشتراك SaaS (فوترة النظام — ليست رسوم المتدربين)
 * الأسعار الشهرية/السنوية الرئيسية من STRIPE_PRICE_ID_MONTHLY / YEARLY
 */
export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: { ar: "مجاني", en: "Free" },
    description: {
      ar: "للتجربة والفرق الصغيرة",
      en: "For trials and small teams",
    },
    priceMonthly: 0,
    priceYearly: 0,
    currency: "SAR",
    features: {
      ar: ["مستخدم واحد", "تقارير أساسية", "دعم المجتمع"],
      en: ["1 user", "Basic reports", "Community support"],
    },
  },
  {
    id: "starter",
    name: { ar: "المبتدئ", en: "Starter" },
    description: {
      ar: "للمراكز الناشئة",
      en: "For growing centers",
    },
    priceMonthly: 99,
    priceYearly: 990,
    currency: "SAR",
    features: {
      ar: ["٥ مستخدمين", "متدربون ودورات", "دعم بالبريد"],
      en: ["5 users", "Students & courses", "Email support"],
    },
    stripePriceIds: {
      month:
        env.stripe.prices.starterMonthly ||
        env.stripe.priceMonthly ||
        undefined,
      year:
        env.stripe.prices.starterYearly || env.stripe.priceYearly || undefined,
    },
  },
  {
    id: "pro",
    name: { ar: "احترافي", en: "Pro" },
    description: {
      ar: "للمراكز النامية — الخطة الموصى بها",
      en: "For growing centers — recommended",
    },
    priceMonthly: 299,
    priceYearly: 2990,
    currency: "SAR",
    highlighted: true,
    features: {
      ar: [
        "٢٥ مستخدماً",
        "حضور ومدفوعات متدربين",
        "فوترة Stripe",
        "أدوار RBAC",
      ],
      en: [
        "25 users",
        "Attendance & student payments",
        "Stripe billing",
        "RBAC roles",
      ],
    },
    stripePriceIds: {
      month: env.stripe.priceMonthly || env.stripe.prices.proMonthly || undefined,
      year: env.stripe.priceYearly || env.stripe.prices.proYearly || undefined,
    },
  },
  {
    id: "enterprise",
    name: { ar: "مؤسسي", en: "Enterprise" },
    description: {
      ar: "للاحتياجات المخصصة و SLA",
      en: "Custom needs and SLA",
    },
    priceMonthly: 999,
    priceYearly: 9990,
    currency: "SAR",
    features: {
      ar: ["مستخدمون غير محدودين", "SSO", "مدير نجاح", "عقود مخصصة"],
      en: ["Unlimited users", "SSO", "Success manager", "Custom contracts"],
    },
    stripePriceIds: {
      month: env.stripe.prices.enterpriseMonthly || undefined,
      year: env.stripe.prices.enterpriseYearly || undefined,
    },
  },
];

export function getPlan(planId: PlanId): BillingPlan | undefined {
  return BILLING_PLANS.find((plan) => plan.id === planId);
}

export function resolvePriceId(
  planId: PlanId,
  interval: "month" | "year",
): string | undefined {
  const plan = getPlan(planId);
  if (!plan || planId === "free") return undefined;
  return interval === "year"
    ? plan.stripePriceIds?.year
    : plan.stripePriceIds?.month;
}
