import { NextResponse } from "next/server";
import { constructStripeEvent } from "@/lib/stripe/webhooks";
import { isStripeConfigured, isStripePlaceholder } from "@/lib/env";
import { isDatabaseConfigured, query, queryOne } from "@/lib/db/postgres";
import type Stripe from "stripe";

export const runtime = "nodejs";

/**
 * Stripe Webhook — /api/webhooks/stripe
 *
 * Persists subscription + invoice events to PostgreSQL.
 * Falls back to console logging when DB is not configured.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  if (isStripePlaceholder()) {
    return NextResponse.json(
      { error: "Placeholder Stripe keys — configure real test keys before webhooks" },
      { status: 503 },
    );
  }

  try {
    const event = await constructStripeEvent(request);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        const planId = session.metadata?.planId;
        console.info("[stripe] checkout.session.completed", {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          organizationId: orgId,
          planId,
        });

        if (isDatabaseConfigured() && orgId && session.customer) {
          await upsertSubscription(orgId, {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: (session.subscription as string) ?? null,
            planId: planId ?? "free",
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organizationId;
        console.info(`[stripe] ${event.type}`, {
          id: sub.id,
          status: sub.status,
          organizationId: orgId,
        });

        if (isDatabaseConfigured() && orgId) {
          const isDeleted = event.type === "customer.subscription.deleted";
          const subAny = sub as unknown as Record<string, unknown>;
          const periodEnd = subAny.current_period_end;
          await upsertSubscription(orgId, {
            stripeSubscriptionId: sub.id,
            status: isDeleted ? "canceled" : sub.status,
            cancelAtPeriodEnd: (subAny.cancel_at_period_end as boolean) ?? false,
            currentPeriodEnd: typeof periodEnd === "number"
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.info("[stripe] invoice.paid", {
          id: invoice.id,
          customer: invoice.customer,
          amount: invoice.amount_paid,
        });

        if (isDatabaseConfigured() && invoice.customer) {
          const orgId = await findOrgByStripeCustomer(invoice.customer as string);
          if (orgId) {
            await insertInvoice(orgId, {
              stripeInvoiceId: invoice.id,
              number: invoice.number ?? `INV-${Date.now()}`,
              amount: (invoice.amount_paid ?? 0) / 100,
              currency: (invoice.currency ?? "sar").toUpperCase(),
              status: "paid",
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.error("[stripe] invoice.payment_failed", {
          id: invoice.id,
          customer: invoice.customer,
        });

        if (isDatabaseConfigured() && invoice.customer) {
          const orgId = await findOrgByStripeCustomer(invoice.customer as string);
          if (orgId) {
            await insertInvoice(orgId, {
              stripeInvoiceId: invoice.id,
              number: invoice.number ?? `INV-${Date.now()}`,
              amount: (invoice.amount_paid ?? 0) / 100,
              currency: (invoice.currency ?? "sar").toUpperCase(),
              status: "open",
            });
          }
        }
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

// ── DB Helpers ────────────────────────────────────────────────────────

async function upsertSubscription(
  orgId: string,
  data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    planId?: string;
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string | null;
  },
) {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM organization_subscriptions WHERE organization_id = $1`,
    [orgId],
  );

  if (existing) {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.stripeCustomerId) {
      sets.push(`stripe_customer_id = $${idx++}`);
      params.push(data.stripeCustomerId);
    }
    if (data.stripeSubscriptionId !== undefined) {
      sets.push(`stripe_subscription_id = $${idx++}`);
      params.push(data.stripeSubscriptionId);
    }
    if (data.planId) {
      sets.push(`plan_id = $${idx++}`);
      params.push(data.planId);
    }
    if (data.status) {
      sets.push(`status = $${idx++}`);
      params.push(data.status);
    }
    if (data.cancelAtPeriodEnd !== undefined) {
      sets.push(`cancel_at_period_end = $${idx++}`);
      params.push(data.cancelAtPeriodEnd);
    }
    if (data.currentPeriodEnd !== undefined) {
      sets.push(`current_period_end = $${idx++}`);
      params.push(data.currentPeriodEnd);
    }
    sets.push(`updated_at = now()`);
    params.push(orgId);

    if (sets.length > 1) {
      await query(
        `UPDATE organization_subscriptions SET ${sets.join(", ")} WHERE organization_id = $${idx}`,
        params,
      );
    }
  } else {
    await query(
      `INSERT INTO organization_subscriptions
        (organization_id, plan_id, status, interval, stripe_customer_id, stripe_subscription_id)
       VALUES ($1, $2, $3, 'month', $4, $5)`,
      [
        orgId,
        data.planId ?? "free",
        data.status ?? "active",
        data.stripeCustomerId ?? null,
        data.stripeSubscriptionId ?? null,
      ],
    );
  }
}

async function insertInvoice(
  orgId: string,
  data: {
    stripeInvoiceId: string;
    number: string;
    amount: number;
    currency: string;
    status: "paid" | "open" | "void" | "uncollectible";
  },
) {
  const exists = await queryOne<{ id: string }>(
    `SELECT id FROM invoices WHERE stripe_invoice_id = $1`,
    [data.stripeInvoiceId],
  );
  if (exists) return;

  await query(
    `INSERT INTO invoices (organization_id, number, amount, currency, status, stripe_invoice_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [orgId, data.number, data.amount, data.currency, data.status, data.stripeInvoiceId],
  );
}

async function findOrgByStripeCustomer(stripeCustomerId: string): Promise<string | null> {
  const row = await queryOne<{ organization_id: string }>(
    `SELECT organization_id FROM organization_subscriptions
     WHERE stripe_customer_id = $1 LIMIT 1`,
    [stripeCustomerId],
  );
  return row?.organization_id ?? null;
}
