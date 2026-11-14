import { NextResponse } from "next/server";
import { getGuidance } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(getGuidance(id));
}
