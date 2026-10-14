import { useCallback, useEffect, useState } from "react";

export const TEMPORARY_SENSITIVE_CONTEXT_MAX_LENGTH = 1200;
export const TEMPORARY_SENSITIVE_CONTEXT_SUBJECTS = ["member", "someone_else"] as const;
export type TemporarySensitiveContextSubject = typeof TEMPORARY_SENSITIVE_CONTEXT_SUBJECTS[number];

/** Sent only on an active chat request; never add this to Message or a session. */
export type TemporarySensitiveConversationContext = Readonly<{
  consent: true;
  text: string;
  subject: TemporarySensitiveContextSubject;
}>;

type ActiveSelection = {
  accountId: string;
  context: TemporarySensitiveConversationContext;
} | null;

/** Component-local active-chat state. */
export function useTemporarySensitiveConversationContext(accountId: string | null) {
  const [draftText, setDraftText] = useState("");
  const [draftSubject, setDraftSubject] = useState<TemporarySensitiveContextSubject>("member");
  const [selection, setSelection] = useState<ActiveSelection>(null);

  const clearTemporarySensitiveContext = useCallback(() => {
    setDraftText("");
    setDraftSubject("member");
    setSelection(null);
  }, []);

  useEffect(() => {
    clearTemporarySensitiveContext();
    return () => { clearTemporarySensitiveContext(); };
  }, [accountId, clearTemporarySensitiveContext]);

  const enableTemporarySensitiveContext = useCallback(() => {
    const text = draftText.trim();
    if (!accountId || !text || text.length > TEMPORARY_SENSITIVE_CONTEXT_MAX_LENGTH) return false;
    setDraftText("");
    setSelection({
      accountId,
      context: { consent: true, text, subject: draftSubject },
    });
    return true;
  }, [accountId, draftSubject, draftText]);

  const temporarySensitiveContext = accountId && selection?.accountId === accountId
    ? selection.context
    : null;

  return {
    draftText,
    setDraftText,
    draftSubject,
    setDraftSubject,
    temporarySensitiveContext,
    enableTemporarySensitiveContext,
    clearTemporarySensitiveContext,
  };
}
