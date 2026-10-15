import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  clusterBusinessKey,
  paginateClusterBusinesses,
  uniqueClusterBusinesses,
} from "@/features/map/clusterBusinessResults";

const mapSource = readFileSync(
  fileURLToPath(new URL("../pages/map.tsx", import.meta.url)),
  "utf8",
);

const business = (id: string, name = `Business ${id}`) => ({ id, name });

describe("map cluster-to-business-results interaction", () => {
  it("keeps the four exact underlying canonical records behind a cluster labeled 4", () => {
    const fourBusinesses = [
      business("four-a", "Aster Bakery"),
      business("four-b", "Banneker Books"),
      business("four-c", "Culture Cafe"),
      business("four-d", "Diaspora Design"),
      business("four-b", "Duplicate marker reference"),
    ];

    const results = uniqueClusterBusinesses(fourBusinesses);
    expect(results).toHaveLength(4);
    expect(results.map((item) => item.id)).toEqual(["four-a", "four-b", "four-c", "four-d"]);
    expect(clusterBusinessKey(results)).toBe("four-a|four-b|four-c|four-d");
  });

  it("paginates a 47-business cluster without dropping any underlying record", () => {
    const fortySevenBusinesses = Array.from({ length: 47 }, (_, index) => business(
      String(index + 1).padStart(2, "0"),
      `Business ${String(index + 1).padStart(2, "0")}`,
    ));

    const first = paginateClusterBusinesses(fortySevenBusinesses, 0);
    const second = paginateClusterBusinesses(fortySevenBusinesses, 1);
    const third = paginateClusterBusinesses(fortySevenBusinesses, 2);

    expect(first).toMatchObject({ page: 0, pageCount: 3 });
    expect(second).toMatchObject({ page: 1, pageCount: 3 });
    expect(third).toMatchObject({ page: 2, pageCount: 3 });
    expect(first.items).toHaveLength(20);
    expect(second.items).toHaveLength(20);
    expect(third.items).toHaveLength(7);
    expect([...first.items, ...second.items, ...third.items]).toEqual(fortySevenBusinesses);
  });

  it("replaces default cluster zoom with a selected, accessible result panel", () => {
    expect(mapSource).toContain("onClusterClick: (_event: unknown, cluster: { markers: GMarker[] }) => {");
    expect(mapSource).toContain("openClusterResults(cluster);");
    expect(mapSource).toContain("setSelectedCluster({ key, businesses: clusterBusinesses });");
    expect(mapSource).toContain("selectedCluster.businesses.length");
    expect(mapSource).toContain("Zoom to pins");
    expect(mapSource).toContain('"Cluster business results"');
    expect(mapSource).toContain("paginateClusterBusinesses(selectedCluster.businesses, clusterPage)");
  });

  it("uses the same eligible marker collection for cluster labels and results", () => {
    expect(mapSource).toContain("const activeIds = new Set(markerBusinesses.map");
    expect(mapSource).toContain(".filter(([id]) => activeIds.has(id))");
    expect(mapSource).toContain("cluster.markers.map((marker) => markerBusinessesRef.current.get(marker))");
  });
});
