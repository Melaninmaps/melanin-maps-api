import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessesRouter from "./businesses";
import travelRouter from "./travel";
import surveysRouter from "./surveys";
import savedPlacesRouter from "./saved-places";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(businessesRouter);
router.use(travelRouter);
router.use(surveysRouter);
router.use(savedPlacesRouter);

export default router;
