import { NextResponse } from "next/server";
import { getCrew } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ crew: getCrew(), simulated: true });
}
