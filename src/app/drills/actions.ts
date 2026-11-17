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

export async function updateDrillAction(formData: FormData) {
  const drillId = String(formData.get("drillId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const definition = String(formData.get("definition") ?? "").trim();
  if (!drillId || !name || !definition) return;

  await prisma.drillEntry.update({ where: { id: drillId }, data: { name, definition } });
  revalidatePath("/drills");
}

export async function deleteDrillAction(formData: FormData) {
  const drillId = String(formData.get("drillId") ?? "");
  if (!drillId) return;

  const drill = await prisma.drillEntry.delete({ where: { id: drillId } });

  revalidatePath("/drills");
  if (drill.groupId) revalidatePath(`/groups/${drill.groupId}`);
}

export async function addSkillAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  const stage = String(formData.get("stage") ?? "").trim() || null;
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  const cues = String(formData.get("cues") ?? "").trim();
  if (!name || !cues) return;

  const team = await theTeam();
  await prisma.skill.create({ data: { teamId: team.id, category, stage, name, videoUrl, cues } });

  revalidatePath("/drills");
}

export async function updateSkillAction(formData: FormData) {
  const skillId = String(formData.get("skillId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  const stage = String(formData.get("stage") ?? "").trim() || null;
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  const cues = String(formData.get("cues") ?? "").trim();
  if (!skillId || !name || !cues) return;

  await prisma.skill.update({ where: { id: skillId }, data: { name, category, stage, videoUrl, cues } });
  revalidatePath("/drills");
}

export async function deleteSkillAction(formData: FormData) {
  const skillId = String(formData.get("skillId") ?? "");
  if (!skillId) return;

  await prisma.skill.delete({ where: { id: skillId } });
  revalidatePath("/drills");
}
