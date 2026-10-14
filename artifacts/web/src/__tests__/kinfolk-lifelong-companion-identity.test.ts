import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  KINFOLK_LIFELONG_COMPANION_COPY,
  KinfolkLifelongCompanionIdentity,
} from "../components/kinfolk/KinfolkLifelongCompanionIdentity";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const travel = readFileSync(fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)), "utf8");

describe("Kinfolk lifelong companion identity", () => {
  it("renders the founder-required identity and promise verbatim without gamification", () => {
    const markup = renderToStaticMarkup(React.createElement(KinfolkLifelongCompanionIdentity));
    const renderedText = markup.replaceAll("&#x27;", "'");
    expect(renderedText).toContain('data-testid="kinfolk-lifelong-companion-identity"');
    expect(renderedText).toContain("<details");
    for (const text of Object.values(KINFOLK_LIFELONG_COMPANION_COPY)) expect(renderedText).toContain(text);
    expect(renderedText).not.toMatch(/progress|streak|achievement|points|level/iu);
  });

  it("places the readable disclosure in the authenticated empty conversation surface", () => {
    expect(travel).toContain("KinfolkLifelongCompanionIdentity");
    expect(travel).toContain("<KinfolkLifelongCompanionIdentity />");
  });
});
