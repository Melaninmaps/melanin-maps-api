import { db, pool, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export class Storage {
  async getUser(id: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user;
  }

  async updateUserStripeInfo(userId: string, info: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    memberType?: "individual" | "navigator" | "trailblazer" | "business" | "founding" | "beta" | "business_referral";
    trialEndsAt?: Date;
    foundingMemberNumber?: number;
  }) {
    const [user] = await db.update(usersTable).set(info).where(eq(usersTable.id, userId)).returning();
    return user;
  }

  async getFoundingMemberCount() {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.memberType, "founding"));
    return row?.count ?? 0;
  }

  async getProduct(productId: string) {
    // pool.query() instead of db.execute() — db.execute() can silently hang
    // (never-resolving Promise) in esbuild bundles, permanently holding the
    // pg connection. pool.query() always resolves or rejects within the
    // pool-level statement_timeout (10 s).
    const result = await pool.query(
      `SELECT * FROM stripe.products WHERE id = $1`,
      [productId],
    );
    return result.rows[0] ?? null;
  }

  async listProductsWithPrices() {
    const result = await pool.query(`
      WITH latest_products AS (
        SELECT DISTINCT ON (name) id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY name, created DESC
      )
      SELECT
        p.id        AS product_id,
        p.name      AS product_name,
        p.description AS product_description,
        p.active    AS product_active,
        p.metadata  AS product_metadata,
        pr.id       AS price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active   AS price_active,
        pr.metadata AS price_metadata
      FROM latest_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.name, pr.unit_amount
    `);
    return result.rows;
  }

  async getPriceForPlan(planName: string, billing: "monthly" | "annual") {
    const interval = billing === "annual" ? "year" : "month";
    const result = await pool.query(
      `SELECT pr.id AS price_id, pr.unit_amount, pr.currency, pr.recurring
       FROM stripe.products p
       JOIN stripe.prices pr ON pr.product = p.id
       WHERE p.name = $1
         AND p.active = true
         AND pr.active = true
         AND pr.recurring->>'interval' = $2
       ORDER BY p.created DESC
       LIMIT 1`,
      [planName, interval],
    );
    return (result.rows[0] ?? null) as { price_id: string; unit_amount: number } | null;
  }

  async getUserByStripeCustomerId(customerId: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.stripeCustomerId, customerId)).limit(1);
    return user ?? null;
  }

  async setMemberStatus(userId: string, info: {
    memberType?: "individual" | "navigator" | "trailblazer" | "business" | "founding" | "beta" | "business_referral";
    trialEndsAt?: Date | null;
    foundingMemberNumber?: number | null;
  }) {
    const [user] = await db.update(usersTable).set(info).where(eq(usersTable.id, userId)).returning();
    return user;
  }

  async getSubscription(subscriptionId: string) {
    const result = await pool.query(
      `SELECT * FROM stripe.subscriptions WHERE id = $1`,
      [subscriptionId],
    );
    return result.rows[0] ?? null;
  }
}

export const storage = new Storage();
