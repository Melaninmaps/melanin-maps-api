import { rateLimit } from "express-rate-limit";
import type { Request } from "express";

// Key by authenticated member ID when available; fall back to IP for unauthenticated
// requests. Without this, 30 members sharing one egress IP exhaust a single 200-request
// bucket and trigger 429s before any individual has made more than ~6 requests.
// authMiddleware runs before generalLimiter in app.ts, so req.user is always populated
// by the time this key function executes on authenticated routes.
function memberKeyGenerator(req: Request): string {
  return (req.user?.id ?? req.ip ?? "unknown") as string;
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  keyGenerator: memberKeyGenerator,
  // KinfolkAI has its own token-bucket queue that manages concurrency and back-pressure
  // for the OpenAI integration. Passing Kinfolk requests through the general limiter
  // first blocks that queue before it can operate, causing premature 429s before
  // Kinfolk's own per-user limits and retry logic have a chance to run.
  // req.path is relative to the /api mount point, so /api/kinfolk/chat → /kinfolk/chat.
  skip: (req: Request) => req.path.startsWith("/kinfolk"),
});

export const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many waitlist submissions. Please try again later." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many auth requests, please try again later." },
});

export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "You can submit up to 5 reviews per hour. Please wait before submitting another." },
});

export const surveyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "You can submit up to 10 safety reports per hour. Please try again later." },
});

export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many reports submitted. Please try again later." },
});

export const mapsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many map requests. Please try again later." },
});
