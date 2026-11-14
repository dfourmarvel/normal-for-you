import { NextResponse } from "next/server";
import { getOptimization } from "@/lib/data";

export async function GET() {
  return NextResponse.json(getOptimization());
}
