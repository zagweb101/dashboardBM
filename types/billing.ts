export type PlanInterval = "month" | "year";

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export type BillingPlan = {
  id: PlanId;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: { ar: string[]; en: string[] };
  highlighted?: boolean;
  stripePriceIds?: {
    month?: string;
    year?: string;
  };
};

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export type OrganizationSubscription = {
  id: string;
  organizationId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  interval: PlanInterval;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: "paid" | "open" | "void" | "uncollectible";
  createdAt: string;
  pdfUrl?: string;
};
