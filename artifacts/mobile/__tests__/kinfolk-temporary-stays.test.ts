import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const temporaryStays = readFileSync(
  new URL("../app/kinfolk-temporary-stays.tsx", import.meta.url),
  "utf8",
);

describe("Kinfolk Temporary Stays deletion", () => {
  it("makes each deletion single-flight while preserving retryable failed records", () => {
    const remove = temporaryStays.slice(
      temporaryStays.indexOf("const remove = async"),
      temporaryStays.indexOf("const nearby = async"),
    );

    expect(temporaryStays).toContain("const [deletingStayIds, setDeletingStayIds] = useState<string[]>([]);");
    expect(temporaryStays).toContain("const deletingStayIdsRef = useRef(new Set<string>());");
    expect(remove).toContain("if (deletingStayIdsRef.current.has(stay.id)) return;");
    expect(remove).toContain("deletingStayIdsRef.current.add(stay.id);");
    expect(remove.indexOf("deletingStayIdsRef.current.add(stay.id);")).toBeLessThan(
      remove.indexOf('method: "DELETE"'),
    );
    expect(remove).toContain("finally {");
    expect(remove).toContain("deletingStayIdsRef.current.delete(stay.id);");
    expect(remove).toContain("setDeletingStayIds((current) => current.filter((id) => id !== stay.id));");
    expect(remove).toContain("await load();");
    expect(remove).not.toContain("setStays(");
    expect(temporaryStays).toContain("disabled={deletingStayIds.includes(stay.id)}");
    expect(temporaryStays).toContain('{deletingStayIds.includes(stay.id) ? "Deleting…" : "Delete"}');
  });
});
