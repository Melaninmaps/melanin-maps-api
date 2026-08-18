import type { Express, NextFunction, Request, Response } from "express";
import type { ApprovedBusinessPublisher, SubmissionRepository } from "./submissionRepository";
import { validateSubmission } from "./types";

type RequestWithMember = Request & { member?: { id: string; role: string } };
const requireFounder = (request: RequestWithMember) => {
  if (!request.member || !["founder", "admin"].includes(request.member.role)) throw Object.assign(new Error("FOUNDER_ACCESS_REQUIRED"), { status: 403 });
  return request.member;
};

export function registerSubmissionRoutes(app: Express, repository: SubmissionRepository, publisher: ApprovedBusinessPublisher) {
  app.post("/api/community/business-submissions", async (request: RequestWithMember, response: Response, next: NextFunction) => {
    try {
      const submission = validateSubmission(request.body);
      const result = await repository.create(submission, request.member?.id);
      return response.status(201).json({ ...result, message: "Thank you. Your submission is now in the founder review queue." });
    } catch (error) { return next(error); }
  });

  app.get("/api/founder/business-submissions", async (request: RequestWithMember, response: Response, next: NextFunction) => {
    try { requireFounder(request); return response.json({ submissions: await repository.list((request.query.status as never) ?? "pending_review") }); }
    catch (error) { return next(error); }
  });

  app.post("/api/founder/business-submissions/:id/decision", async (request: RequestWithMember, response: Response, next: NextFunction) => {
    try {
      const founder = requireFounder(request);
      const decision = request.body?.decision;
      if (!["approved", "declined", "needs_more_info"].includes(decision)) throw Object.assign(new Error("VALID_DECISION_REQUIRED"), { status: 400 });
      const result = await repository.decide(request.params.id, founder.id, decision, typeof request.body?.reviewNote === "string" ? request.body.reviewNote.slice(0, 1500) : undefined, publisher);
      return response.json(result);
    } catch (error) { return next(error); }
  });
}
