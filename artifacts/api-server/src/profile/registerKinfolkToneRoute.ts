import { type Express, type Request, type Response } from "express";
import type { ToneStyle } from "../kinfolk/capabilities/types";

type AuthenticatedRequest = Request & { user?: { id: string } };
const VALID_TONES: ToneStyle[] = ["warm_standard", "community_conversational", "concise_professional"];

type Queryable = {
  query(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export function registerKinfolkToneRoute(app: Express, db: Queryable): void {
  app.put("/api/profile/kinfolk-tone", async (request: AuthenticatedRequest, response: Response) => {
    if (!request.user?.id) return response.status(401).json({ error: "Sign in is required to save a Kinfolk preference." });
    const toneStyle = request.body?.toneStyle as ToneStyle | undefined;
    if (!toneStyle || !VALID_TONES.includes(toneStyle)) {
      return response.status(400).json({ error: "Choose a valid Kinfolk tone preference." });
    }

    await db.query(`UPDATE users SET kinfolk_tone = $1 WHERE id = $2`, [toneStyle, request.user.id]);
    return response.status(200).json({ toneStyle });
  });
}
