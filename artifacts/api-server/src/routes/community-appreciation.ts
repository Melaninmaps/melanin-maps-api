import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityAppreciationsTable, businessBadgesTable, businessesTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const BADGE_THRESHOLD = 3;

const BADGE_RULES: { id: string; tags: string[] }[] = [
  { id: "community_welcomed",    tags: ["Made me feel welcome", "A comfortable, familiar space", "Inclusive and welcoming environment"] },
  { id: "respect_in_action",     tags: ["Exceptional service from the team", "Created a truly positive experience"] },
  { id: "community_favorite",    tags: ["I'd happily recommend this business"] },
  { id: "accessibility_champion",tags: ["Excellent accessibility and accommodations"] },
  { id: "family_friendly",       tags: ["Great place for families"] },
  { id: "inclusive_workplace",   tags: ["Great place to work"] },
  { id: "community_connector",   tags: ["Thank you for supporting our community", "Actively supports local events and orgs"] },
];

async function computeAndAwardBadges(businessId: string): Promise<string[]> {
  const newlyEarned: string[] = [];
  for (const rule of BADGE_RULES) {
    const tagList = rule.tags.map((_, i) => `$${i + 2}`).join(", ");
    const result = await pool.query<{ cnt: string }>(
      `SELECT COUNT(DISTINCT user_id)::text AS cnt
         FROM community_appreciations
        WHERE business_id = $1
          AND share_preference != 'private'
          AND EXISTS (
            SELECT 1 FROM unnest(recognition_tags) AS t(tag)
            WHERE t.tag = ANY(ARRAY[${tagList}])
          )`,
      [businessId, ...rule.tags]
    );
    const count = parseInt(result.rows[0]?.cnt ?? "0", 10);

    await pool.query(
      `INSERT INTO business_badges (business_id, badge_id, appreciation_count, last_updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (business_id, badge_id)
       DO UPDATE SET appreciation_count = $3, last_updated_at = NOW(),
                     earned_at = CASE
                       WHEN business_badges.earned_at IS NULL AND $3 >= $4 THEN NOW()
                       ELSE business_badges.earned_at
                     END`,
      [businessId, rule.id, count, BADGE_THRESHOLD]
    );

    if (count === BADGE_THRESHOLD) {
      newlyEarned.push(rule.id);
    }
  }
  return newlyEarned;
}

async function sendAppreciationEmail(opts: {
  businessName: string;
  sharePreference: string;
  authorName: string;
  recognitionTags: string[];
  encouragementTags: string[];
  appreciationNote: string | null;
  reviewText: string | null;
  commentOption: string | null;
  newBadges: string[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { businessName, sharePreference, authorName, recognitionTags, encouragementTags, appreciationNote, reviewText, commentOption, newBadges } = opts;

  const BADGE_META: Record<string, { emoji: string; label: string; description: string }> = {
    community_welcomed:    { emoji: "🏆", label: "Community Welcomed",    description: "Consistently reported as a welcoming environment." },
    respect_in_action:     { emoji: "🤝", label: "Respect in Action",     description: "Frequently recognized for respectful customer service." },
    community_favorite:    { emoji: "🌟", label: "Community Favorite",    description: "Highly recommended by community members." },
    accessibility_champion:{ emoji: "♿", label: "Accessibility Champion", description: "Frequently praised for accessibility and accommodations." },
    family_friendly:       { emoji: "👨‍👩‍👧", label: "Family Friendly",    description: "Consistently recognized by families." },
    inclusive_workplace:   { emoji: "💼", label: "Inclusive Workplace",   description: "Based on employee feedback over time." },
    community_connector:   { emoji: "🌍", label: "Community Connector",   description: "Frequently supports local events and organizations." },
  };

  const isAnon = sharePreference === "anonymous";
  const fromLine = isAnon
    ? "A community member shared the following appreciation — anonymously."
    : `<strong>${authorName}</strong> wanted to share the following appreciation with you.`;

  const newBadgesHtml = newBadges.length > 0
    ? `<div style="background:#FBF7F0;border:2px solid #CA922B;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="font-weight:700;color:#CA922B;margin:0 0 12px;font-size:15px;">🤎 Community Recognition Unlocked</p>
        ${newBadges.map(id => {
          const m = BADGE_META[id];
          return m ? `<div style="margin-bottom:10px;">
            <span style="font-size:20px;">${m.emoji}</span>
            <strong style="color:#3A1F0E;"> ${m.label}</strong>
            <p style="color:#666;font-size:12px;margin:2px 0 0;">${m.description}</p>
          </div>` : "";
        }).join("")}
      </div>`
    : "";

  const recogHtml = recognitionTags.length > 0
    ? `<div style="margin:16px 0;">
        <p style="font-weight:600;color:#3A1F0E;margin:0 0 10px;">🌟 Recognition</p>
        <ul style="margin:0;padding-left:20px;color:#3A1F0E;">
          ${recognitionTags.map(t => `<li style="margin-bottom:6px;">${t}</li>`).join("")}
        </ul>
      </div>`
    : "";

  const encHtml = encouragementTags.length > 0
    ? `<div style="margin:16px 0;">
        <p style="font-weight:600;color:#3A1F0E;margin:0 0 10px;">💡 Encouragement</p>
        <ul style="margin:0;padding-left:20px;color:#3A1F0E;">
          ${encouragementTags.map(t => `<li style="margin-bottom:6px;">${t}</li>`).join("")}
        </ul>
      </div>`
    : "";

  let commentHtml = "";
  if (reviewText && commentOption) {
    commentHtml = `<div style="margin:16px 0;">
        <p style="font-weight:600;color:#3A1F0E;margin:0 0 10px;">📝 Written Feedback</p>
        <blockquote style="border-left:3px solid #CA922B;padding:10px 16px;margin:0;color:#3A1F0E;background:#FBF7F0;border-radius:0 8px 8px 0;">
          "${commentOption === "summarize" ? "(Summarized) " : ""}${reviewText}"
        </blockquote>
      </div>`;
  }

  const noteHtml = appreciationNote
    ? `<div style="margin:16px 0;">
        <p style="font-weight:600;color:#3A1F0E;margin:0 0 10px;">🤎 Note of Appreciation</p>
        <blockquote style="border-left:3px solid #CA922B;padding:10px 16px;margin:0;color:#3A1F0E;background:#FBF7F0;border-radius:0 8px 8px 0;">
          "${appreciationNote}"
        </blockquote>
      </div>`
    : "";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Mapping With Melanin™ <hello@send.mappingwithmelanin.com>",
      to: ["hello@mappingwithmelanin.com"],
      subject: `🤎 Community Appreciation for ${businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FAF6EF;">
          <div style="background:#2B1507;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center;">
            <p style="color:#CA922B;font-size:12px;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;text-transform:uppercase;">Mapping With Melanin™</p>
            <h1 style="color:white;font-size:22px;margin:0;">🤎 Community Appreciation</h1>
          </div>
          <div style="background:white;border-radius:16px;padding:24px;border:1px solid #E8D5B7;margin-bottom:16px;">
            <p style="color:#3A1F0E;font-size:15px;margin:0 0 12px;">
              A member of the <strong>Mapping With Melanin™</strong> community wanted to recognize <strong>${businessName}</strong>.
            </p>
            <p style="color:#3A1F0E;font-size:14px;margin:0 0 16px;">${fromLine}</p>
            ${recogHtml}${encHtml}${commentHtml}${noteHtml}
          </div>
          ${newBadgesHtml}
          <div style="background:#FBF7F0;border-radius:12px;padding:16px;border:1px solid #E8D5B7;text-align:center;">
            <p style="color:#3A1F0E;font-size:12px;margin:0;">
              Submitted by a verified Mapping With Melanin™ community member.
              Businesses that receive consistent recognition earn Community Recognition Badges — earned by the community, not the platform.
            </p>
          </div>
          <p style="color:#aaa;font-size:11px;margin-top:20px;text-align:center;">Mapping With Melanin™ — Community Discovery Platform</p>
        </div>
      `,
    }),
  });
}

