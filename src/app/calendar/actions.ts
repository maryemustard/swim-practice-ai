"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseLocalDate } from "@/lib/calendarMonth";

export async function addTeamEventAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const type = String(formData.get("type") ?? "meet");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!name || !date) return;

  const team = await prisma.team.upsert({
    where: { id: "demo-team" },
    update: {},
    create: { id: "demo-team", name: "Demo Swim Team" },
  });

  await prisma.teamEvent.create({
    data: { teamId: team.id, name, date: parseLocalDate(date), type, notes },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function deleteTeamEventAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await prisma.teamEvent.delete({ where: { id: eventId } });
  revalidatePath("/calendar");
  revalidatePath("/");
}
