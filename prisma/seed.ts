import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const team = await prisma.team.upsert({
    where: { id: "demo-team" },
    update: {},
    create: { id: "demo-team", name: "Demo Swim Team" },
  });

  const seniorFlex = await prisma.group.create({
    data: {
      teamId: team.id,
      name: "Senior Flex",
      ageRange: "14-18",
      targetStandard: "100 free pacing on 1:20 by Northeast Divisionals",
      swimmers: {
        create: [
          {
            name: "Ava Chen",
            times: {
              create: [
                { event: "100 Free", kind: "current", seconds: 58.4 },
                { event: "100 Free", kind: "goal", seconds: 55.0 },
                { event: "200 Free", kind: "current", seconds: 128.2 },
              ],
            },
          },
          {
            name: "Jordan Lee",
            times: {
              create: [
                { event: "100 Free", kind: "current", seconds: 62.1 },
                { event: "100 Free", kind: "goal", seconds: 59.0 },
              ],
            },
          },
          {
            name: "Priya Patel",
            times: {
              create: [
                { event: "100 Free", kind: "current", seconds: 65.8 },
                { event: "100 Free", kind: "goal", seconds: 62.5 },
              ],
            },
          },
          {
            name: "Sam Torres",
            times: {
              create: [
                { event: "100 Free", kind: "current", seconds: 70.3 },
                { event: "100 Free", kind: "goal", seconds: 66.0 },
              ],
            },
          },
        ],
      },
      styleExamples: {
        create: [
          {
            title: "Aerobic base — week of 9/8",
            content:
              "Warmup: 400 free/choice easy\nKick: 6x50 kick on :15 rest\nMain: 8x100 free on 1:30, descend 1-4, 5-8\nDrill: 4x50 catchup drill on :15\nCooldown: 200 easy",
          },
          {
            title: "Threshold day — week of 9/15",
            content:
              "Warmup: 400 free/choice easy\nPre-set: 8x50 build on :10\nMain: 5x200 free on 2:45 holding threshold pace\nKick: 6x50 kick on :15\nCooldown: 200 easy",
          },
        ],
      },
      goalMeets: {
        create: [
          {
            name: "Northeast Divisionals",
            date: new Date("2027-03-14"),
            taperWeeks: 3,
            attendanceNotes:
              "4x/week: expect low-30s pace on 100 free by March. 6x/week: expect high-20s. Full attendance (10x/week aligned to 2x/day weeks): sub-28.",
          },
        ],
      },
      drills: {
        create: [
          { name: "Catchup drill", definition: "One arm stays extended in front until the other arm completes its full stroke cycle and touches it." },
          { name: "Fist drill", definition: "Swim freestyle with closed fists to emphasize forearm catch." },
        ],
      },
    },
  });

  await prisma.group.create({
    data: {
      teamId: team.id,
      name: "Dogs 1",
      ageRange: "10-12",
      targetStandard: "Build aerobic base, technique focus",
      swimmers: {
        create: [
          {
            name: "Milo Nguyen",
            times: { create: [{ event: "100 Free", kind: "current", seconds: 78.5 }] },
          },
          {
            name: "Zoe Williams",
            times: { create: [{ event: "100 Free", kind: "current", seconds: 82.1 }] },
          },
        ],
      },
      styleExamples: {
        create: [
          {
            title: "Technique day — week of 9/8",
            content:
              "Warmup: 200 free easy\nDrill: 8x25 catchup drill on :20\nMain: 6x50 free on :55, focus on technique\nKick: 4x50 kick with board\nCooldown: 100 easy",
          },
        ],
      },
    },
  });

  console.log(`Seeded team "${team.name}" with groups "Senior Flex" and "Dogs 1".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
