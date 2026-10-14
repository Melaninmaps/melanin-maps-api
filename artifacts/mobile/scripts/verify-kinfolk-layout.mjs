#!/usr/bin/env node
/**
 * Visual-layout guard for the Kinfolk surface.
 *
 * This intentionally checks only that the refreshed presentation continues to
 * retain the existing interaction entry points. It does not call services
 * or mutate data; category artwork is the only permitted business-surface change.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dirname, "..");
const required = [
  ["components/AIChatWidget.tsx", [
    "@/assets/images/icon.png",
    "/api/kinfolk/chat",
    "/api/kinfolk/preferences",
    "KinfolkBusinessRecommendationSheet",
    "saveProposedTaskAction",
    'router.push("/kinfolk-settings"',
  ]],
  ["app/kinfolk-settings.tsx", [
    "@/assets/images/logo-transparent.png",
    "/api/kinfolk/preferences",
    "/api/kinfolk/continuity",
    "/api/kinfolk/reset",
    "SupportLensDropdowns",
  ]],
  ["constants/colors.ts", ["#3A1F0E", "#FAF6EF", "#CA922B", "#2D7A4F"]],
  ["components/BusinessCategoryVisual.ts", ["getBusinessCategoryIcon", "scissors", "tool", "coffee"]],
  ["components/BusinessCard.tsx", ["getBusinessCategoryIcon", "business.imageUrl", "BusinessPreviewModal", "categoryVisual"]],
  ["components/BusinessPreviewModal.tsx", ["getBusinessCategoryIcon", "business.imageUrl", "heroCategoryVisual", "onViewProfile"]],
];

for (const [file, tokens] of required) {
  const source = readFileSync(resolve(appRoot, file), "utf8");
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`${file} is missing required behavior or brand token: ${token}`);
  }
}

// Category fallback art is checked above; profiles and owner controls remain protected.
const protectedBusinessPaths = [
  "app/business/[id].tsx",
  "app/business-owner/index.tsx",
];
const changedProtected = execFileSync(
  "git",
  ["-C", resolve(appRoot, "../.."), "diff", "--name-only", "--", ...protectedBusinessPaths.map((path) => `artifacts/mobile/${path}`)],
  { encoding: "utf8" },
).trim();
if (changedProtected) throw new Error(`Protected business UI was changed unexpectedly:\n${changedProtected}`);

console.log("PASS: Kinfolk visual layout retains chat, settings, memory, task, recommendation, and brand entry points.");
console.log("PASS: Business cards and preview modal retain interactions while using category-matched visual fallbacks; profiles and owner dashboard are unchanged.");
