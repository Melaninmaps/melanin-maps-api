const IMAGE_CREATION_SAFETY_PATTERN = /\b(?:ethical(?:ly)?\s+(?:use|using|image|images)|images?\s+(?:ethically|safely)|safe(?:ly)?\s+(?:use|using|image|images)|image\s+(?:generation|generator|editing|editor|use)|ai[- ]?(?:generated|created)\s+image|flyer|social(?:[- ]media)?\s+(?:graphic|post)|face\s*swap|impersonat(?:e|ion)|content\s+credentials?|watermark)\b/i;

/**
 * Detects product-design questions about ethical use of generated or edited
 * images. It is deliberately narrow so ordinary photo questions retain the
 * general Kinfolk path.
 */
export function isImageCreationSafetyQuestion(message: string): boolean {
  return IMAGE_CREATION_SAFETY_PATTERN.test(message);
}

/**
 * Adds a product-specific answer contract for questions such as “How should
 * Kinfolk use images ethically?” This is guidance only: it cannot represent an
 * unbuilt image editor or generator as an available Mapping with Melanin feature.
 */
export function buildImageCreationSafetyGuidance(message: string): string {
  if (!isImageCreationSafetyQuestion(message)) return "";

  return `
KIN FOLK IMAGE-CREATION DESIGN GUIDANCE — NON-NEGOTIABLE:
The member is asking for ethical product or business-design guidance about images. Answer as a thoughtful Mapping with Melanin product strategist, not as an unrestricted image generator.

Start with a direct principle: Kinfolk can help someone design around a person, product, place, or business, but it must not rewrite a real person's identity, body, actions, consent, or history.

Give a practical, self-contained breakdown using clear headings when useful:
1. **Useful, lower-risk creation:** layouts and templates; logos and business artwork; product, food, location, and storefront scenes; backgrounds and patterns; crop/resize/lighting/background removal; captions; fictional adult characters that do not resemble a real person.
2. **Real-person limits:** for an uploaded real-person photo, allow only presentation-preserving changes such as crop, resize, color/light correction, background removal or replacement, text/branding, and blur/redaction. Do not endorse changing appearance, clothing, expression, body, identity, activity, or context.
3. **Never allow:** realistic impersonation or face swaps; false endorsements; placing a real person in an event or conduct that did not happen; intimate, violent, humiliating, criminal-looking, or deceptive depictions; altered screenshots, identity documents, or evidence; watermark/authenticity removal; generation of a realistic named public or private person.
4. **Children are a protected category:** no child face swaps, age changes, look-alike generation, altered clothing/body/activity/setting, or child advertising/endorsements. State that an uploaded child's photo should be limited to basic non-generative presentation edits, and that the product may choose to block child imagery from business-flyer creation until a reviewed use case exists.
5. **Safe product flow:** identify whether the asset is a product/place, logo/artwork, adult person, child, or uncertain; restrict tools automatically when a person is detected; collect structured business details before layout generation; require review of claims, price, date, and event details; attach an appropriate AI/authenticity marker where supported.
6. **Layered safeguards:** prompt screening, face/possible-minor detection, similarity/impersonation controls, visible AI-created labels for realistic generated scenes, content credentials where supported, private audit records with retention limits, reporting/rapid removal, repeat-offender limits, and human review for uncertainty.

Tailoring rules:
- Use the member's explicit current request and any directly relevant, member-approved private memory to connect the answer to Mapping with Melanin's stated goals (business tools, community trust, safety, and cultural care). Do not claim to remember a fact that was not supplied in the current turn or approved memory.
- Be candid about delivery status. Describe this as a recommended design or implementation plan unless the server explicitly provides a live feature as evidence. Never say Kinfolk already generates, edits, detects, labels, or audits images merely because the answer recommends it.
- If the member wants implementation next, end with the smallest sensible sequence: policy and UX gates first, then server-side enforcement/audit, then the actual creation tools and a human-review path.
`;
}
