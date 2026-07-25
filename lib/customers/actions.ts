"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  CUSTOMER_STATUSES,
  type Customer,
  type CustomerInput,
  type CustomerStatus,
} from "@/types/customer";

export type CustomerActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  customer?: Customer;
};

function localeOf(user: { locale?: string }) {
  return user.locale === "en" ? "en" : "ar";
}

function parseInput(
  formData: FormData,
  locale: "ar" | "en",
): { success: true; data: CustomerInput } | { success: false; errors: Record<string, string> } {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || undefined;
  const company = String(formData.get("company") ?? "").trim() || undefined;
  const status = String(formData.get("status") ?? "lead").trim();
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const errors: Record<string, string> = {};
  const msg = (ar: string, en: string) => (locale === "ar" ? ar : en);

  if (name.length < 2) {
    errors.name = msg("الاسم قصير جداً", "Name is too short");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = msg("بريد غير صالح", "Invalid email");
  }
  if (!(CUSTOMER_STATUSES as readonly string[]).includes(status)) {
    errors.status = msg("حالة غير صالحة", "Invalid status");
  }

  if (Object.keys(errors).length) return { success: false, errors };

  return {
    success: true,
    data: {
      name,
      email,
      phone,
      company,
      status: status as CustomerStatus,
      notes,
    },
  };
}

export async function createCustomerAction(
  _prev: CustomerActionState | null,
  formData: FormData,
): Promise<CustomerActionState> {
  const user = await requirePermission("customers:create");
  const locale = localeOf(user);
  const parsed = parseInput(formData, locale);
  if (!parsed.success) {
    return {
      success: false,
      error: locale === "ar" ? "صحّح الحقول" : "Fix the fields",
      fieldErrors: parsed.errors,
    };
  }
  try {
    const customer = await db.createCustomer(user.organizationId, parsed.data);
    revalidatePath("/customers");
    return { success: true, customer };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

export async function updateCustomerAction(
  _prev: CustomerActionState | null,
  formData: FormData,
): Promise<CustomerActionState> {
  const user = await requirePermission("customers:edit");
  const locale = localeOf(user);
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return {
      success: false,
      error: locale === "ar" ? "معرّف مفقود" : "Missing id",
    };
  }
  const existing = await db.getCustomerById(id);
  if (!existing || existing.organizationId !== user.organizationId) {
    return {
      success: false,
      error: locale === "ar" ? "العميل غير موجود" : "Customer not found",
    };
  }
  const parsed = parseInput(formData, locale);
  if (!parsed.success) {
    return {
      success: false,
      error: locale === "ar" ? "صحّح الحقول" : "Fix the fields",
      fieldErrors: parsed.errors,
    };
  }
  const customer = await db.updateCustomer(id, parsed.data);
  revalidatePath("/customers");
  return { success: true, customer: customer ?? undefined };
}

export async function deleteCustomerAction(
  id: string,
): Promise<CustomerActionState> {
  const user = await requirePermission("customers:delete");
  const existing = await db.getCustomerById(id);
  if (!existing || existing.organizationId !== user.organizationId) {
    return { success: false, error: "Not found" };
  }
  await db.deleteCustomer(id);
  revalidatePath("/customers");
  return { success: true };
}
