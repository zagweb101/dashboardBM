/**
 * Student tuition payments (center revenue from trainees).
 * Distinct from org SaaS billing in types/billing.ts + Stripe.
 */

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "transfer",
  "stc_pay",
  "apple_pay",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type StudentPayment = {
  id: string;
  organizationId: string;
  studentId: string;
  /** Optional link to a course enrollment */
  enrollmentId?: string | null;
  courseId?: string | null;
  amount: number;
  currency: "SAR";
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  /** Receipt / bank reference */
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentPaymentInput = {
  studentId: string;
  enrollmentId?: string;
  courseId?: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string;
  reference?: string;
  notes?: string;
};

export type StudentPaymentFilters = {
  query?: string;
  studentId?: string | "all";
  courseId?: string | "all";
  method?: PaymentMethod | "all";
  status?: PaymentStatus | "all";
};

export type StudentPaymentWithDetails = StudentPayment & {
  studentName: string;
  studentCode: string;
  courseTitle?: string | null;
};

export type PaymentStats = {
  totalCollected: number;
  pendingAmount: number;
  refundedAmount: number;
  paymentsThisMonth: number;
  count: number;
};
