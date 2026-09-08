const CURRENT_RESEARCH_RE = /\b(today|tonight|tomorrow|current(?:ly)?|latest|recent|updates?|availability|fresh(?:ness)?|this week|(?:this |next )?weekend|this month|this year|right now|as[- ]of|open[- ]now|what(?:'s| is) open|live (?:travel|trip|recommendations?|updates?|availability)|real[- ]time|up[- ]to[- ]date|hours?|breaking|news|election|redistricting|closing|closed|recall|alert|schedule|weather|price|deadline|law|policy|regulation)\b/i;

export function requiresCurrentResearch(message: string): boolean {
  return CURRENT_RESEARCH_RE.test(message);
}
