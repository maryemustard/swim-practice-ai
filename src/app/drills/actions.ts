"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Single-team app for now — same convention as the team calendar.
async function theTeam() {
  return prisma.team.upsert({
    where: { id: "demo-team" },
    update: {},
    create: { id: "demo-team", name: "Demo Swim Team" },
  });
}

export async function addTeamDrillAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const definition = String(formData.get("definition") ?? "").trim();
  if (!name || !definition) return;

  const team = await theTeam();
  await prisma.drillEntry.create({ data: { teamId: team.id, name, definition } });

  revalidatePath("/drills");
  revalidatePath("/groups");
}

export async function deleteDrillAction(formData: FormData) {
  const drillId = String(formData.get("drillId") ?? "");
  if (!drillId) return;

  const drill = await prisma.drillEntry.delete({ where: { id: drillId } });

  revalidatePath("/drills");
  if (drill.groupId) revalidatePath(`/groups/${drill.groupId}`);
}
