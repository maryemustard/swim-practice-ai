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
