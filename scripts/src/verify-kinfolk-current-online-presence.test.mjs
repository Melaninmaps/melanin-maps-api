import assert from "node:assert/strict";
import test from "node:test";
import {
  assessIdentity,
  classifyBusinessDisposition,
  classifySocial,
  classifyWebsite,
  normalizeHttpUrl,
  parseAdminExport,
} from "./verify-kinfolk-current-online-presence.mjs";

const matchingWebsiteProbe = {
  state: "available",
  reason: "http_ok",
  finalUrl: "https://acme-flowers.example/",
  document: {
    title: "Acme Flowers | Philadelphia",
    ogTitle: "",
    h1: "Acme Flowers",
    textSample: "Acme Flowers in Philadelphia offers florals and delivery.",
  },
};

const matchingSocialProbe = {
  state: "available",
  reason: "http_ok",
  finalUrl: "https://www.facebook.com/acmeflowersphl/",
  document: {
    title: "Acme Flowers | Philadelphia PA",
    ogTitle: "Acme Flowers",
    h1: "",
    textSample: "Acme Flowers, Philadelphia, Pennsylvania. Flower shop.",
  },
};

test("normalizes a bare HTTPS website and strips safe tracking parameters", () => {
  const result = normalizeHttpUrl("www.acme-flowers.example/?utm_source=directory&keep=1#about");
  assert.equal(result.ok, true);
  assert.equal(result.normalized, "https://www.acme-flowers.example/?keep=1");
});

test("parses a quoted Admin CSV row without replacing its immutable business ID", () => {
  const rows = parseAdminExport([
    "Business ID,Name,City,State,Website,Instagram,Facebook,TikTok",
    'immutable-42,"Acme, Flowers",Philadelphia,PA,https://acme-flowers.example,https://www.instagram.com/acmeflowers,,,',
  ].join("\n"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "immutable-42");
  assert.equal(rows[0].name, "Acme, Flowers");
  assert.equal(rows[0].social.instagram, "https://www.instagram.com/acmeflowers");
});

test("retains an active identity-matched business website", () => {
  const website = classifyWebsite({
    originalUrl: "https://acme-flowers.example",
    businessName: "Acme Flowers",
    probe: matchingWebsiteProbe,
  });
  assert.equal(website.classification, "KEEP_ACTIVE");
  assert.equal(website.identity.status, "matched");
  assert.equal(classifyBusinessDisposition({ website, socials: {} }).disposition, "RETAIN");
});

test("proposes only dead website removal when matching official social remains", () => {
  const website = classifyWebsite({
    originalUrl: "https://expired-acme.example",
    businessName: "Acme Flowers",
    probe: { state: "unavailable", reason: "dns_nxdomain", finalUrl: null },
  });
  const social = classifySocial({
    platform: "facebook",
    originalUrl: "https://www.facebook.com/acmeflowersphl/",
    businessName: "Acme Flowers",
    probe: matchingSocialProbe,
  });
  const result = classifyBusinessDisposition({ website, socials: { facebook: social } });
  assert.equal(website.classification, "REMOVE_CONFIRMED_INACTIVE");
  assert.equal(social.classification, "KEEP_ACTIVE_SOCIAL");
  assert.equal(result.disposition, "RETAIN_SOCIAL_ONLY_WEBSITE_REMOVAL_PROPOSAL");
});

test("keeps a temporary website failure in review rather than treating it as inactivity", () => {
  const website = classifyWebsite({
    originalUrl: "https://acme-flowers.example",
    businessName: "Acme Flowers",
    probe: { state: "transient", reason: "http_503", finalUrl: "https://acme-flowers.example" },
  });
  const result = classifyBusinessDisposition({ website, socials: {} });
  assert.equal(website.classification, "HOLD_INCONCLUSIVE");
  assert.equal(result.disposition, "HOLD_FOR_REVIEW");
});

test("keeps a social login block inconclusive", () => {
  const social = classifySocial({
    platform: "instagram",
    originalUrl: "https://www.instagram.com/acmeflowers/",
    businessName: "Acme Flowers",
    probe: {
      state: "available",
      reason: "http_ok",
      finalUrl: "https://www.instagram.com/accounts/login/?next=%2Facmeflowers%2F",
      document: { title: "Instagram", ogTitle: "", h1: "", textSample: "Log in to Instagram" },
    },
  });
  assert.equal(social.classification, "HOLD_INCONCLUSIVE");
});

test("does not accept an unrelated redirect as a matching website", () => {
  const website = classifyWebsite({
    originalUrl: "https://old-acme.example",
    businessName: "Acme Flowers",
    probe: {
      state: "available",
      reason: "http_ok",
      finalUrl: "https://totally-unrelated.example/",
      redirectChain: [{ status: 301, from: "https://old-acme.example", to: "https://totally-unrelated.example/" }],
      document: { title: "Completely Different Business", ogTitle: "", h1: "Other Company", textSample: "A different company in another city." },
    },
  });
  assert.equal(website.classification, "HOLD_INCONCLUSIVE");
  assert.notEqual(website.classification, "KEEP_ACTIVE");
});

test("proposes reversible Delete Review only after both presence channels are decisively absent", () => {
  const website = { classification: "REMOVE_CONFIRMED_INACTIVE" };
  const socials = {
    instagram: { classification: "INACTIVE_OR_REMOVED" },
    facebook: { classification: "MISSING" },
  };
  assert.equal(classifyBusinessDisposition({ website, socials }).disposition, "DELETE_REVIEW_PROPOSAL");
});

test("does not treat an accessible but identity-unclear social account as absence", () => {
  const website = { classification: "MISSING" };
  const socials = { instagram: { classification: "ACTIVE_BUT_IDENTITY_UNCLEAR" } };
  assert.equal(classifyBusinessDisposition({ website, socials }).disposition, "HOLD_FOR_REVIEW");
});

test("requires more than one weak token before matching a same-name-looking page", () => {
  const identity = assessIdentity({
    businessName: "Blue Cafe",
    finalUrl: "https://blue.example/",
    document: { title: "Blue Design Studio", ogTitle: "", h1: "Blue", textSample: "Design work." },
  });
  assert.equal(identity.status, "unclear");
});
