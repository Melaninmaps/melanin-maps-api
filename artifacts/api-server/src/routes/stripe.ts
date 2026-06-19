import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const comingSoon = (_req: Request, res: Response) => {
  res.status(503).json({ error: "Payments coming soon" });
};

router.get("/stripe/products", comingSoon);
router.get("/stripe/subscription", comingSoon);
router.post("/stripe/checkout", comingSoon);
router.post("/stripe/portal", comingSoon);
router.post("/stripe/webhook", comingSoon);

export default router;
