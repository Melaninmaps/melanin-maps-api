export const KINFOLK_BOTTOM_TOLERANCE_PX = 160;

export type ConversationScrollReason = "send" | "completion" | null;

export interface ConversationScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/** True when the person is close enough to the bottom to reasonably expect live updates to follow. */
export function isNearConversationBottom(
  { scrollTop, scrollHeight, clientHeight }: ConversationScrollMetrics,
  tolerancePx = KINFOLK_BOTTOM_TOLERANCE_PX,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= tolerancePx;
}

/**
 * A new prompt and its completed answer are intentional navigation events. Other
 * updates only follow when the person has not deliberately moved up to read.
 */
export function shouldScrollConversation(
  isNearBottom: boolean,
  reason: ConversationScrollReason,
): boolean {
  return reason !== null || isNearBottom;
}

/** Scroll only the conversation element; never call scrollIntoView on a descendant. */
export function scrollConversationToBottom(element: Pick<HTMLElement, "scrollTop" | "scrollHeight">): void {
  element.scrollTop = element.scrollHeight;
}
