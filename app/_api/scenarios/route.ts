import { NextResponse } from "next/server";
import { getScenarios } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ scenarios: getScenarios(), simulated: true });
}
