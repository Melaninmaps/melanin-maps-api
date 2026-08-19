import type { Express, NextFunction, Request, Response } from "express";
import type { Pool } from "pg";
import { UNIVERSAL_MAP_ENTITY_KINDS } from "./ensureUniversalMapEntities";

const KINDS = new Set<string>(UNIVERSAL_MAP_ENTITY_KINDS);

export function registerUniversalMapEntityRoutes(app: Express, pool: Pool): void {
  app.get("/api/map/entities", async (request: Request, response: Response, next: NextFunction) => {
    try {
      const kind = typeof request.query.kind === "string" ? request.query.kind.trim() : null;
      const city = typeof request.query.city === "string" ? request.query.city.trim() : null;
      if (kind && !KINDS.has(kind)) {
        return response.status(400).json({ code: "UNKNOWN_ENTITY_KIND" });
      }
      const { rows } = await pool.query(`
        SELECT id::text, entity_kind, title, slug, summary, city, state_region,
               latitude, longitude, detail_url
        FROM public.published_map_entities
        WHERE ($1::text IS NULL OR entity_kind = $1)
          AND ($2::text IS NULL OR lower(city) = lower($2))
        ORDER BY title ASC
      `, [kind || null, city || null]);
      return response.json({
        items: rows,
        metadata: { kind: kind || "all", city: city || null, count: rows.length },
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/places/:id", async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query(`
        SELECT id::text, entity_kind, title, slug, summary, address_line1, city, state_region,
               postal_code, country_code, latitude, longitude, website_url, source_url, source_label,
               '/places/' || id::text || '/' || slug AS detail_url
        FROM public.map_entities
        WHERE id = $1::uuid
          AND published = TRUE
          AND geocode_status = 'resolved'
      `, [request.params.id]);
      if (!rows[0]) return response.status(404).json({ code: "PLACE_NOT_FOUND" });
      return response.json(rows[0]);
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/legacy-place/:legacyKind/:legacyId", async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query<{ id: string; slug: string }>(`
        SELECT entity.id::text, entity.slug
        FROM public.map_entity_aliases alias
        JOIN public.map_entities entity ON entity.id = alias.entity_id
        WHERE alias.legacy_kind = $1
          AND (alias.legacy_id::text = $2 OR alias.legacy_slug = $2)
          AND entity.published = TRUE
          AND entity.geocode_status = 'resolved'
        LIMIT 1
      `, [request.params.legacyKind, request.params.legacyId]);
      if (!rows[0]) return response.status(404).json({ code: "LEGACY_PLACE_NOT_FOUND" });
      return response.redirect(308, `/places/${rows[0].id}/${rows[0].slug}`);
    } catch (error) {
      return next(error);
    }
  });
}