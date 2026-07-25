export type BillingLocale = "ar" | "en";

const messages = {
  notConfigured: {
    ar: "Stripe غير مُعدّ. أضف المفاتيح في .env.local",
    en: "Stripe is not configured. Add keys to .env.local",
  },
  placeholderKeys: {
    ar: "مفاتيح Stripe وهمية (Dummy). استبدلها بمفاتيح Test Mode الحقيقية من لوحة Stripe لتفعيل الدفع.",
    en: "Stripe keys are placeholders (Dummy). Replace them with real Test Mode keys from the Stripe Dashboard.",
  },
  noPermission: {
    ar: "ليس لديك صلاحية إدارة الفوترة",
    en: "You do not have permission to manage billing",
  },
  freeNoCheckout: {
    ar: "الخطة المجانية لا تحتاج إلى دفع",
    en: "The free plan does not require checkout",
  },
  missingPrice: {
    ar: "معرّف السعر غير موجود لهذه الخطة. تحقق من STRIPE_PRICE_ID_MONTHLY / YEARLY",
    en: "Price ID missing for this plan. Check STRIPE_PRICE_ID_MONTHLY / YEARLY",
  },
  noCustomer: {
    ar: "لا يوجد عميل Stripe مرتبط بعد. اشترك أولاً عبر Checkout.",
    en: "No Stripe customer linked yet. Subscribe via Checkout first.",
  },
  checkoutFailed: {
    ar: "تعذّر إنشاء جلسة الدفع",
    en: "Could not create checkout session",
  },
  portalFailed: {
    ar: "تعذّر فتح بوابة إدارة الاشتراك",
    en: "Could not open the customer portal",
  },
  noUrl: {
    ar: "لم يُرجع Stripe رابطاً صالحاً",
    en: "Stripe did not return a valid URL",
  },
} as const;

export type BillingMessageKey = keyof typeof messages;

export function billingMessage(
  key: BillingMessageKey,
  locale: BillingLocale = "ar",
): string {
  return messages[key][locale] ?? messages[key].en;
}
