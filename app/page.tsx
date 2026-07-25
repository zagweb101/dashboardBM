import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

/** Root entry: bounce to dashboard or login */
export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
