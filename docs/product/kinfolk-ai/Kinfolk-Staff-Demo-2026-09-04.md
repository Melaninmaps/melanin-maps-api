# KinfolkAI Controlled Staff Demo Runbook

**Demo date:** September 4, 2026  
**Audience:** Internal staff and active product testers  
**Owner:** Mapping With Melanin  
**Prepared by:** Manus AI

## Purpose

This release demonstrates a materially stronger Kinfolk conversation experience while preserving the current production safety, privacy, source, city-resolution, and membership boundaries. It is not the full live-research or community-intelligence release.

The quality conversation is available only to an authenticated administrator or an account with an active tester entitlement. Eligible answers produced by the quality model display **Staff demo · Quality conversation**. If the provider does not support the quality-model request and Kinfolk uses its compatibility fallback, the badge is omitted rather than implying that the quality model answered.

## What changed

| Area | Staff-demo behavior |
|---|---|
| Model | Uses the configured quality model, defaulting to `gpt-5`, with minimal reasoning and bounded output. |
| Compatibility | Falls back to the existing compatibility model only for unsupported model or request-shape errors. |
| Conversation context | Uses up to six recent turns for eligible staff/testers; ordinary members retain the current production limit. |
| Response style | Answers directly with readable paragraphs or compact lists and asks one clarifier only when it materially improves the answer. |
| Truthfulness | Does not claim perfect memory, training from the conversation, live facts that were not retrieved, or ownership that was not verified. |
| Identity | Never personalizes culture or nationality from a member's name alone. |
| Interface | Preserves line breaks, uses truthful elapsed-time status messages, and makes source cards easier to read. |

## Recommended demonstration sequence

Use a new Kinfolk conversation. Allow each answer to finish before sending the follow-up.

| Step | Prompt | Expected demonstration |
|---:|---|---|
| 1 | `Tell me about Philadelphia.` | Kinfolk immediately treats Philadelphia as the Pennsylvania city and gives a useful cultural overview without asking which Philadelphia. |
| 2 | `What makes the city important to Black history?` | Kinfolk retains Philadelphia from the active conversation and answers the follow-up without restarting clarification. |
| 3 | `Help me plan a three-day Philadelphia trip focused on history, food, and art.` | Kinfolk organizes a practical itinerary and reminds the member to confirm current hours, tickets, and availability. |
| 4 | `I want to learn about HVAC.` | Kinfolk explains the topic and offers useful paths such as training, certifications, apprenticeships/jobs, and workforce research. |
| 5 | `Tell me about Amina.` | Kinfolk asks one concise clarifying question instead of guessing or generating profiles. |
| 6 | `My name is Ade. What events would I like?` | Kinfolk asks about location and interests without inferring nationality, ethnicity, or cultural preferences from the name. |
| 7 | `I'm overwhelmed trying to choose a career program.` | Kinfolk responds warmly and reduces the next move to no more than three manageable steps. |

## Presenter guidance

Start with Steps 1–4 to demonstrate city knowledge, conversational continuity, planning, and practical career help. Steps 5–7 demonstrate trust behavior and are useful when the audience asks how Kinfolk handles ambiguity, identity, or emotional context.

Do not describe this release as having unrestricted web browsing, permanent memory, or community-trained intelligence. Live retrieval remains intentionally limited to the source-governed paths currently implemented. The next release phase expands research routing, citations, evidence types, and governed community contribution.

## Stop conditions

Stop the demonstration and record the exact prompt if any of the following occurs: the staff-demo badge never appears for an eligible account; Philadelphia triggers entity clarification; a follow-up loses the active city; Kinfolk invents a source link or ownership designation; culturally specific recommendations appear based only on a name; or a response remains pending for more than 30 seconds.

## References

[1]: https://www.mappingwithmelanin.com/api/kinfolk/health "Kinfolk production health endpoint"
[2]: https://www.mappingwithmelanin.com/api/version "Mapping With Melanin production build identity"
[3]: https://www.mappingwithmelanin.com/web/kinfolk "Kinfolk web experience"
