import type { RenderGroup } from "@/lib/session-model";
import type { SessionRecord } from "@/lib/types";

export type TimePreset = "all" | "today" | "3d" | "7d" | "custom";

export interface SessionFilters {
  search: string;
  tools: string[];
  files: string[];
  branches: string[];
  versions: string[];
  recordTypes: string[];
  timePreset: TimePreset;
  customFrom?: string;
  customTo?: string;
}

export const DEFAULT_FILTERS: SessionFilters = {
  search: "",
  tools: [],
  files: [],
  branches: [],
  versions: [],
  recordTypes: [],
  timePreset: "all",
};

export const RECORD_TYPE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "assistant", label: "Assistant" },
  { value: "thinking", label: "Thinking" },
  { value: "tool_use", label: "Tool use" },
  { value: "tool_result", label: "Tool result" },
  { value: "system", label: "System" },
  { value: "attachment", label: "Attachment" },
];

export const TIME_PRESETS: { value: TimePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last 7 days" },
  { value: "custom", label: "Between" },
];

export function hasActiveFilters(filters: SessionFilters): boolean {
  return (
    filters.tools.length > 0 ||
    filters.files.length > 0 ||
    filters.branches.length > 0 ||
    filters.versions.length > 0 ||
    filters.recordTypes.length > 0 ||
    filters.timePreset !== "all"
  );
}

export function activeFilterCount(filters: SessionFilters): number {
  return (
    filters.tools.length +
    filters.files.length +
    filters.branches.length +
    filters.versions.length +
    filters.recordTypes.length +
    (filters.timePreset !== "all" ? 1 : 0)
  );
}

function computeTimeRange(filters: SessionFilters): {
  from?: number;
  to?: number;
} {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  switch (filters.timePreset) {
    case "today": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { from: start.getTime(), to: now };
    }
    case "3d":
      return { from: now - 3 * DAY_MS, to: now };
    case "7d":
      return { from: now - 7 * DAY_MS, to: now };
    case "custom": {
      const from = filters.customFrom
        ? new Date(filters.customFrom).getTime()
        : undefined;
      const to = filters.customTo
        ? new Date(filters.customTo).getTime() + DAY_MS - 1
        : undefined;
      return { from, to };
    }
    default:
      return {};
  }
}

function recordHasType(record: SessionRecord, types: string[]): boolean {
  if (types.includes(record.type)) return true;
  const content = (record as { message?: { content?: unknown } }).message
    ?.content;
  if (Array.isArray(content)) {
    return content.some((b) =>
      types.includes((b as { type?: string }).type ?? ""),
    );
  }
  return false;
}

function recordHasTool(record: SessionRecord, tools: string[]): boolean {
  const content = (record as { message?: { content?: unknown } }).message
    ?.content;
  if (!Array.isArray(content)) return false;
  return content.some(
    (b) =>
      (b as { type?: string }).type === "tool_use" &&
      tools.includes((b as { name: string }).name),
  );
}

export function filterGroups(
  groups: RenderGroup[],
  filters: SessionFilters,
): RenderGroup[] {
  const search = filters.search.toLowerCase();
  const { from, to } = computeTimeRange(filters);

  return groups.filter((group) => {
    if (from !== undefined || to !== undefined) {
      const timestamp = group.records
        .map((r) => (r as { timestamp?: string }).timestamp)
        .find(Boolean);
      if (timestamp) {
        const t = new Date(timestamp).getTime();
        if (from !== undefined && t < from) return false;
        if (to !== undefined && t > to) return false;
      }
    }

    if (filters.branches.length > 0) {
      const match = group.records.some((r) =>
        filters.branches.includes(
          (r as { gitBranch?: string }).gitBranch ?? "",
        ),
      );
      if (!match) return false;
    }

    if (filters.versions.length > 0) {
      const match = group.records.some((r) =>
        filters.versions.includes((r as { version?: string }).version ?? ""),
      );
      if (!match) return false;
    }

    if (filters.recordTypes.length > 0) {
      const match = group.records.some((r) =>
        recordHasType(r, filters.recordTypes),
      );
      if (!match) return false;
    }

    if (filters.tools.length > 0) {
      const match = group.records.some((r) => recordHasTool(r, filters.tools));
      if (!match) return false;
    }

    if (filters.files.length > 0) {
      const text = JSON.stringify(group.records).toLowerCase();
      const match = filters.files.some((f) => text.includes(f.toLowerCase()));
      if (!match) return false;
    }

    if (search) {
      const text = JSON.stringify(group.records).toLowerCase();
      if (!text.includes(search)) return false;
    }

    return true;
  });
}
