import { NextResponse } from "next/server";
import { heartbeatService } from "@/src/services/api/in-flight-heartbeat.service";

export async function GET() {
  const ok = await heartbeatService.getStatus();
  return NextResponse.json({ ok });
}
