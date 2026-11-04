import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { sendSuccess } from "../utils/response";

// GET /api/statistics  (Fitur 7: Statistik)
export const getStatistics = async (_req: Request, res: Response) => {
  // Lima query dijalankan bersamaan supaya lebih cepat
  const [totalPlayers, totalHeroesOwned, diamondSum, topOwned, perRole] =
    await Promise.all([
      // 1. Jumlah player
      prisma.player.count(),

      // 2. Jumlah data di tabel PlayerHero
      prisma.playerHero.count(),

      // 3. Total saldo Diamond semua player
      prisma.player.aggregate({ _sum: { diamond: true } }),

      // 4. Hero yang paling banyak dimiliki (kalau seri, id terkecil menang)
      prisma.playerHero.groupBy({
        by: ["heroId"],
        _count: { heroId: true },
        orderBy: [{ _count: { heroId: "desc" } }, { heroId: "asc" }],
        take: 1,
      }),

      // 5. Jumlah hero untuk setiap role
      prisma.hero.groupBy({
        by: ["role"],
        _count: { role: true },
        orderBy: [{ _count: { role: "desc" } }, { role: "asc" }],
      }),
    ]);

  // mostOwnedHero butuh nama hero, jadi cari dulu di tabel Hero.
  // Kalau belum ada yang membeli hero sama sekali, hasilnya null.
  let mostOwnedHero: { heroId: number; name: string; owners: number } | null = null;
  const top = topOwned[0];
  if (top) {
    const hero = await prisma.hero.findUnique({
      where: { id: top.heroId },
      select: { name: true },
    });
    mostOwnedHero = {
      heroId: top.heroId,
      name: hero?.name ?? "",
      owners: top._count.heroId,
    };
  }

  sendSuccess(res, 200, "Berhasil mengambil statistik", {
    totalPlayers,
    totalHeroesOwned,
    totalDiamond: diamondSum._sum.diamond ?? 0,
    mostOwnedHero,
    heroesPerRole: perRole.map((r) => ({ role: r.role, total: r._count.role })),
  });
};