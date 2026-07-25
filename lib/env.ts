function read(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function readBool(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

export const env = {
  appUrl: read("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  appName: read("NEXT_PUBLIC_APP_NAME", "بيت المصور"),
  /**
   * @deprecated استُبدل بـ Auth.js
   */
  useMockAuth: readBool("NEXT_PUBLIC_USE_MOCK_AUTH", false),
  authSecret: read("AUTH_SECRET"),
  databaseUrl: read("DATABASE_URL"),
  supabase: {
    url: read("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  },
  stripe: {
    secretKey: read("STRIPE_SECRET_KEY"),
    webhookSecret: read("STRIPE_WEBHOOK_SECRET"),
    publishableKey: read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    /** أسعار مبسّطة (Test Mode) */
    priceMonthly: read(
      "STRIPE_PRICE_ID_MONTHLY",
      read("STRIPE_PRICE_PRO_MONTHLY"),
    ),
    priceYearly: read(
      "STRIPE_PRICE_ID_YEARLY",
      read("STRIPE_PRICE_PRO_YEARLY"),
    ),
    prices: {
      starterMonthly: read("STRIPE_PRICE_STARTER_MONTHLY"),
      starterYearly: read("STRIPE_PRICE_STARTER_YEARLY"),
      proMonthly: read(
        "STRIPE_PRICE_PRO_MONTHLY",
        read("STRIPE_PRICE_ID_MONTHLY"),
      ),
      proYearly: read(
        "STRIPE_PRICE_PRO_YEARLY",
        read("STRIPE_PRICE_ID_YEARLY"),
      ),
      enterpriseMonthly: read("STRIPE_PRICE_ENTERPRISE_MONTHLY"),
      enterpriseYearly: read("STRIPE_PRICE_ENTERPRISE_YEARLY"),
    },
  },
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabase.url && env.supabase.anonKey);
}

/** المفاتيح موجودة (حتى لو وهمية) */
export function isStripeConfigured(): boolean {
  return Boolean(
    env.stripe.secretKey.startsWith("sk_") &&
      env.stripe.publishableKey.startsWith("pk_"),
  );
}

/** مفاتيح Test Mode وهمية / placeholder — لا تستدعي Stripe API الحقيقي */
export function isStripePlaceholder(): boolean {
  if (!isStripeConfigured()) return false;
  const hay = [
    env.stripe.secretKey,
    env.stripe.publishableKey,
    env.stripe.webhookSecret,
    env.stripe.priceMonthly,
    env.stripe.priceYearly,
  ]
    .join(" ")
    .toLowerCase();
  return (
    hay.includes("dummy") ||
    hay.includes("placeholder") ||
    hay.includes("your_") ||
    hay.includes("sk_test_...") ||
    hay.includes("pk_test_...")
  );
}

/** جاهز لاستدعاء Stripe API (مفاتيح حقيقية test أو live) */
export function isStripeLiveReady(): boolean {
  return isStripeConfigured() && !isStripePlaceholder();
}

export function isDatabaseConfigured(): boolean {
  return Boolean(env.databaseUrl.trim());
}
