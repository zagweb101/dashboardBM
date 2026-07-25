/**
 * عميل Stripe + إنشاء Checkout / Customer Portal
 */
import Stripe from "stripe";
import {
  env,
  isStripeConfigured,
  isStripeLiveReady,
  isStripePlaceholder,
} from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (isStripePlaceholder()) {
    throw new Error("STRIPE_PLACEHOLDER_KEYS");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripe.secretKey, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

/** حالة Stripe للواجهة */
export type StripeStatus = {
  configured: boolean;
  placeholder: boolean;
  liveReady: boolean;
  publishableKey: string;
  hasWebhookSecret: boolean;
  priceMonthly: string;
  priceYearly: string;
};

export function getStripeStatus(): StripeStatus {
  return {
    configured: isStripeConfigured(),
    placeholder: isStripePlaceholder(),
    liveReady: isStripeLiveReady(),
    publishableKey: env.stripe.publishableKey,
    hasWebhookSecret: Boolean(env.stripe.webhookSecret),
    priceMonthly: env.stripe.priceMonthly,
    priceYearly: env.stripe.priceYearly,
  };
}

export type CheckoutSessionInput = {
  priceId: string;
  customerEmail?: string;
  customerId?: string | null;
  organizationId: string;
  userId?: string;
  planId?: string;
  interval?: "month" | "year";
  successUrl?: string;
  cancelUrl?: string;
};

/**
 * إنشاء جلسة Stripe Checkout (اشتراك)
 */
export async function createCheckoutSession(input: CheckoutSessionInput) {
  const stripe = getStripe();

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url:
      input.successUrl ??
      `${env.appUrl}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: input.cancelUrl ?? `${env.appUrl}/billing?checkout=cancel`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    metadata: {
      organizationId: input.organizationId,
      userId: input.userId ?? "",
      planId: input.planId ?? "",
      interval: input.interval ?? "",
    },
    subscription_data: {
      metadata: {
        organizationId: input.organizationId,
        planId: input.planId ?? "",
      },
    },
  };

  if (input.customerId) {
    params.customer = input.customerId;
  } else if (input.customerEmail) {
    params.customer_email = input.customerEmail;
  }

  return stripe.checkout.sessions.create(params);
}

/**
 * فتح Stripe Customer Portal لإدارة الاشتراك
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl = `${env.appUrl}/billing`,
) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export { isStripeConfigured, isStripeLiveReady, isStripePlaceholder };
