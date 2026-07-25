/** عملاء B2B / شركاء (منفصلون عن المتدربين) */

export const CUSTOMER_STATUSES = ["active", "inactive", "lead"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export type Customer = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: CustomerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: CustomerStatus;
  notes?: string;
};

export type CustomerFilters = {
  query?: string;
  status?: CustomerStatus | "all";
};

export type CustomerStats = {
  total: number;
  active: number;
  inactive: number;
  lead: number;
};
