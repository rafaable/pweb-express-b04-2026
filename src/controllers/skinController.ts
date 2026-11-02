import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { Rarity } from "../generated/prisma/enums";
import { HttpError } from "../utils/http-error";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";

// GET /api/skins
export const getAllSkins = async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);

  const where: { heroId?: number; rarity?: Rarity } = {};

  if (typeof req.query.heroId === "string" && req.query.heroId !== "") {
    where.heroId = parseId(req.query.heroId);
  }

  if (typeof req.query.rarity === "string" && req.query.rarity !== "") {
    const rarity = req.query.rarity.trim().toUpperCase();
    if (!Object.values(Rarity).includes(rarity as Rarity)) {
      throw new HttpError(400, `rarity harus salah satu dari: ${Object.values(Rarity).join(", ")}`);
    }
    where.rarity = rarity as Rarity;
  }

  const [skins, total] = await prisma.$transaction([
    prisma.skin.findMany({
      where,
      include: { hero: { select: { name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.skin.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data skin", skins, {
    currentPage: page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
  });
};

// GET /api/skins/:skin_id
export const getSkinById = async (req: Request, res: Response) => {
  const skinId = parseId(req.params.skin_id);

  const skin = await prisma.skin.findUnique({
    where: { id: skinId },
    include: { hero: true },
  });

  if (!skin) {
    throw new HttpError(404, "Skin tidak ditemukan");
  }

  sendSuccess(res, 200, "Berhasil mengambil data skin", skin);
};
