import { NextResponse } from "next/server";
import { pingDatabase, isDatabaseConfigured } from "@/lib/db/postgres";

export const runtime = "nodejs";

export async function GET() {
  const dbConfigured = isDatabaseConfigured();
  let dbStatus: "connected" | "not_configured" | "error" = "not_configured";

  if (dbConfigured) {
    const ok = await pingDatabase();
    dbStatus = ok ? "connected" : "error";
  }

  return NextResponse.json({
    status: dbStatus === "error" ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    database: {
      configured: dbConfigured,
      status: dbStatus,
    },
    version: process.env.npm_package_version ?? "0.1.0",
  });
}
