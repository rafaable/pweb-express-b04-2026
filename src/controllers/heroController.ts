import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";
import type { Role, Lane } from "../generated/prisma/client";

// GET /api/heroes
export const getAllHeroes = async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const role = typeof req.query.role === "string" ? req.query.role.trim().toUpperCase() : undefined;

  const where: Record<string, unknown> = {};

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (role) {
    where.role = role as Role;
  }

  const [heroes, total] = await prisma.$transaction([
    prisma.hero.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.hero.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data hero", heroes, {
    currentPage: page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
  });
};

// GET /api/heroes/:hero_id
export const getHeroById = async (req: Request, res: Response) => {
  const heroId = parseId(req.params.hero_id);

  const hero = await prisma.hero.findUnique({
    where: { id: heroId },
    include: {
      skins: true,
    },
  });

  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  sendSuccess(res, 200, "Berhasil mengambil data hero", hero);
};

// POST /api/heroes
export const createHero = async (req: Request, res: Response) => {
  const { name, role, lane, releaseYear, priceBP, priceDiamond } = req.body ?? {};

  // 1. Validasi field wajib
  if (!name || !role || !lane || releaseYear === undefined || releaseYear === null) {
    throw new HttpError(400, "name, role, lane, dan releaseYear wajib diisi");
  }

  // 2. Cek apakah nama hero sudah ada
  const existingHero = await prisma.hero.findUnique({
    where: { name: String(name).trim() },
  });

  if (existingHero) {
    throw new HttpError(409, "Hero dengan nama tersebut sudah ada");
  }

  // 3. Simpan hero baru
  const newHero = await prisma.hero.create({
    data: {
      name: String(name).trim(),
      role: role as Role,
      lane: lane as Lane,
      releaseYear: Number(releaseYear),
      priceBP: priceBP !== undefined && priceBP !== null ? Number(priceBP) : null,
      priceDiamond: priceDiamond !== undefined && priceDiamond !== null ? Number(priceDiamond) : null,
    },
  });

  sendSuccess(res, 201, "Hero berhasil ditambahkan", newHero);
};
