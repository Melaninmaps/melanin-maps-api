import { Router, type IRouter, type Request, type Response } from "express";
import { db, contactMessagesTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/submit-business", async (req: Request, res: Response) => {
  try {
    const { name, category, city, state, website, phone, description, submitterEmail } = req.body as {
      name?: string;
      category?: string;
      city?: string;
      state?: string;
      website?: string;
      phone?: string;
      description?: string;
      submitterEmail?: string;
    };

    if (!name?.trim() || !city?.trim() || !state?.trim()) {
      res.status(400).json({ error: "Business name, city, and state are required." });
      return;
    }

    const message = [
      `Business Name: ${name.trim()}`,
      `Category: ${category?.trim() || "—"}`,
      `City: ${city.trim()}`,
      `State: ${state.trim()}`,
      `Website: ${website?.trim() || "—"}`,
      `Phone: ${phone?.trim() || "—"}`,
      `Submitter Email: ${submitterEmail?.trim() || "—"}`,
      "",
      `Description: ${description?.trim() || "—"}`,
    ].join("\n");

    await db.insert(contactMessagesTable).values({
      formType: "business_submission",
      name: name.trim(),
      email: submitterEmail?.trim() || "anonymous@mappingwithmelanin.com",
      subject: `New Business Submission: ${name.trim()} — ${city.trim()}, ${state.trim()}`,
      message,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save business submission");
    res.status(500).json({ error: "Failed to submit business. Please try again." });
  }
});

export default router;
