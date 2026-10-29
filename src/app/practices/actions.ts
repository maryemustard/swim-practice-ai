"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function deletePracticeAction(formData: FormData) {
  const practiceId = String(formData.get("practiceId") ?? "");
  if (!practiceId) return;

  const practice = await prisma.practice.delete({ where: { id: practiceId } });

  revalidatePath("/practices");
  revalidatePath(`/groups/${practice.groupId}`);
  redirect("/practices");
}

// Everyone on the roster defaults present (checkbox checked); the coach only
// has to uncheck who was absent. One row per swimmer per practice, written/
// overwritten here.
export async function saveAttendanceAction(formData: FormData) {
  const practiceId = String(formData.get("practiceId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!practiceId || !groupId) return;

  const swimmers = await prisma.swimmer.findMany({ where: { groupId }, select: { id: true } });
  const presentIds = new Set(formData.getAll("present").map(String));

  await prisma.$transaction(
    swimmers.map((s) =>
      prisma.attendance.upsert({
        where: { practiceId_swimmerId: { practiceId, swimmerId: s.id } },
        update: { present: presentIds.has(s.id) },
        create: { practiceId, swimmerId: s.id, present: presentIds.has(s.id) },
      })
    )
  );

  revalidatePath(`/practices/${practiceId}`);
  revalidatePath(`/groups/${groupId}`);
}
