export const AUTH_OPERATION_DEADLINE_MS = 6_000;

export class AuthOperationTimeoutError extends Error {
  constructor(operation: string) {
    super(`${operation} timed out`);
    this.name = "AuthOperationTimeoutError";
  }
}

/**
 * Prevents a native credential-store or response-body operation from holding
 * the in-memory sign-in state forever. It intentionally carries no member,
 * token, or request data.
 */
export async function withAuthOperationDeadline<T>(
  operation: Promise<T>,
  operationName: string,
  timeoutMs = AUTH_OPERATION_DEADLINE_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new AuthOperationTimeoutError(operationName));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
