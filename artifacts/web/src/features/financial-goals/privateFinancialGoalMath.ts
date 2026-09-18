export type PrivateFinancialGoalCalculation =
  | { kind: "insufficient"; message: string; errors: Partial<Record<"targetAmount" | "deadline" | "currentSavedAmount", string>> }
  | { kind: "complete"; monthlyAmount: number; remainingAmount: number; months: number; errors: Record<string, never> };

type ParsedMoney =
  | { valid: true; value: number | null }
  | { valid: false; value: null };

const AVERAGE_DAYS_PER_MONTH = 30.4375;

function parseOptionalMoney(value: string): ParsedMoney {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true, value: null };

  const normalized = trimmed.replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return { valid: false, value: null };

  const amount = Number(normalized);
  return Number.isFinite(amount) ? { valid: true, value: amount } : { valid: false, value: null };
}

function isFutureCalendarDate(value: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const deadline = new Date(year, month - 1, day);
  if (deadline.getFullYear() !== year || deadline.getMonth() !== month - 1 || deadline.getDate() !== day) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return deadline > today;
}

/**
 * Performs only transparent worksheet math. It does not infer a budget,
 * income, debt, credit history, or any other financial circumstance.
 */
export function calculatePrivateFinancialGoalMonthlyAmount(
  values: { targetAmount: string; currentSavedAmount: string; deadline: string },
  now = new Date(),
): PrivateFinancialGoalCalculation {
  const target = parseOptionalMoney(values.targetAmount);
  const current = parseOptionalMoney(values.currentSavedAmount);
  const errors: Partial<Record<"targetAmount" | "deadline" | "currentSavedAmount", string>> = {};

  if (!target.valid || (target.value !== null && target.value <= 0)) {
    errors.targetAmount = "Enter a target amount greater than zero, using numbers only.";
  }
  if (!current.valid || (current.value !== null && current.value < 0)) {
    errors.currentSavedAmount = "Enter a current saved amount of zero or more, using numbers only.";
  }
  if (values.deadline && !isFutureCalendarDate(values.deadline, now)) {
    errors.deadline = "Choose a future deadline.";
  }
  if (target.value !== null && current.value !== null && current.value > target.value) {
    errors.currentSavedAmount = "For this worksheet math, current saved cannot be greater than the target.";
  }

  if (Object.keys(errors).length > 0) {
    return { kind: "insufficient", message: "Fix the highlighted voluntary input to see simple monthly math.", errors };
  }

  if (target.value === null || !values.deadline) {
    return {
      kind: "insufficient",
      message: "No monthly amount to show yet. Enter a target amount and a future deadline if you want to see simple worksheet math.",
      errors,
    };
  }

  if (!isFutureCalendarDate(values.deadline, now)) {
    return { kind: "insufficient", message: "Choose a future deadline to see simple monthly math.", errors };
  }

  const [year, month, day] = values.deadline.split("-").map(Number);
  const deadline = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
  const months = Math.max(1, Math.ceil(daysUntilDeadline / AVERAGE_DAYS_PER_MONTH));
  const remainingAmount = Math.max(0, target.value - (current.value ?? 0));

  return {
    kind: "complete",
    monthlyAmount: remainingAmount / months,
    remainingAmount,
    months,
    errors: {},
  };
}

export function formatPrivateWorksheetCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function isExplicitSavingsGoalPrompt(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return /\b(?:save|saving|savings)\b[\s\S]{0,80}\b(?:for|toward|towards)\s+\S/.test(normalized);
}

export const PRIVATE_FINANCIAL_GOAL_PRIVACY_NOTICE =
  "Details you enter stay only in this page's temporary browser state. We do not save them to the app, server, profile, Kinfolk memory, Library, analytics, or community and Circle surfaces. They disappear when you refresh or leave this page.";

export const PRIVATE_FINANCIAL_GOAL_EDUCATION_NOTICE =
  "This worksheet is general education, not financial, legal, tax, or credit advice.";

export const PRIVATE_FINANCIAL_GOAL_OFFER_COPY =
  "This starts blank. Kinfolk does not transfer this conversation, numbers, or private context.";

export const PRIVATE_FINANCIAL_GOAL_ROUTE = "/resources/financial-goals";

export { parseOptionalMoney };
