/**
 * One-way bridge from the global fetch observer to AuthProvider.
 *
 * Screens may make authenticated requests without using a shared API client.
 * The observer invokes this bridge only for a verified 401 from the configured
 * Mapping With Melanin API; AuthProvider then clears the local session and
 * routes the member to sign in. No request payloads, tokens, or URLs are kept.
 */

type UnauthorizedApiResponseHandler = () => void;

let handler: UnauthorizedApiResponseHandler | null = null;

export function registerUnauthorizedApiResponseHandler(
  nextHandler: UnauthorizedApiResponseHandler,
): () => void {
  handler = nextHandler;
  return () => {
    if (handler === nextHandler) handler = null;
  };
}

export function notifyUnauthorizedApiResponse(): void {
  handler?.();
}
