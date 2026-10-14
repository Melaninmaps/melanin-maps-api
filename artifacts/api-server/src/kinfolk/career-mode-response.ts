import type { KinfolkConversationMode } from "./conversation-mode";

const RAISE_PREPARATION_RE = /\b(?:ask(?:ing)? (?:my )?(?:boss|manager|supervisor) for (?:a )?raise|prepare for (?:a |that )?(?:raise|salary|performance|career|job) conversation)\b/i;

export function isKinfolkRaisePreparationRequest(message: string): boolean {
  return RAISE_PREPARATION_RE.test(message);
}

/**
 * A bounded, evidence-neutral coaching plan for a direct raise-preparation ask.
 * It keeps the guidance identical in substance while making the requested Kinfolk
 * Voice visibly different without depending on the generation queue.
 */
export function renderKinfolkRaisePreparation(
  mode: KinfolkConversationMode,
): { reply: string; followUpSuggestions: string[] } {
  switch (mode) {
    case "best_friend":
      return {
        reply: [
          "You can do this. Feeling nervous means the conversation matters, not that you are unprepared.",
          "Here is the move:",
          "• Write down three contributions with a clear result, responsibility, or outcome.",
          "• Check the market value for your role and experience level before you meet.",
          "• Practice one sentence: “Based on my contributions and the scope of my role, I’d like to discuss adjusting my compensation.”",
          "• If the answer is not yes yet, ask what specific milestones and date would support a follow-up conversation.",
        ].join("\n"),
        followUpSuggestions: ["Practice the opening sentence", "Make a one-page accomplishments list"],
      };
    case "professor":
      return {
        reply: [
          "A raise conversation is strongest when the ask connects market value to specific evidence of your contribution.",
          "• Principle: compensation discussions are about role scope, results, and comparable market data—not personal need.",
          "• Evidence: prepare three specific accomplishments, the impact of each, and any expanded responsibilities.",
          "• Method: state the value you have created, make a direct compensation request, then pause for your manager’s response.",
          "• Practice line: “I have taken on [responsibility] and delivered [result]. Based on that specific evidence and market value for this role, I’d like to discuss my compensation.”",
        ].join("\n"),
        followUpSuggestions: ["Outline the evidence", "Practice a concise ask"],
      };
    case "business_manager":
      return {
        reply: [
          "Objective: leave the conversation with either a compensation decision or a documented path and follow-up date.",
          "• Agenda: open with your purpose, summarize three measurable contributions, and make the exact ask.",
          "• Evidence packet: bring a one-page list of outcomes, expanded scope, and market-value research for your role.",
          "• Exact ask: “I’d like to discuss adjusting my compensation to reflect my current responsibilities and results.”",
          "• Follow-up: if a decision is deferred, agree on the criteria, decision owner, and a follow-up date before the meeting ends.",
        ].join("\n"),
        followUpSuggestions: ["Build the evidence packet", "Draft the follow-up email"],
      };
    case "big_cousin":
    default:
      return {
        reply: [
          "Here is how to go about it: you earned the right to have a clear, professional conversation about your work.",
          "• Bring receipts: write down three contributions, the results they created, and any work you now handle that was not part of your original role.",
          "• Check the market value for your role so you can ground the ask in more than a feeling.",
          "• Do not apologize for asking. Say plainly: “I’d like to talk about adjusting my compensation to reflect my responsibilities and results.”",
          "• If the answer is not yes today, ask what needs to happen next and set a follow-up date before you leave the conversation.",
        ].join("\n"),
        followUpSuggestions: ["List your strongest results", "Practice the direct ask"],
      };
  }
}
