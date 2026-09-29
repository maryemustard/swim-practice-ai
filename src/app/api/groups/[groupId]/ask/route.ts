import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askAboutGroup, type ChatMessage } from "@/lib/askCoach";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/groups/[groupId]/ask">
) {
  const { groupId } = await params;
  const body = await request.json();
  const question = String(body.question ?? "").trim();
  const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      swimmers: { include: { times: true } },
      goalMeets: true,
      drills: true,
      practices: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set — add it to .env to enable the coach assistant." },
      { status: 400 }
    );
  }

  try {
    const answer = await askAboutGroup(group, question, history);
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[ask] Claude call failed:", err);
    return NextResponse.json({ error: "Something went wrong asking Claude. Try again." }, { status: 500 });
  }
}
