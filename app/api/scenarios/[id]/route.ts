import { NextResponse } from "next/server";
import { getScenarioById } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scenario = getScenarioById(id);
  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...scenario, simulated: true });
}
