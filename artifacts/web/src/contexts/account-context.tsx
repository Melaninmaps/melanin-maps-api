import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { setAccountContextForTransport } from "@/lib/account-context-transport";

const BASE = import.meta.env.BASE_URL;

export type PersonalAccountContext = {
  kind: "personal";
};

export type BusinessAccountContext = {
  kind: "business";
  businessId: string;
  businessName: string;
  managementRole: "owner" | "manager";
};

export type AdminAccountContext = {
  kind: "admin";
};

export type AccountContextSelection =
  | PersonalAccountContext
  | BusinessAccountContext
  | AdminAccountContext;

type AccountContextState = {
  activeContext: AccountContextSelection;
  businessContexts: BusinessAccountContext[];
  canUseAdminContext: boolean;
  loading: boolean;
  setActiveContext: (context: AccountContextSelection) => void;
};

type AccountContextResponse = {
  businesses?: Array<{
    id?: string;
    name?: string;
    managementRole?: "owner" | "manager";
  }>;
  canUseAdminContext?: boolean;
};

const PERSONAL_CONTEXT: PersonalAccountContext = { kind: "personal" };

const AccountContext = createContext<AccountContextState | null>(null);

function contextIdentity(context: AccountContextSelection): string {
  return context.kind === "business"
    ? `business:${context.businessId}`
    : context.kind;
}

function isPermittedContext(
  candidate: AccountContextSelection,
  businesses: BusinessAccountContext[],
  canUseAdminContext: boolean,
): boolean {
  if (candidate.kind === "personal") return true;
  if (candidate.kind === "admin") return canUseAdminContext;
  return businesses.some((business) => business.businessId === candidate.businessId);
}

/**
 * Keeps the active workspace in memory only. A browser refresh always starts in
 * Personal context, which prevents a stale owner/admin selection from being
 * reused after a role or business-management link changes.
 */
export function AccountContextProvider({ children }: { children: ReactNode }) {
  const { data: auth } = useGetCurrentAuthUser();
  const [businessContexts, setBusinessContexts] = useState<BusinessAccountContext[]>([]);
  const [canUseAdminContext, setCanUseAdminContext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeContext, setActiveContextState] =
    useState<AccountContextSelection>(PERSONAL_CONTEXT);

  useEffect(() => {
    const userId = auth?.user?.id;
    if (!userId) {
      setBusinessContexts([]);
      setCanUseAdminContext(false);
      setActiveContextState(PERSONAL_CONTEXT);
      setAccountContextForTransport(PERSONAL_CONTEXT);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    authenticatedFetch(`${BASE}api/users/me/account-contexts`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load account contexts");
        return response.json() as Promise<AccountContextResponse>;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        const nextBusinesses = (Array.isArray(payload.businesses) ? payload.businesses : [])
          .flatMap((business): BusinessAccountContext[] => {
            if (
              typeof business?.id !== "string" ||
              typeof business?.name !== "string" ||
              (business.managementRole !== "owner" && business.managementRole !== "manager")
            ) {
              return [];
            }
            return [{
              kind: "business",
              businessId: business.id,
              businessName: business.name,
              managementRole: business.managementRole,
            }];
          });
        const nextCanUseAdmin = payload.canUseAdminContext === true;
        setBusinessContexts(nextBusinesses);
        setCanUseAdminContext(nextCanUseAdmin);
        setActiveContextState((current) => {
          const next = isPermittedContext(current, nextBusinesses, nextCanUseAdmin)
            ? current
            : PERSONAL_CONTEXT;
          setAccountContextForTransport(next);
          return next;
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        // Fail closed: unresolved role information never grants business or admin mode.
        setBusinessContexts([]);
        setCanUseAdminContext(false);
        setActiveContextState(PERSONAL_CONTEXT);
        setAccountContextForTransport(PERSONAL_CONTEXT);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [auth?.user?.id]);

  const setActiveContext = useCallback(
    (candidate: AccountContextSelection) => {
      if (!isPermittedContext(candidate, businessContexts, canUseAdminContext)) return;
      const resolved = candidate.kind === "business"
        ? businessContexts.find((business) => business.businessId === candidate.businessId) ?? PERSONAL_CONTEXT
        : candidate;
      setActiveContextState(resolved);
      setAccountContextForTransport(resolved);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mwm-account-context-change", { detail: resolved }),
        );
      }
    },
    [businessContexts, canUseAdminContext],
  );

  const value = useMemo<AccountContextState>(
    () => ({
      activeContext,
      businessContexts,
      canUseAdminContext,
      loading,
      setActiveContext,
    }),
    [activeContext, businessContexts, canUseAdminContext, loading, setActiveContext],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccountContext(): AccountContextState {
  const value = useContext(AccountContext);
  if (!value) {
    throw new Error("useAccountContext must be used within AccountContextProvider");
  }
  return value;
}

export function accountContextLabel(context: AccountContextSelection): string {
  if (context.kind === "personal") return "Personal";
  if (context.kind === "admin") return "Admin";
  return context.businessName;
}

export function accountContextKey(context: AccountContextSelection): string {
  return contextIdentity(context);
}
