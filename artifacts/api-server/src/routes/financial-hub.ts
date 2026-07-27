import { Router, type IRouter, type Request, type Response } from "express";
import { db, financialGoalsTable, financialCheckinsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// ── Curated financial literacy resources ──────────────────────────────────────
const FINANCIAL_RESOURCES = [
  { title: "Consumer Financial Protection Bureau (CFPB)", url: "https://www.consumerfinance.gov", description: "Free tools for budgeting, credit reports, debt management, and consumer rights.", category: "budgeting" },
  { title: "MyMoney.gov", url: "https://www.mymoney.gov", description: "Official federal financial literacy resources — saving, investing, credit, homeownership.", category: "literacy" },
  { title: "AnnualCreditReport.com", url: "https://www.annualcreditreport.com", description: "Get your free credit reports from all three bureaus once per year.", category: "credit" },
  { title: "Credit Karma", url: "https://www.creditkarma.com", description: "Free credit score monitoring and personalized financial recommendations.", category: "credit" },
  { title: "National Foundation for Credit Counseling (NFCC)", url: "https://www.nfcc.org", description: "Free and low-cost credit counseling, debt management, and housing counseling.", category: "debt" },
  { title: "Investopedia", url: "https://www.investopedia.com", description: "Plain-language financial education: investing, budgeting, retirement, taxes.", category: "investing" },
  { title: "Khan Academy — Personal Finance", url: "https://www.khanacademy.org/college-careers-more/personal-finance", description: "Free personal finance courses — taxes, budgeting, retirement, and more.", category: "literacy" },
  { title: "FDIC Money Smart", url: "https://www.fdic.gov/resources/consumers/money-smart", description: "Free financial education program from the federal government.", category: "literacy" },
  { title: "Minority Deposit Institution (MDI) Finder", url: "https://www.fdic.gov/resources/resolutions/bank-failures/failed-bank-list/banklist.html", description: "Find minority-owned banks and credit unions in your area.", category: "banking" },
  { title: "Operation HOPE", url: "https://www.operationhope.org", description: "Financial empowerment and coaching for underserved communities, including credit and small business support.", category: "empowerment" },
];

// ── GET /financial/resources ──────────────────────────────────────────────────
router.get("/financial/resources", (_req, res) => res.json({ resources: FINANCIAL_RESOURCES }));

// ── GET /financial/goals ──────────────────────────────────────────────────────
router.get("/financial/goals", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const goals = await db.select().from(financialGoalsTable)
      .where(eq(financialGoalsTable.userId, req.user.id))
      .orderBy(desc(financialGoalsTable.createdAt));
    res.json({ goals });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch financial goals");
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// ── POST /financial/goals ─────────────────────────────────────────────────────
router.post("/financial/goals", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { type, title, description, targetAmount, deadline, motivationNote, isPrivate } = req.body as Record<string, any>;
  if (!type || !title?.trim() || !targetAmount) { res.status(400).json({ error: "type, title, and targetAmount are required" }); return; }

  const validTypes = ["savings", "debt_payoff", "investment", "emergency_fund", "business", "education", "home", "other"];
  if (!validTypes.includes(type)) { res.status(400).json({ error: "Invalid goal type" }); return; }

  try {
    const [goal] = await db.insert(financialGoalsTable).values({
      userId: req.user.id,
      type,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      targetAmount: String(parseFloat(String(targetAmount))),
      deadline: deadline ? String(deadline) : null,
      motivationNote: motivationNote ? String(motivationNote).trim() : null,
      isPrivate: isPrivate !== false,
      milestones: [],
    }).returning();
    res.json({ goal });
  } catch (err) {
    req.log.error({ err }, "Failed to create financial goal");
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// ── POST /financial/goals/:id/checkin ─────────────────────────────────────────
router.post("/financial/goals/:id/checkin", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  const { amount, note } = req.body as { amount: number; note?: string };
  if (!amount || isNaN(Number(amount))) { res.status(400).json({ error: "amount is required" }); return; }

  try {
    const [goal] = await db.select().from(financialGoalsTable)
      .where(and(eq(financialGoalsTable.id, id), eq(financialGoalsTable.userId, req.user.id))).limit(1);
    if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }

    const newCurrent = parseFloat(String(goal.currentAmount)) + parseFloat(String(amount));
    const isAchieved = newCurrent >= parseFloat(String(goal.targetAmount));

    await Promise.all([
      db.update(financialGoalsTable).set({
        currentAmount: String(newCurrent),
        isAchieved,
        updatedAt: new Date(),
      }).where(eq(financialGoalsTable.id, id)),
      db.insert(financialCheckinsTable).values({
        userId: req.user.id,
        goalId: id,
        amount: String(parseFloat(String(amount))),
        note: note ? String(note).trim() : null,
      }),
    ]);

    res.json({ currentAmount: newCurrent, isAchieved, progress: Math.min(100, (newCurrent / parseFloat(String(goal.targetAmount))) * 100) });
  } catch (err) {
    req.log.error({ err }, "Failed to add financial check-in");
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// ── PATCH /financial/goals/:id ────────────────────────────────────────────────
router.patch("/financial/goals/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const [existing] = await db.select({ userId: financialGoalsTable.userId })
      .from(financialGoalsTable).where(eq(financialGoalsTable.id, id)).limit(1);
    if (!existing || existing.userId !== req.user.id) { res.status(404).json({ error: "Not found" }); return; }

    const { title, targetAmount, deadline, motivationNote, isAchieved } = req.body as Record<string, any>;
    await db.update(financialGoalsTable).set({
      ...(title ? { title: String(title).trim() } : {}),
      ...(targetAmount !== undefined ? { targetAmount: String(parseFloat(String(targetAmount))) } : {}),
      ...(deadline !== undefined ? { deadline: String(deadline) } : {}),
      ...(motivationNote !== undefined ? { motivationNote: String(motivationNote).trim() } : {}),
      ...(isAchieved !== undefined ? { isAchieved: Boolean(isAchieved) } : {}),
      updatedAt: new Date(),
    }).where(eq(financialGoalsTable.id, id));
    res.json({ updated: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update financial goal");
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// ── DELETE /financial/goals/:id ───────────────────────────────────────────────
router.delete("/financial/goals/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db.delete(financialGoalsTable)
      .where(and(eq(financialGoalsTable.id, id), eq(financialGoalsTable.userId, req.user.id)));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete goal");
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// ── GET /financial/goals/:id/history ─────────────────────────────────────────
router.get("/financial/goals/:id/history", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const history = await db.select().from(financialCheckinsTable)
      .where(and(eq(financialCheckinsTable.goalId, id), eq(financialCheckinsTable.userId, req.user.id)))
      .orderBy(desc(financialCheckinsTable.createdAt)).limit(50);
    res.json({ history });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch goal history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
