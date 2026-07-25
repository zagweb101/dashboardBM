"use server";

/**
 * Server Actions — Stripe Checkout + Customer Portal
 */
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/lib/stripe/client";
import {
  billingMessage,
  type BillingLocale,
} from "@/lib/stripe/messages";
import { resolvePriceId } from "@/lib/stripe/plans";
import {
  isStripeConfigured,
  isStripeLiveReady,
  isStripePlaceholder,
} from "@/lib/env";
import type { PlanId } from "@/types/billing";
import { hasPermission } from "@/lib/rbac/permissions";

export type BillingActionResult = {
  success: boolean;
  error?: string;
  url?: string;
};

function localeOf(user: { locale?: string }): BillingLocale {
  return user.locale === "en" ? "en" : "ar";
}

function mapStripeError(err: unknown, locale: BillingLocale, fallbackKey: "checkoutFailed" | "portalFailed"): string {
  if (err instanceof Error) {
    if (err.message === "STRIPE_NOT_CONFIGURED") {
      return billingMessage("notConfigured", locale);
    }
    if (err.message === "STRIPE_PLACEHOLDER_KEYS") {
      return billingMessage("placeholderKeys", locale);
    }
    // أخطاء Stripe API (مفتاح/سعر غير صالح)
    return `${billingMessage(fallbackKey, locale)}: ${err.message}`;
  }
  return billingMessage(fallbackKey, locale);
}

/**
 * بدء اشتراك عبر Stripe Checkout
 */
export async function startCheckoutAction(input: {
  planId: PlanId;
  interval: "month" | "year";
}): Promise<BillingActionResult> {
  const user = await requireUser();
  const locale = localeOf(user);

  // الترقية تتطلب billing:manage (owner / admin / manager)
  if (!hasPermission(user.role, "billing:manage")) {
    return { success: false, error: billingMessage("noPermission", locale) };
  }

  if (input.planId === "free") {
    return { success: false, error: billingMessage("freeNoCheckout", locale) };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: billingMessage("notConfigured", locale) };
  }
  if (isStripePlaceholder() || !isStripeLiveReady()) {
    return { success: false, error: billingMessage("placeholderKeys", locale) };
  }

  const priceId = resolvePriceId(input.planId, input.interval);
  if (!priceId) {
    return { success: false, error: billingMessage("missingPrice", locale) };
  }

  try {
    const subscription = await db.getSubscription(user.organizationId);
    const session = await createCheckoutSession({
      priceId,
      customerEmail: user.email,
      customerId: subscription?.stripeCustomerId,
      organizationId: user.organizationId,
      userId: user.id,
      planId: input.planId,
      interval: input.interval,
    });

    if (!session.url) {
      return { success: false, error: billingMessage("noUrl", locale) };
    }

    // إعادة توجيه لصفحة Stripe Checkout
    redirect(session.url);
  } catch (err) {
    // redirect() يرمي استثناء خاص
    if (err && typeof err === "object" && "digest" in err) throw err;
    return {
      success: false,
      error: mapStripeError(err, locale, "checkoutFailed"),
    };
  }
}

/**
 * فتح Stripe Customer Portal
 */
export async function openPortalAction(): Promise<BillingActionResult> {
  const user = await requireUser();
  const locale = localeOf(user);

  if (!hasPermission(user.role, "billing:manage")) {
    return { success: false, error: billingMessage("noPermission", locale) };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: billingMessage("notConfigured", locale) };
  }
  if (isStripePlaceholder() || !isStripeLiveReady()) {
    return { success: false, error: billingMessage("placeholderKeys", locale) };
  }

  const subscription = await db.getSubscription(user.organizationId);
  const customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    return { success: false, error: billingMessage("noCustomer", locale) };
  }

  try {
    const session = await createBillingPortalSession(customerId);
    if (!session.url) {
      return { success: false, error: billingMessage("noUrl", locale) };
    }
    redirect(session.url);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    return {
      success: false,
      error: mapStripeError(err, locale, "portalFailed"),
    };
  }
}
