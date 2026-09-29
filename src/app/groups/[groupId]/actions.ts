"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generatePractice, resolvePractice } from "@/lib/generatePractice";
import { parseTimeToSeconds } from "@/lib/time";
import { parseLocalDate } from "@/lib/calendarMonth";

type CsvRow = { name?: string; event?: string; kind?: string; time?: string; seconds?: string; gender?: string };

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
    const gender = row.gender?.trim().toUpperCase() || undefined;
    const rawTime = (row.time ?? row.seconds ?? "").trim();
    if (!name || !event || !kind || !rawTime) continue;

    let seconds: number;
    try {
      seconds = parseTimeToSeconds(rawTime);
    } catch {
      continue; // skip unparseable rows rather than failing the whole import
    }

    const swimmer = await prisma.swimmer.upsert({
      where: { id: `${groupId}:${name}` },
      update: gender ? { gender } : {},
      create: { id: `${groupId}:${name}`, groupId, name, gender },
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
  const gender = String(formData.get("gender") ?? "").trim() || undefined;
  if (!groupId || !name || !event) return;

  let seconds: number;
  try {
    seconds = parseTimeToSeconds(String(formData.get("time") ?? ""));
  } catch {
    return;
  }

  const swimmer = await prisma.swimmer.upsert({
    where: { id: `${groupId}:${name}` },
    update: gender ? { gender } : {},
    create: { id: `${groupId}:${name}`, groupId, name, gender },
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
    data: { groupId, name, date: parseLocalDate(date), taperWeeks, attendanceNotes },
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
  const dateStr = String(formData.get("date") ?? "");
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
      ...(dateStr ? { date: parseLocalDate(dateStr) } : {}),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/calendar`);
  revalidatePath("/practices");
  redirect(`/practices/${saved.id}`);
}

export async function addManualPracticeAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const focus = String(formData.get("focus") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  if (!groupId || !dateStr || !content) return;

  const saved = await prisma.practice.create({
    data: {
      groupId,
      focus,
      source: "manual",
      content,
      date: parseLocalDate(dateStr),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/calendar`);
  revalidatePath("/practices");
  redirect(`/practices/${saved.id}`);
}
