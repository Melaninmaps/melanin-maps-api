import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessesRouter from "./businesses";
import travelRouter from "./travel";
import surveysRouter from "./surveys";
import savedPlacesRouter from "./saved-places";
import alertsRouter from "./alerts";
import moderationRouter from "./moderation";
import safetyContextRouter from "./safety-context";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(businessesRouter);
router.use(travelRouter);
router.use(surveysRouter);
router.use(savedPlacesRouter);
router.use(alertsRouter);
router.use(moderationRouter);
router.use(safetyContextRouter);
router.use(stripeRouter);

export default router;
