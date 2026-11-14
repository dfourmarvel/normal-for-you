import { NextResponse } from "next/server";
import { getMission } from "@/lib/data";

export async function GET() {
  return NextResponse.json(getMission());
}
