import { NextRequest, NextResponse } from "next/server";
import { getTelemetryForMetric } from "@/lib/data";

export async function GET(req: NextRequest) {
  const crewId = req.nextUrl.searchParams.get("crew_id") || "cm-reyes";
  const metric = req.nextUrl.searchParams.get("metric") || "hrv_rmssd";
  return NextResponse.json(getTelemetryForMetric(crewId, metric));
}
