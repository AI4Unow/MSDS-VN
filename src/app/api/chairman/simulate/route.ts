import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-config";
import { runSimulation } from "@/lib/chairman/orchestrator";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "chairman") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { budgetAllocation, timelineAdjustments, numSimulations } = body;

    if (!budgetAllocation || typeof budgetAllocation !== "object") {
      return NextResponse.json({ error: "budgetAllocation is required" }, { status: 400 });
    }

    const result = await runSimulation({
      budgetAllocation,
      timelineAdjustments: timelineAdjustments ?? {},
      numSimulations: Math.min(Math.max(numSimulations ?? 1000, 1), 10000),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