router.post("/community-appreciation", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { reviewId, businessId, businessName, sharePreference, recognitionTags, encouragementTags, commentOption, reviewText, appreciationNote } = req.body as Record<string, unknown>;

  if (!businessId) {
    res.status(400).json({ error: "businessId is required" });
    return;
  }

  const pref = typeof sharePreference === "string" ? sharePreference : "private";
  const recog = Array.isArray(recognitionTags) ? (recognitionTags as string[]) : [];
  const encour = Array.isArray(encouragementTags) ? (encouragementTags as string[]) : [];
  const note = typeof appreciationNote === "string" && appreciationNote.trim() ? appreciationNote.trim() : null;
  const text = typeof reviewText === "string" && reviewText.trim() ? reviewText.trim() : null;
  const option = typeof commentOption === "string" ? commentOption : null;

  const authorName = pref === "named"
    ? [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Community Member"
    : "Community Member";

  const [biz] = await db.select({ name: businessesTable.name }).from(businessesTable).where(eq(businessesTable.id, businessId as string)).limit(1);
  const resolvedName = biz?.name ?? (typeof businessName === "string" ? businessName : "this business");

  const willShare = pref !== "private" && (recog.length > 0 || encour.length > 0 || !!note || !!text);

  try {
    const [saved] = await db
      .insert(communityAppreciationsTable)
      .values({
        reviewId: typeof reviewId === "string" ? reviewId : null,
        businessId: businessId as string,
        businessName: resolvedName,
        userId: req.user.id,
        sharePreference: pref,
        recognitionTags: recog,
        encouragementTags: encour,
        commentOption: option,
        reviewText: text,
        appreciationNote: note,
        authorName,
        sentToBusiness: willShare,
      })
      .returning();

    const newBadges = recog.length > 0 ? await computeAndAwardBadges(businessId as string) : [];

    if (willShare) {
      sendAppreciationEmail({
        businessName: resolvedName,
        sharePreference: pref,
        authorName,
        recognitionTags: recog,
        encouragementTags: encour,
        appreciationNote: note,
        reviewText: text,
        commentOption: option,
        newBadges,
      }).catch((err) => { req.log.warn({ err }, "Failed to send appreciation email"); });
    }

    res.status(201).json({ ok: true, id: saved.id, newBadges });
  } catch (err) {
    req.log.error({ err }, "Failed to save community appreciation");
    res.status(500).json({ error: "Failed to save appreciation" });
  }
});

router.get("/community-appreciation/badges/:businessId", async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const rows = await pool.query<{ badge_id: string; appreciation_count: number; earned_at: string | null }>(
      `SELECT badge_id, appreciation_count, earned_at
         FROM business_badges
        WHERE business_id = $1
        ORDER BY appreciation_count DESC`,
      [businessId]
    );
    res.json({ badges: rows.rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch business badges");
    res.status(500).json({ error: "Failed to fetch badges" });
  }
});

export default router;
