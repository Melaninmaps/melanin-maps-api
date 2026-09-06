import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request } from "express";

/**
 * Normal authenticated browsing must be isolated by the stable member ID,
 * not by a hotel/office/VPN/shared-home IP address.  Login and other
 * unauthenticated abuse-sensitive routes remain IP limited separately.
 *
 * authMiddleware runs before this limiter in app.ts and sets req.user.
 * ipKeyGenerator is required for the unauthenticated fallback so IPv6
 * addresses are normalized safely by express-rate-limit.
 */
function generalApiKey(req: Request): string {
  const memberId = req.user?.id;
  if (memberId) return `member:${memberId}`;
  return `ip:${ipKeyGenerator(req.ip || "unknown")}`;
}

function isAuthRoute(req: Request): boolean {
  // generalLimiter is mounted at /api, therefore req.path is /auth/... here.
  return req.path === "/auth" || req.path.startsWith("/auth/");
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: generalApiKey,
  // Auth routes are protected by authLimiter in app.ts and must never consume
  // a signed-in member's general browsing budget.
  // KinfolkAI has its own token-bucket queue; skip it here too.
  skip: (req: Request) => isAuthRoute(req) || req.path.startsWith("/kinfolk"),
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests, please try again later.",
      code: "GENERAL_MEMBER_RATE_LIMITED",
      retryAfterSeconds: 15 * 60,
    });
  },
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
  // 60 allows 30-account concurrent audit tests (all from the same IP) without
  // triggering the limiter. Still guards against brute-force: 60 req / 15 min.
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip || "unknown")}`,
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

export const businessSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  keyGenerator: generalApiKey,
  handler: (_req, res) => {
    res.status(429).json({
      error: "You can submit up to 20 community businesses per hour. Please try again later.",
      code: "BUSINESS_SUBMISSION_RATE_LIMITED",
      retryAfterSeconds: 60 * 60,
    });
  },
});


export const libraryResearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: generalApiKey,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Live Library research is temporarily rate limited. Please try again shortly.",
      code: "LIBRARY_RESEARCH_RATE_LIMITED",
      retryAfterSeconds: 15 * 60,
    });
  },
});
