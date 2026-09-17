import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeNet } from "../src/lib/money";

const db = new PrismaClient({
  datasources: { db: { url: `file:${path.join(process.cwd(), "prisma", "dev.db")}` } },
});

type SeedSession = {
  kind: "cash" | "tournament";
  daysAgo: number;
  hour: number;
  durationMin: number;
  breakMin: number;
  game: string;
  stakes: string;
  venue: string;
  buyIn: number;
  cashOut?: number;
  tips?: number;
  fees?: number;
  prize?: number;
  placement?: number;
  fieldSize?: number;
  notes: string;
};

const sessions: SeedSession[] = [
  {
    kind: "cash",
    daysAgo: 46,
    hour: 19,
    durationMin: 280,
    breakMin: 25,
    game: "NLH",
    stakes: "1/2",
    venue: "Commerce",
    buyIn: 400,
    cashOut: 620,
    tips: 15,
    notes: "Tight table, picked off a couple light 3-bets.",
  },
  {
    kind: "cash",
    daysAgo: 41,
    hour: 20,
    durationMin: 210,
    breakMin: 15,
    game: "NLH",
    stakes: "1/2",
    venue: "Home game",
    buyIn: 300,
    cashOut: 180,
    tips: 0,
    notes: "Cooler vs top set. Still a good game.",
  },
  {
    kind: "tournament",
    daysAgo: 38,
    hour: 12,
    durationMin: 340,
    breakMin: 45,
    game: "NLH",
    stakes: "$150",
    venue: "Commerce",
    buyIn: 150,
    fees: 20,
    prize: 890,
    placement: 4,
    fieldSize: 87,
    notes: "Final table, lost a flip for the chip lead.",
  },
  {
    kind: "cash",
    daysAgo: 33,
    hour: 18,
    durationMin: 190,
    breakMin: 10,
    game: "PLO",
    stakes: "1/2",
    venue: "The Bike",
    buyIn: 500,
    cashOut: 940,
    tips: 25,
    notes: "PLO is variance. Doubled through a rec who loved wrap draws.",
  },
  {
    kind: "cash",
    daysAgo: 27,
    hour: 21,
    durationMin: 245,
    breakMin: 20,
    game: "NLH",
    stakes: "2/5",
    venue: "Commerce",
    buyIn: 800,
    cashOut: 430,
    tips: 10,
    notes: "Moved up. Paid off a disguised straight.",
  },
  {
    kind: "cash",
    daysAgo: 22,
    hour: 16,
    durationMin: 360,
    breakMin: 30,
    game: "NLH",
    stakes: "1/3",
    venue: "Bellagio",
    buyIn: 500,
    cashOut: 1110,
    tips: 40,
    notes: "Vacation session. Soft, patient, didn't spew.",
  },
  {
    kind: "tournament",
    daysAgo: 18,
    hour: 11,
    durationMin: 95,
    breakMin: 15,
    game: "NLH",
    stakes: "$60",
    venue: "Online",
    buyIn: 55,
    fees: 5,
    prize: 0,
    placement: 48,
    fieldSize: 62,
    notes: "Early KO, AKo vs jacks.",
  },
  {
    kind: "cash",
    daysAgo: 14,
    hour: 19,
    durationMin: 205,
    breakMin: 0,
    game: "NLH",
    stakes: "1/2",
    venue: "Commerce",
    buyIn: 400,
    cashOut: 400,
    tips: 5,
    notes: "Break-even grind. Left when the game got nitty.",
  },
  {
    kind: "cash",
    daysAgo: 9,
    hour: 20,
    durationMin: 175,
    breakMin: 12,
    game: "NLH",
    stakes: "2/5",
    venue: "Home game",
    buyIn: 1000,
    cashOut: 1640,
    tips: 0,
    notes: "Private game. One whale, one regular.",
  },
  {
    kind: "cash",
    daysAgo: 6,
    hour: 17,
    durationMin: 150,
    breakMin: 8,
    game: "PLO",
    stakes: "2/5",
    venue: "The Bike",
    buyIn: 1000,
    cashOut: 220,
    tips: 5,
    notes: "Ran it twice and lost both. That's PLO.",
  },
  {
    kind: "tournament",
    daysAgo: 3,
    hour: 13,
    durationMin: 410,
    breakMin: 50,
    game: "NLH",
    stakes: "$250",
    venue: "Commerce",
    buyIn: 230,
    fees: 20,
    prize: 1850,
    placement: 2,
    fieldSize: 112,
    notes: "Heads-up deal after a long bubble.",
  },
  {
    kind: "cash",
    daysAgo: 1,
    hour: 18,
    durationMin: 165,
    breakMin: 15,
    game: "NLH",
    stakes: "1/2",
    venue: "Commerce",
    buyIn: 300,
    cashOut: 515,
    tips: 10,
    notes: "Short session before dinner. One big bluff got through.",
  },
];

async function main() {
  const email = "demo@7deuce.app";
  const passwordHash = await bcrypt.hash("poker123", 10);

  await db.pokerSession.deleteMany({ where: { user: { email } } });
  await db.user.deleteMany({ where: { email } });

  const user = await db.user.create({
    data: {
      email,
      name: "Demo",
      passwordHash,
    },
  });

  for (const session of sessions) {
    const startedAt = new Date();
    startedAt.setHours(session.hour, 10, 0, 0);
    startedAt.setDate(startedAt.getDate() - session.daysAgo);
    const endedAt = new Date(startedAt.getTime() + (session.durationMin + session.breakMin) * 60000);
    const money = {
      kind: session.kind,
      buyIn: session.buyIn,
      cashOut: session.cashOut ?? 0,
      tips: session.tips ?? 0,
      fees: session.fees ?? 0,
      prize: session.prize ?? 0,
    };

    await db.pokerSession.create({
      data: {
        userId: user.id,
        kind: session.kind,
        status: "completed",
        startedAt,
        endedAt,
        durationMin: session.durationMin,
        breakMin: session.breakMin,
        game: session.game,
        stakes: session.stakes,
        venue: session.venue,
        buyIn: session.buyIn,
        cashOut: session.cashOut ?? 0,
        tips: session.tips ?? 0,
        fees: session.fees ?? 0,
        prize: session.prize ?? 0,
        placement: session.placement ?? null,
        fieldSize: session.fieldSize ?? null,
        net: computeNet(money),
        notes: session.notes,
      },
    });
  }

  console.log(`Seeded ${email} with ${sessions.length} sessions`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
