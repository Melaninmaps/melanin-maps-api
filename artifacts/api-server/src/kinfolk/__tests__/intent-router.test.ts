/*
 * Mapping With Melanin — Kinfolk Intent Router Tests
 *
 * Verifies that the keyword classifier:
 * 1. Correctly identifies high-consequence queries (medical, legal, financial, emergency)
 * 2. Does NOT misfire on normal travel / business discovery queries (false positive guard)
 * 3. Sets blockCommunityAsProof correctly for all high-consequence intents
 * 4. Classifies safety emergencies at the highest priority regardless of other signals
 */

import { describe, expect, it } from "vitest";
import { classifyIntent, getEvidencePolicy } from "../intent-router";

// ─── Medical ──────────────────────────────────────────────────────────────────

describe("medical_health classification", () => {
  const MEDICAL_QUERIES = [
    "What are IVF success rates for women over 35?",
    "My doctor says my blood pressure medication isn't working",
    "Signs and symptoms of postpartum depression",
    "Can I take ibuprofen with my diabetes medication?",
    "What is the recovery time after knee surgery?",
    "HIV treatment options available in 2026",
    "Is my cholesterol level dangerous",
    "STI testing near me",
    "How do antidepressants affect pregnancy?",
    "What does it mean if my thyroid levels are high",
  ];

  MEDICAL_QUERIES.forEach((query) => {
    it(`classifies as medical_health: "${query.slice(0, 55)}..."`, () => {
      const intent = classifyIntent(query, false);
      expect(intent).toBe("medical_health");
    });
  });

  it.each([
    "What are the first-aid steps for a minor kitchen burn?",
    "How should I care for a scalded hand?",
    "What should I do about a sprained ankle?",
    "How do I clean a cut on my finger?",
  ])("routes acute-injury health requests through medical evidence: %s", (query) => {
    expect(classifyIntent(query, false)).toBe("medical_health");
  });

  it("blocks community data as proof for medical queries", () => {
    const policy = getEvidencePolicy("medical_health");
    expect(policy.blockCommunityAsProof).toBe(true);
    expect(policy.consequence).toBe("high");
    expect(policy.citationMode).toBe("required");
  });
});

// ─── Legal ────────────────────────────────────────────────────────────────────

describe("legal_regulated classification", () => {
  const LEGAL_QUERIES = [
    "Can my landlord evict me without notice in Pennsylvania?",
    "What are my rights if I'm arrested at a protest?",
    "How do I file for bankruptcy protection?",
    "My employer discriminated against me — what can I do?",
    "How does the immigration asylum process work?",
  ];

  LEGAL_QUERIES.forEach((query) => {
    it(`classifies as legal_regulated: "${query.slice(0, 55)}..."`, () => {
      const intent = classifyIntent(query, false);
      expect(intent).toBe("legal_regulated");
    });
  });

  it("blocks community data as proof for legal queries", () => {
    const policy = getEvidencePolicy("legal_regulated");
    expect(policy.blockCommunityAsProof).toBe(true);
    expect(policy.consequence).toBe("high");
    expect(policy.citationMode).toBe("required");
  });

  it.each([
    "What are the official requirements to renew a U.S. passport?",
    "How do I replace a government-issued identity document?",
    "What is the eligibility process for an immigration document extension?",
  ])("treats regulated document actions as legal even without a legal keyword: %s", (query) => {
    expect(classifyIntent(query, false)).toBe("legal_regulated");
  });

  it("does not treat ordinary passport-related shopping as a legal request", () => {
    expect(classifyIntent("Where can I buy a passport holder?", false)).not.toBe("legal_regulated");
  });
});

// ─── Financial ────────────────────────────────────────────────────────────────

describe("financial_regulated classification", () => {
  const FINANCIAL_QUERIES = [
    "Should I put money in a Roth IRA or 401k?",
    "How do I improve my credit score fast?",
    "What are the tax implications of selling my house?",
    "Best index funds for long-term investing",
    "Can I refinance my mortgage if I have bad credit?",
  ];

  FINANCIAL_QUERIES.forEach((query) => {
    it(`classifies as financial_regulated: "${query.slice(0, 55)}..."`, () => {
      const intent = classifyIntent(query, false);
      expect(intent).toBe("financial_regulated");
    });
  });

  it("blocks community data as proof for financial queries", () => {
    const policy = getEvidencePolicy("financial_regulated");
    expect(policy.blockCommunityAsProof).toBe(true);
    expect(policy.consequence).toBe("high");
    expect(policy.citationMode).toBe("required");
  });
});

// ─── Safety emergency ─────────────────────────────────────────────────────────

