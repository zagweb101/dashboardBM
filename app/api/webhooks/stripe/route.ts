import { NextResponse } from "next/server";
import { constructStripeEvent } from "@/lib/stripe/webhooks";
import {
  isStripeConfigured,
  isStripePlaceholder,
} from "@/lib/env";
import type Stripe from "stripe";

export const runtime = "nodejs";

/**
 * Stripe Webhook — /api/webhooks/stripe
 *
 * أحداث مهمة:
 * - checkout.session.completed
 * - customer.subscription.updated / deleted
 * - invoice.paid / payment_failed
 *
 * لاحقاً: حدّث جدول الاشتراكات في Postgres هنا.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  if (isStripePlaceholder()) {
    return NextResponse.json(
      {
        error:
          "Placeholder Stripe keys — configure real test keys before webhooks",
      },
      { status: 503 },
    );
  }

  try {
    const event = await constructStripeEvent(request);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.info("[stripe] checkout.session.completed", {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          organizationId: session.metadata?.organizationId,
          planId: session.metadata?.planId,
        });
        // TODO: حفظ stripeCustomerId + planId في قاعدة البيانات
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.info(`[stripe] ${event.type}`, {
          id: sub.id,
          status: sub.status,
          organizationId: sub.metadata?.organizationId,
        });
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.info(`[stripe] ${event.type}`, {
          id: invoice.id,
          customer: invoice.customer,
          amount: invoice.amount_paid,
        });
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    console.error("[stripe] webhook error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
