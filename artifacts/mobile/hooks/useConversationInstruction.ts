import { useCallback, useEffect, useRef, useState } from "react";

export const CONVERSATION_INSTRUCTIONS = [
  { id: "concise", label: "Keep answers concise" },
  { id: "step_by_step", label: "Use step-by-step guidance" },
  { id: "answer_first", label: "Start with the direct answer" },
  { id: "gentle", label: "Use a gentle, supportive tone" },
] as const;
export type ConversationInstruction = typeof CONVERSATION_INSTRUCTIONS[number]["id"];

type Selection = { accountId: string; instruction: ConversationInstruction } | null;

/** Each mounted chat owns its selection. No persistence or cross-surface handoff. */
export function useConversationInstruction(accountId: string | null) {
  const [selection, setSelection] = useState<Selection>(null);
  const selectionRef = useRef<Selection>(null);
  const clearConversationInstruction = useCallback(() => {
    selectionRef.current = null;
    setSelection(null);
  }, []);
  useEffect(() => {
    clearConversationInstruction();
    return () => { selectionRef.current = null; };
  }, [accountId, clearConversationInstruction]);
  const setConversationInstruction = useCallback((instruction: ConversationInstruction) => {
    if (!accountId) return;
    const next = { accountId, instruction };
    selectionRef.current = next;
    setSelection(next);
  }, [accountId]);
  const getConversationInstruction = useCallback(() => {
    const current = selectionRef.current;
    return accountId && current?.accountId === accountId ? current.instruction : undefined;
  }, [accountId]);
  return {
    conversationInstruction: accountId && selection?.accountId === accountId ? selection.instruction : null,
    setConversationInstruction,
    clearConversationInstruction,
    getConversationInstruction,
  };
}
