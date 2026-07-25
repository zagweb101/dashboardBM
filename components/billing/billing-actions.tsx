"use client";

/**
 * أزرار Checkout / Portal — Client
 */
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  openPortalAction,
  startCheckoutAction,
} from "@/app/(app)/billing/actions";
import type { PlanId } from "@/types/billing";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type PortalButtonProps = {
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function PortalButton({
  disabled,
  label,
  className,
}: PortalButtonProps) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const { toast } = useToast();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled || pending}
      className={className}
      onClick={() => {
        start(async () => {
          const res = await openPortalAction();
          if (res && !res.success) {
            toast({
              title: ar ? "بوابة الفوترة" : "Billing portal",
              description: res.error,
              tone: "error",
            });
          }
        });
      }}
    >
      {pending
        ? ar
          ? "جارٍ الفتح..."
          : "Opening..."
        : label ?? (ar ? "إدارة الاشتراك" : "Manage subscription")}
    </Button>
  );
}

type CheckoutButtonProps = {
  planId: PlanId;
  interval: "month" | "year";
  disabled?: boolean;
  current?: boolean;
  highlighted?: boolean;
  className?: string;
};

export function CheckoutButton({
  planId,
  interval,
  disabled,
  current,
  highlighted,
  className,
}: CheckoutButtonProps) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (planId === "free") {
    return (
      <Button className={cn("w-full", className)} variant="secondary" disabled>
        {ar ? "الخطة الحالية المجانية" : "Free plan"}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className={cn("w-full", className)}
        variant={highlighted ? "primary" : "secondary"}
        disabled={disabled || pending || current}
        onClick={() => {
          setError(null);
          start(async () => {
            const res = await startCheckoutAction({ planId, interval });
            if (res && !res.success) {
              setError(res.error ?? null);
              toast({
                title: ar ? "الدفع" : "Checkout",
                description: res.error,
                tone: "error",
              });
            }
          });
        }}
      >
        {pending
          ? ar
            ? "جارٍ التحويل لـ Stripe..."
            : "Redirecting to Stripe..."
          : current
            ? ar
              ? "خطتك الحالية"
              : "Current plan"
            : ar
              ? interval === "year"
                ? "اشترك سنوياً"
                : "اشترك شهرياً"
              : interval === "year"
                ? "Subscribe yearly"
                : "Subscribe monthly"}
      </Button>
      {error ? (
        <p className="text-center text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type UpgradeButtonsProps = {
  canManage: boolean;
  stripeLiveReady: boolean;
  hasCustomer: boolean;
};

export function UpgradeButtons({
  canManage,
  stripeLiveReady,
  hasCustomer,
}: UpgradeButtonsProps) {
  const { locale } = useLanguage();
  const ar = locale === "ar";

  return (
    <div className="flex flex-wrap gap-2">
      <PortalButton
        disabled={!canManage || !stripeLiveReady || !hasCustomer}
        label={ar ? "بوابة العميل" : "Customer portal"}
      />
      <CheckoutButton
        planId="pro"
        interval="month"
        disabled={!canManage || !stripeLiveReady}
        highlighted
      />
    </div>
  );
}
