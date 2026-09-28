export type KinfolkTaskCategory =
  | "grocery"
  | "errand"
  | "reminder"
  | "order"
  | "appointment"
  | "other";

export type KinfolkTaskAction = Readonly<{
  type: "create_list" | "create_task" | "add_tasks";
  list?: { name: string; icon?: string };
  tasks: Array<{
    title: string;
    notes: string | null;
    dueAt: string | null;
    dueTimeLabel: string | null;
    category: KinfolkTaskCategory;
  }>;
}>;

const CATEGORIES = new Set<KinfolkTaskCategory>([
  "grocery",
  "errand",
  "reminder",
  "order",
  "appointment",
  "other",
]);

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 0 && text.length <= maxLength ? text : null;
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (value == null) return null;
  return cleanText(value, maxLength);
}

function validDueAt(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string" || value.length > 80) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Validates untrusted model task proposals before they reach the existing task
 * routes. This does not create a task: clients still require the member to
 * select Save reminder, then use the established authenticated endpoints.
 */
export function normalizeKinfolkTaskAction(value: unknown): KinfolkTaskAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const type = candidate.type;
  if (type !== "create_list" && type !== "create_task" && type !== "add_tasks") {
    return null;
  }
  if (!Array.isArray(candidate.tasks) || candidate.tasks.length < 1 || candidate.tasks.length > 25) {
    return null;
  }
  const tasks = candidate.tasks.flatMap((task) => {
    if (!task || typeof task !== "object" || Array.isArray(task)) return [];
    const row = task as Record<string, unknown>;
    const title = cleanText(row.title, 160);
    const notes = optionalText(row.notes, 1_000);
    const dueAt = validDueAt(row.dueAt);
    const dueTimeLabel = optionalText(row.dueTimeLabel, 120);
    const category = CATEGORIES.has(row.category as KinfolkTaskCategory)
      ? row.category as KinfolkTaskCategory
      : "other";
    // An invalid provided date is distinct from an omitted date and must not be
    // silently discarded into an undated reminder.
    if (!title || (row.dueAt != null && !dueAt) || (row.notes != null && !notes) || (row.dueTimeLabel != null && !dueTimeLabel)) {
      return [];
    }
    return [{ title, notes, dueAt, dueTimeLabel, category }];
  });
  if (tasks.length !== candidate.tasks.length) return null;

  if (type !== "create_list") return { type, tasks };
  if (!candidate.list || typeof candidate.list !== "object" || Array.isArray(candidate.list)) return null;
  const list = candidate.list as Record<string, unknown>;
  const name = cleanText(list.name, 100);
  const icon = optionalText(list.icon, 12);
  return name
    ? { type, list: { name, ...(icon ? { icon } : {}) }, tasks }
    : null;
}
