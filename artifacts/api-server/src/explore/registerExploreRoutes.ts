import { type Express, type Request, type Response } from "express";
import { buildPurposefulExplorePlan } from "./explorePlanner";

export function registerExploreRoutes(app: Express): void {
  app.post("/api/explore/plan", async (request: Request, response: Response) => {
    const prompt = typeof request.body?.prompt === "string" ? request.body.prompt.trim() : "";
    if (prompt.length < 3) {
      return response.status(400).json({ error: "Describe the experience you want to explore." });
    }
    try {
      const plan = await buildPurposefulExplorePlan(prompt);
      return response.status(200).json(plan);
    } catch (error) {
      console.error("Explore plan failed", error);
      return response.status(502).json({ error: "We could not build an exploration plan right now." });
    }
  });
}
