import { getStripe, isStripeConfigured, isStripePlaceholder } from "@/lib/stripe/client";
import { env } from "@/lib/env";

/**
 * التحقق من توقيع Webhook Stripe
 */
export async function constructStripeEvent(request: Request) {
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (isStripePlaceholder()) {
    throw new Error("STRIPE_PLACEHOLDER_KEYS");
  }
  if (!env.stripe.webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    throw new Error("Missing stripe-signature header");
  }

  const body = await request.text();
  return stripe.webhooks.constructEvent(
    body,
    signature,
    env.stripe.webhookSecret,
  );
}
