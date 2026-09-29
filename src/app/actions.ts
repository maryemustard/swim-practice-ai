"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createGroupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const team = await prisma.team.upsert({
    where: { id: "demo-team" },
    update: {},
    create: { id: "demo-team", name: "Demo Swim Team" },
  });

  await prisma.group.create({
    data: {
      teamId: team.id,
      name,
      ageRange: String(formData.get("ageRange") ?? "").trim() || null,
      targetStandard: String(formData.get("targetStandard") ?? "").trim() || null,
    },
  });

  revalidatePath("/groups");
  revalidatePath("/");
}

export async function updateGroupAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!groupId || !name) return;

  await prisma.group.update({
    where: { id: groupId },
    data: {
      name,
      ageRange: String(formData.get("ageRange") ?? "").trim() || null,
      targetStandard: String(formData.get("targetStandard") ?? "").trim() || null,
    },
  });

  revalidatePath("/groups");
  revalidatePath("/");
  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function deleteGroupAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return;
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/groups");
  revalidatePath("/");
  redirect("/groups");
}
