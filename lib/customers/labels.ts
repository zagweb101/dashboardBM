import type { Locale } from "@/lib/i18n/translations";
import type { CustomerStatus } from "@/types/customer";

export const customerStatusLabels: Record<
  CustomerStatus,
  { ar: string; en: string }
> = {
  active: { ar: "نشط", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
  lead: { ar: "فرصة", en: "Lead" },
};

export function labelCustomerStatus(s: CustomerStatus, locale: Locale) {
  return customerStatusLabels[s][locale];
}

export const customerStatusTone: Record<
  CustomerStatus,
  "success" | "default" | "warning" | "info" | "danger"
> = {
  active: "success",
  inactive: "default",
  lead: "warning",
};
