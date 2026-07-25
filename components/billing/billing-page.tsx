"use client";

/**
 * واجهة صفحة الفوترة — عربي/إنجليزي + RTL
 */
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CheckoutButton,
  PortalButton,
  UpgradeButtons,
} from "@/components/billing/billing-actions";
import { useLanguage } from "@/components/providers/language-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BillingPlan, Invoice, OrganizationSubscription } from "@/types/billing";
import type { StripeStatus } from "@/lib/stripe/client";
import { AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";

type Props = {
  plans: BillingPlan[];
  subscription: OrganizationSubscription | null;
  invoices: Invoice[];
  currentPlanId: string;
  stripe: StripeStatus;
  canManage: boolean;
  checkoutFlash?: "success" | "cancel" | null;
};

export function BillingPageClient({
  plans,
  subscription,
  invoices,
  currentPlanId,
  stripe,
  canManage,
  checkoutFlash,
}: Props) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const [interval, setInterval] = useState<"month" | "year">("month");

  const currentPlan = useMemo(
    () => plans.find((p) => p.id === currentPlanId) ?? plans[0],
    [plans, currentPlanId],
  );

  return (
    <div className="space-y-6">
      {/* تنبيهات Stripe */}
      {!stripe.configured ? (
        <Alert
          tone="warning"
          title={ar ? "Stripe غير مُعدّ" : "Stripe not configured"}
          body={
            ar
              ? "أضف STRIPE_SECRET_KEY و NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY في .env.local ثم أعد تشغيل الخادم."
              : "Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local and restart the server."
          }
        />
      ) : stripe.placeholder ? (
        <Alert
          tone="warning"
          title={ar ? "مفاتيح Test وهمية (Dummy)" : "Placeholder Test keys"}
          body={
            ar
              ? "المفاتيح الحالية وهمية للتطوير فقط. استبدلها بمفاتيح sk_test_ / pk_test_ الحقيقية من لوحة Stripe لتفعيل Checkout. الواجهة جاهزة ولن ينهار التطبيق."
              : "Current keys are dummies for scaffolding. Replace with real sk_test_ / pk_test_ keys from Stripe Dashboard to enable Checkout. The app will not crash."
          }
        />
      ) : (
        <Alert
          tone="success"
          title={ar ? "Stripe Test Mode جاهز" : "Stripe Test Mode ready"}
          body={
            ar
              ? "يمكنك تجربة Checkout ببطاقة اختبار Stripe: 4242 4242 4242 4242"
              : "You can try Checkout with Stripe test card: 4242 4242 4242 4242"
          }
        />
      )}

      {checkoutFlash === "success" ? (
        <Alert
          tone="success"
          title={ar ? "تم الدفع بنجاح" : "Payment successful"}
          body={
            ar
              ? "شكراً لك. سيُحدَّث الاشتراك عبر Webhook خلال لحظات."
              : "Thank you. Your subscription will update via webhook shortly."
          }
        />
      ) : null}
      {checkoutFlash === "cancel" ? (
        <Alert
          tone="warning"
          title={ar ? "تم إلغاء الدفع" : "Checkout canceled"}
          body={
            ar
              ? "لم تُكمل عملية الدفع. يمكنك المحاولة مرة أخرى."
              : "You left checkout. You can try again anytime."
          }
        />
      ) : null}

      {/* الاشتراك الحالي */}
      <Card>
        <CardHeader
          title={ar ? "الاشتراك الحالي" : "Current subscription"}
          description={
            ar
              ? "فوترة مساحة العمل عبر Stripe (منفصلة عن مدفوعات المتدربين)"
              : "Workspace billing via Stripe (separate from student tuition)"
          }
          action={
            <Badge
              tone={
                subscription?.status === "active"
                  ? "success"
                  : subscription?.status === "past_due"
                    ? "danger"
                    : "warning"
              }
            >
              {subscription?.status ?? (ar ? "لا يوجد" : "none")}
            </Badge>
          }
        />
        <CardContent className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold">
                {currentPlan?.name[locale] ?? currentPlan?.name.en ?? "Free"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {subscription?.currentPeriodEnd
                  ? ar
                    ? `يتجدد ${formatDate(subscription.currentPeriodEnd, locale)}`
                    : `Renews ${formatDate(subscription.currentPeriodEnd, locale)}`
                  : ar
                    ? "لا فترة تجديد"
                    : "No renewal date"}
                {subscription?.interval
                  ? ar
                    ? ` · فوترة ${subscription.interval === "year" ? "سنوية" : "شهرية"}`
                    : ` · billed ${subscription.interval}ly`
                  : null}
              </p>
              {subscription?.stripeCustomerId ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">
                  customer: {subscription.stripeCustomerId}
                </p>
              ) : null}
            </div>
          </div>
          <UpgradeButtons
            canManage={canManage}
            stripeLiveReady={stripe.liveReady}
            hasCustomer={Boolean(subscription?.stripeCustomerId)}
          />
        </CardContent>
      </Card>

      {/* تبديل شهري / سنوي */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            {ar ? "الخطط" : "Plans"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {ar
              ? "اختر الخطة المناسبة لمركزك"
              : "Pick the plan that fits your center"}
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              interval === "month"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setInterval("month")}
          >
            {ar ? "شهري" : "Monthly"}
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              interval === "year"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setInterval("year")}
          >
            {ar ? "سنوي" : "Yearly"}
          </button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const price =
            interval === "year" ? plan.priceYearly : plan.priceMonthly;
          const isCurrent = plan.id === currentPlanId;
          return (
            <Card
              key={plan.id}
              className={
                plan.highlighted
                  ? "border-primary/40 ring-2 ring-primary/15"
                  : undefined
              }
            >
              <CardContent className="space-y-4 p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary">
                      {plan.name[locale]}
                    </p>
                    {plan.highlighted ? (
                      <Badge tone="info">
                        {ar ? "موصى به" : "Recommended"}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-3xl font-extrabold">
                    {formatCurrency(price, locale, plan.currency)}
                    <span className="text-sm font-medium text-muted-foreground">
                      {interval === "year"
                        ? ar
                          ? "/سنة"
                          : "/yr"
                        : ar
                          ? "/شهر"
                          : "/mo"}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description[locale]}
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features[locale].map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  <CheckoutButton
                    planId="free"
                    interval={interval}
                    current={isCurrent}
                  />
                ) : (
                  <CheckoutButton
                    planId={plan.id}
                    interval={interval}
                    current={isCurrent}
                    highlighted={plan.highlighted}
                    disabled={!canManage || !stripe.liveReady}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* فواتير */}
      <Card>
        <CardHeader
          title={ar ? "الفواتير" : "Invoices"}
          description={
            ar
              ? "سجل الفوترة (mock حتى يربط Webhook الفواتير الحقيقية)"
              : "Billing history (mock until webhooks sync real invoices)"
          }
          action={
            subscription?.stripeCustomerId ? (
              <PortalButton
                disabled={!canManage || !stripe.liveReady}
                label={ar ? "كل الفواتير في Stripe" : "All invoices in Stripe"}
              />
            ) : null
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="px-5 py-3 text-start font-semibold">
                  {ar ? "الرقم" : "Number"}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {ar ? "المبلغ" : "Amount"}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {ar ? "الحالة" : "Status"}
                </th>
                <th className="px-5 py-3 text-start font-semibold">
                  {ar ? "التاريخ" : "Date"}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    {ar ? "لا فواتير بعد" : "No invoices yet"}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-border">
                    <td className="px-5 py-3 font-medium">{invoice.number}</td>
                    <td className="px-5 py-3">
                      {formatCurrency(
                        invoice.amount,
                        locale,
                        invoice.currency,
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={
                          invoice.status === "paid"
                            ? "success"
                            : invoice.status === "open"
                              ? "warning"
                              : "default"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {formatDate(invoice.createdAt, locale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Alert({
  tone,
  title,
  body,
}: {
  tone: "warning" | "success";
  title: string;
  body: string;
}) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
      : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100";

  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 ${styles}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-sm leading-6 opacity-90">{body}</p>
      </div>
    </div>
  );
}
