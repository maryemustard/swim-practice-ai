"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generatePractice, resolvePractice } from "@/lib/generatePractice";

type CsvRow = { name?: string; event?: string; kind?: string; seconds?: string };

export async function uploadTimesCsvAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const file = formData.get("file") as File | null;
  if (!groupId || !file || file.size === 0) return;

  const text = await file.text();
  const { data } = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });

  for (const row of data) {
    const name = row.name?.trim();
    const event = row.event?.trim();
    const kind = row.kind?.trim().toLowerCase();
    const seconds = Number(row.seconds);
    if (!name || !event || !kind || !Number.isFinite(seconds)) continue;

    const swimmer = await prisma.swimmer.upsert({
      where: { id: `${groupId}:${name}` },
      update: {},
      create: { id: `${groupId}:${name}`, groupId, name },
    });

    await prisma.swimTime.create({
      data: { swimmerId: swimmer.id, event, kind: kind === "goal" ? "goal" : "current", seconds },
    });
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/upload`);
}

export async function addSwimmerTimeAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const event = String(formData.get("event") ?? "").trim();
  const kind = String(formData.get("kind") ?? "current");
  const seconds = Number(formData.get("seconds"));
  if (!groupId || !name || !event || !Number.isFinite(seconds)) return;

  const swimmer = await prisma.swimmer.upsert({
    where: { id: `${groupId}:${name}` },
    update: {},
    create: { id: `${groupId}:${name}`, groupId, name },
  });

  await prisma.swimTime.create({ data: { swimmerId: swimmer.id, event, kind, seconds } });
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/upload`);
}

export async function addStyleExampleAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!groupId || !title || !content) return;

  await prisma.styleExample.create({ data: { groupId, title, content } });
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/upload`);
}

export async function addGoalMeetAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const taperWeeks = Number(formData.get("taperWeeks") ?? 2);
  const attendanceNotes = String(formData.get("attendanceNotes") ?? "").trim() || null;
  if (!groupId || !name || !date) return;

  await prisma.goalMeet.create({
    data: { groupId, name, date: new Date(date), taperWeeks, attendanceNotes },
  });
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/upload`);
}

export async function addDrillAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const definition = String(formData.get("definition") ?? "").trim();
  if (!groupId || !name || !definition) return;

  await prisma.drillEntry.create({ data: { groupId, name, definition } });
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/upload`);
}

export async function generatePracticeAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const focus = String(formData.get("focus") ?? "aerobic base").trim();
  if (!groupId) return;

  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: {
      styleExamples: true,
      drills: true,
      swimmers: { include: { times: true } },
    },
  });

  const practice = await generatePractice(group, focus);
  const resolved = resolvePractice(group, practice);

  const saved = await prisma.practice.create({
    data: {
      groupId,
      focus,
      source: resolved.source,
      content: resolved.text,
      intervals: JSON.stringify(resolved.paceSets),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/practices");
  redirect(`/practices/${saved.id}`);
}
