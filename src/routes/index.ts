import { Router } from "express";
import heroRouter from "./hero.routes";
import playerRouter from "./player.routes";
import skinRouter from "./skin.routes";
import statisticsRouter from "./statistics.routes";

const router = Router();

router.use("/heroes", heroRouter);
router.use("/skins", skinRouter);
router.use("/players", playerRouter);
router.use("/statistics", statisticsRouter);

export default router;