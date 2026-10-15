import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(__dirname, "../../../../..");
const source = (relativePath: string) => readFileSync(resolve(repositoryRoot, relativePath), "utf8");
const visibility = source("artifacts/api-server/src/businesses/memberDiscoveryVisibility.ts");
const routes = {
  recommend: source("artifacts/api-server/src/routes/recommend.ts"),
  signals: source("artifacts/api-server/src/routes/signals.ts"),
  journeys: source("artifacts/api-server/src/routes/journeys.ts"),
  travelPlanner: source("artifacts/api-server/src/routes/travel-planner.ts"),
  maps: source("artifacts/api-server/src/routes/maps.ts"),
  smartPathways: source("artifacts/api-server/src/routes/smart-pathways.ts"),
  kinfolk: source("artifacts/api-server/src/routes/kinfolk.ts"),
  community: source("artifacts/api-server/src/routes/community.ts"),
  knowledge: source("artifacts/api-server/src/routes/knowledge.ts"),
  knowledgeHubs: source("artifacts/api-server/src/routes/knowledge-hubs.ts"),
  cities: source("artifacts/api-server/src/routes/cities.ts"),
  forYou: source("artifacts/api-server/src/routes/for-you.ts"),
  communityAlerts: source("artifacts/api-server/src/routes/community-alerts.ts"),
  directions: source("artifacts/api-server/src/routes/directions.ts"),
  kinfolkIntelligence: source("artifacts/api-server/src/routes/kinfolk-intelligence.ts"),
};

describe("member discovery visibility boundary", () => {
  it("uses the public catalog view as the single member-visible relation", () => {
    expect(visibility).toContain("FROM public.public_businesses member_visible_business");
    expect(visibility).toContain("queued-review");
  });

  it("keeps the core Kinfolk, travel, recommendation, map, and community business paths behind that boundary", () => {
    for (const route of [
      routes.recommend,
      routes.journeys,
      routes.travelPlanner,
      routes.smartPathways,
      routes.kinfolk,
      routes.community,
      routes.knowledge,
      routes.knowledgeHubs,
    ]) {
      expect(route).toContain("isMemberDiscoverableBusiness");
    }
    for (const route of [routes.signals, routes.maps, routes.forYou, routes.communityAlerts, routes.directions, routes.cities, routes.kinfolkIntelligence]) {
      expect(route).toContain("public.public_businesses");
    }
  });

  it("does not reintroduce an active-status-only raw query in the reviewed member recommendation paths", () => {
    for (const route of [routes.recommend, routes.signals, routes.journeys, routes.maps, routes.forYou]) {
      expect(route).not.toContain("FROM businesses WHERE id = ANY($1) AND status = 'active'");
      expect(route).not.toContain("FROM businesses\n           WHERE status = 'active'");
    }
  });
});
