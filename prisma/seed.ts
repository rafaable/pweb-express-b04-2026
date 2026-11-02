import fs from "fs";
import path from "path";
import prisma from "../src/config/prisma";

async function main() {
  console.log("Seeding database...");

  // 1. Kosongkan semua tabel dengan raw query
  await prisma.$executeRawUnsafe(
    'TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE;'
  );

  // 2. Baca data/heroes.json dan masukkan dengan createMany
  const heroesData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "data/heroes.json"), "utf8")
  );
  await prisma.hero.createMany({
    data: heroesData,
  });
  console.log(`Seeded ${heroesData.length} heroes.`);

  // 3. Baca data/skins.json dan masukkan dengan createMany
  const skinsData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "data/skins.json"), "utf8")
  );
  await prisma.skin.createMany({
    data: skinsData,
  });
  console.log(`Seeded ${skinsData.length} skins.`);

  // 4. Masukkan 3 player
  await prisma.player.createMany({
    data: [
      { id: 1, nickname: "ArekITS", bp: 1500, diamond: 75 },
      { id: 2, nickname: "SangPushRank", bp: 13000, diamond: 2892 },
      { id: 3, nickname: "MageSurabaya", bp: 10000, diamond: 0 },
    ],
  });
  // id diisi manual, jadi sequence harus disusulkan agar player baru tidak bentrok
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Player"', 'id'), (SELECT MAX(id) FROM "Player"))`;
  console.log("Seeded 3 players.");

  // 5. Masukkan data awal PlayerHero
  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: "BP", pricePaid: 2000 },
      { playerId: 1, heroId: 1, currency: "BP", pricePaid: 10800 },
      { playerId: 2, heroId: 84, currency: "DIAMOND", pricePaid: 599 },
      { playerId: 2, heroId: 56, currency: "BP", pricePaid: 32000 },
    ],
  });
  console.log("Seeded player heroes.");

  console.log("Database seed completed successfully! 🌟");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
