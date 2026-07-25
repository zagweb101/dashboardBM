import type { Metadata } from "next";
import { BillingPageClient } from "@/components/billing/billing-page";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getStripeStatus } from "@/lib/stripe/client";
import { BILLING_PLANS } from "@/lib/stripe/plans";
import { hasPermission } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "الفوترة",
};

type PageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export default async function BillingPage({ searchParams }: PageProps) {
  const user = await requirePermission("billing:view");
  const sp = await searchParams;

  const [subscription, invoices] = await Promise.all([
    db.getSubscription(user.organizationId),
    db.listInvoices(),
  ]);

  const stripe = getStripeStatus();
  const canManage = hasPermission(user.role, "billing:manage");

  const checkoutFlash =
    sp.checkout === "success"
      ? "success"
      : sp.checkout === "cancel"
        ? "cancel"
        : null;

  return (
    <BillingPageClient
      plans={BILLING_PLANS}
      subscription={subscription}
      invoices={invoices}
      currentPlanId={subscription?.planId ?? "free"}
      stripe={stripe}
      canManage={canManage}
      checkoutFlash={checkoutFlash}
    />
  );
}
