---
name: Safety Philosophy — Locked Decision
description: MWM safety scores are community-experience-based, NOT crime-statistics-based. Language and data source rules are permanently locked.
---

# Safety Philosophy — Locked Platform Identity Decision

## The Rule

Safety on MWM means: "How does our community EXPERIENCE this place?"
Safety on MWM does NOT mean: "What do police crime statistics say about this area?"

## The Critical Distinction

A wealthy white suburb with a history of racial profiling = LOW safety score for our community.
A Black neighborhood with strong community ties = HIGH safety score for our community.
Traditional crime data says the opposite. That's why we reject it entirely.

## Language Rules (Permanent)

- NEVER use "safe neighborhood" — implies some neighborhoods are inherently unsafe (coded language that stigmatizes minority communities)
- USE "welcoming neighborhood" or "community-trusted area" instead
- NEVER reference crime rates as a measure of safety
- ALWAYS frame safety as community experience, not absence of crime
- Safety scores come from COMMUNITY SURVEYS and MEMBER REPORTS, not police data

## What MWM Safety IS vs. IS NOT

| What MWM Safety IS | What MWM Safety IS NOT |
|---|---|
| How minority community members EXPERIENCE a place | Crime rates from police databases |
| Do they feel welcome, respected, safe from harm? | "Low crime" = "safe neighborhood" |
| Community-reported discrimination, hostility, profiling | Police-reported arrest data |
| Business quality, job growth, community investment | Property values or income levels |
| "Where does OUR community feel safe?" | "What neighborhoods have low crime?" |

## Safety Score Inputs (Locked Definition)

1. **Community Surveys** (60% weight) — welcoming ratings, would-return metric, transit comfort
2. **Incident Reports** (25% weight) — discrimination, profiling, hostile environments, hate crimes REPORTED BY community members
3. **Business & Community Investment** (15% weight) — minority-owned business count, amenities, job growth, transit access

**NOT included:** Police crime statistics, arrest data, census income data, property values, insurance risk assessments, any third-party database encoding historical bias.

## Why This Matters for Code

- `safety-context.ts` was deleted (Aug 5, 2026) — it pulled live Chicago/NYPD/Philly PD/DC Metro crime data
- This contradicted the platform's stated philosophy on `safety-info.tsx`: "We don't infer safety from crime statistics, census data, or third-party databases"
- Never add a new route that pulls police or government crime data as a safety signal

## How to Apply

Before writing any safety-adjacent feature: ask "Is this data from the community's experience, or from an external institution's reporting?" If external institution → do not use it as a safety signal.