describe("safety_emergency classification", () => {
  const EMERGENCY_QUERIES = [
    "I'm in danger and being followed",
    "Someone is trying to break into my house call 911",
    "How do I escape a domestic violence situation safely?",
    "My friend is unconscious and not breathing what do I do",
  ];

  EMERGENCY_QUERIES.forEach((query) => {
    it(`classifies as safety_emergency: "${query.slice(0, 55)}..."`, () => {
      const intent = classifyIntent(query, false);
      expect(intent).toBe("safety_emergency");
    });
  });

  it("fires at highest priority even when destination is set", () => {
    // A destination (hasDestination=true) normally routes to business_discovery,
    // but emergency signals must always override.
    const intent = classifyIntent("I'm in danger near this restaurant help me", true);
    expect(intent).toBe("safety_emergency");
  });

  it("keeps a city-bearing breast-care request in medical health", () => {
    expect(
      classifyIntent("I found a lump in my breast. Where can I find a doctor in Philadelphia?", true),
    ).toBe("medical_health");
  });

  it("does not treat ordinary requests for help as emergencies", () => {
    for (const query of [
      "Help me draft a text inviting my coworker to dinner for their birthday while I am in Minneapolis for work.",
      "I am in Minneapolis for work and feel nervous about asking my boss for a raise. Help me prepare for that conversation tomorrow.",
      "Please remind me tomorrow at 9 AM to send my coworker a birthday dinner invitation.",
    ]) {
      expect(classifyIntent(query, true)).not.toBe("safety_emergency");
    }
  });

  it("blocks community data and requires citations for emergencies", () => {
    const policy = getEvidencePolicy("safety_emergency");
    expect(policy.blockCommunityAsProof).toBe(true);
    expect(policy.citationMode).toBe("required");
    expect(policy.consequence).toBe("high");
  });
});

// ─── False positive guard — normal travel / business discovery queries ─────────

describe("false positive guard (must NOT be high-consequence)", () => {
  const NORMAL_QUERIES = [
    "Best soul food restaurants in Philadelphia",
    "Black-owned barber shops near downtown Atlanta",
    "What are the top things to do in Phuket Thailand",
    "Natural hair salons in Houston Texas",
    "Where can I find a good Caribbean restaurant in Brooklyn",
    "Community events happening this weekend in Chicago",
    "Top HBCUs to visit in the southeast",
    "Black art galleries in Harlem",
    "Jazz clubs in New Orleans",
    "Where do local families go for brunch in DC",
    "I need a Black-owned dinner in Minneapolis with a flexible budget; I have a shellfish allergy.",
  ];

  const HIGH_CONSEQUENCE_INTENTS = new Set([
    "medical_health",
    "legal_regulated",
    "financial_regulated",
    "safety_emergency",
  ]);

  NORMAL_QUERIES.forEach((query) => {
    it(`does NOT fire high-consequence for: "${query.slice(0, 55)}..."`, () => {
      const intent = classifyIntent(query, false);
      expect(HIGH_CONSEQUENCE_INTENTS.has(intent)).toBe(false);
    });
  });

  it("does not block community data for business discovery", () => {
    const policy = getEvidencePolicy("business_discovery");
    expect(policy.blockCommunityAsProof).toBe(false);
    expect(policy.consequence).toBe("low");
  });

  it("does not block community data for culture / entertainment", () => {
    const policy = getEvidencePolicy("culture_entertainment");
    expect(policy.blockCommunityAsProof).toBe(false);
  });

  it("keeps an explicit food search in discovery when budget and allergy are supporting constraints", () => {
    expect(
      classifyIntent(
        "I need a Black-owned dinner in Minneapolis with a flexible budget; I have a shellfish allergy.",
        false,
      ),
    ).toBe("business_discovery");
  });
});

describe("business-card eligibility", () => {
  it("does not turn a remembered city into a business request", () => {
    expect(classifyIntent("What has Barack Obama done?", true)).toBe("general_knowledge");
  });

  it("keeps an explicit Philadelphia nightlife request in directory discovery", () => {
    expect(classifyIntent("Show me Philadelphia nightlife", true)).toBe("business_discovery");
  });

  it("keeps platform-policy questions conversational even when they use nightlife and Philadelphia as examples", () => {
    expect(
      classifyIntent(
        "You are built to only promote minority-owned businesses based on preferences. How would a user find non-minority-owned businesses that others frequent? There is very little Black or minority-owned nightlife in Philadelphia—what would be your suggested method to handle this?",
        true,
      ),
    ).toBe("general_knowledge");
  });
});

// ─── Provenance labels ────────────────────────────────────────────────────────

describe("provenance labels", () => {
  it("medical disclaimer mentions medical advice", () => {
    const policy = getEvidencePolicy("medical_health");
    expect(policy.provenanceLabel?.toLowerCase()).toContain("medical advice");
  });

  it("legal disclaimer mentions legal advice", () => {
    const policy = getEvidencePolicy("legal_regulated");
    expect(policy.provenanceLabel?.toLowerCase()).toContain("legal advice");
  });

  it("financial disclaimer mentions financial advice", () => {
    const policy = getEvidencePolicy("financial_regulated");
    expect(policy.provenanceLabel?.toLowerCase()).toContain("financial advice");
  });

  it("emergency label mentions emergency services", () => {
    const policy = getEvidencePolicy("safety_emergency");
    expect(policy.provenanceLabel?.toLowerCase()).toContain("emergency services");
  });

  it("general knowledge has no disclaimer overhead", () => {
    const policy = getEvidencePolicy("general_knowledge");
    expect(policy.consequence).toBe("low");
    expect(policy.blockCommunityAsProof).toBe(false);
    expect(policy.citationMode).toBe("none");
  });
});
