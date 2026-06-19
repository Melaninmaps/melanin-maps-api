import { Router, type IRouter, type Request, type Response } from "express";
import { db, contactMessagesTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/contact", async (req: Request, res: Response) => {
  try {
    const { formType, name, email, subject, message } = req.body as {
      formType?: string;
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!formType || !name?.trim() || !email?.includes("@") || !message || message.trim().length < 20) {
      res.status(400).json({ error: "formType, name, email, and message (min 20 chars) are required" });
      return;
    }

    await db.insert(contactMessagesTable).values({
      formType,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject?.trim() ?? null,
      message: message.trim(),
    });

    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save contact message");
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
