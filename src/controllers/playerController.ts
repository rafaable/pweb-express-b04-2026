import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";

const MATCH_REWARD = { WIN: 300, LOSE: 100 } as const;

// Mata uang yang boleh dipakai untuk beli hero
const CURRENCIES = ["BP", "DIAMOND"] as const;
type CurrencyValue = (typeof CURRENCIES)[number];

const isCurrency = (value: unknown): value is CurrencyValue =>
  typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);

// Nickname harus string tidak kosong; selain itu 400.
const parseNickname = (value: unknown): string => {
  const nickname = typeof value === "string" ? value.trim() : "";
  if (!nickname) {
    throw new HttpError(400, "nickname wajib diisi");
  }
  return nickname;
};

// POST /api/players
export const createPlayer = async (req: Request, res: Response) => {
  const nickname = parseNickname(req.body?.nickname);

  const existing = await prisma.player.findUnique({ where: { nickname } });
  if (existing) {
    throw new HttpError(409, "Nickname sudah dipakai");
  }

  // bp (10000) dan diamond (0) terisi otomatis dari default schema
  const player = await prisma.player.create({ data: { nickname } });

  sendSuccess(res, 201, "Player berhasil dibuat", player);
};

// GET /api/players/:player_id
export const getPlayerById = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id);

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      heroes: {
        include: { hero: { select: { name: true } } },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const { heroes, ...rest } = player;
  sendSuccess(res, 200, "Berhasil mengambil data player", {
    ...rest,
    heroes: heroes.map((ph) => ({
      heroId: ph.heroId,
      name: ph.hero.name,
      currency: ph.currency,
      pricePaid: ph.pricePaid,
    })),
  });
};

// PATCH /api/players/:player_id
export const updatePlayer = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const nickname = parseNickname(req.body?.nickname);

  const taken = await prisma.player.findUnique({ where: { nickname } });
  if (taken && taken.id !== playerId) {
    throw new HttpError(409, "Nickname sudah dipakai player lain");
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { nickname },
  });

  sendSuccess(res, 200, "Nickname berhasil diubah", updated);
};

// DELETE /api/players/:player_id
export const deletePlayer = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  // PlayerHero ikut terhapus lewat onDelete: Cascade di schema
  await prisma.player.delete({ where: { id: playerId } });

  sendSuccess(res, 200, "Player berhasil dihapus");
};

// POST /api/players/:player_id/topup
export const topUp = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id);
  const amount = req.body?.amount;

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "amount harus bilangan bulat lebih dari 0");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { diamond: { increment: amount } },
  });

  sendSuccess(res, 200, "Top up berhasil", { playerId, amount, diamond: updated.diamond });
};

// POST /api/players/:player_id/matches
export const playMatch = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id);
  const result: unknown = req.body?.result;

  if (result !== "WIN" && result !== "LOSE") {
    throw new HttpError(400, "result harus WIN atau LOSE");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const bpEarned = MATCH_REWARD[result];
  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { bp: { increment: bpEarned } },
  });

  sendSuccess(res, 200, "Match berhasil dicatat", { playerId, result, bpEarned, bp: updated.bp });
};

// POST /api/players/:player_id/heroes  (Fitur 6: Beli Hero)
export const buyHero = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id);
  const { heroId, currency } = req.body ?? {};

  // Cek 1: heroId kosong / currency bukan BP atau DIAMOND -> 400
  if (typeof heroId !== "number" || !Number.isInteger(heroId) || heroId <= 0) {
    throw new HttpError(400, "heroId wajib diisi dengan bilangan bulat positif");
  }
  if (!isCurrency(currency)) {
    throw new HttpError(400, "currency harus BP atau DIAMOND");
  }

  // Cek 2: player tidak ditemukan -> 404
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  // Cek 3: hero tidak ditemukan -> 404
  const hero = await prisma.hero.findUnique({ where: { id: heroId } });
  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  // Cek 4: harga hero untuk currency tersebut kosong (null) -> 400
  const price = currency === "BP" ? hero.priceBP : hero.priceDiamond;
  if (price === null) {
    throw new HttpError(400, `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`);
  }

  // Cek 5: player sudah memiliki hero tersebut -> 409
  const owned = await prisma.playerHero.findUnique({
    where: { playerId_heroId: { playerId, heroId } },
  });
  if (owned) {
    throw new HttpError(409, `Player sudah memiliki hero ${hero.name}`);
  }

  // Cek 6: saldo player kurang dari harga hero -> 400
  const balance = currency === "BP" ? player.bp : player.diamond;
  if (balance < price) {
    throw new HttpError(400, `Saldo ${currency} tidak cukup untuk membeli hero ${hero.name}`);
  }

  // Transaction: kurangi saldo + catat PlayerHero, keduanya berhasil bareng atau gagal bareng
  const [updatedPlayer] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data:
        currency === "BP"
          ? { bp: { decrement: price } }
          : { diamond: { decrement: price } },
      select: { bp: true, diamond: true },
    }),
    prisma.playerHero.create({
      data: { playerId, heroId, currency, pricePaid: price },
    }),
  ]);

  sendSuccess(res, 201, "Hero berhasil dibeli", {
    hero: { id: hero.id, name: hero.name },
    currency,
    pricePaid: price,
    balance: { bp: updatedPlayer.bp, diamond: updatedPlayer.diamond },
  });
};