import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n/translations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  locale: Locale | string = "ar",
  currency = "SAR",
): string {
  const resolved = locale === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(resolved, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale | string = "ar"): string {
  const resolved = locale === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(resolved).format(value);
}

export function formatPercent(value: number, locale: Locale | string = "ar"): string {
  const resolved = locale === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(resolved, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: Locale | string = "ar",
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const resolved = locale === "ar" ? "ar-SA" : "en-GB";
  return new Intl.DateTimeFormat(resolved, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(date);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("05")) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}
