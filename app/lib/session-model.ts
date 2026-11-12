import { stripInjectedTags } from "@/lib/parse-session";
import type {
  AssistantRecord,
  SessionFacets,
  SessionMeta,
  SessionRecord,
  UserRecord,
} from "@/lib/types";

/** Derive display metadata for a session from its fully parsed record array. */
export function buildSessionMeta(
  sessionId: string,
  fileName: string,
  records: SessionRecord[],
  size: number,
  lastModified: number,
): SessionMeta {
  let title: string = sessionId;
  let titleSet = false;
  let cwd: string | undefined;
  let gitBranch: string | undefined;
  let version: string | undefined;
  let startedAt: string | undefined;
  let endedAt: string | undefined;
  let messageCount = 0;
  let hasSubagents = false;
  let hasCompaction = false;

  for (const r of records) {
    if (r.type === "custom-title" && typeof r.customTitle === "string") {
      title = r.customTitle;
      titleSet = true;
    } else if (
      r.type === "ai-title" &&
      typeof r.aiTitle === "string" &&
      !titleSet
    ) {
      title = r.aiTitle;
      titleSet = true;
    } else if (r.type === "user" || r.type === "assistant") {
      messageCount++;
      const env = r as UserRecord | AssistantRecord;
      if (env.cwd) cwd = env.cwd;
      if (env.gitBranch) gitBranch = env.gitBranch;
      if (env.version) version = env.version;
      if (env.timestamp) {
        if (!startedAt) startedAt = env.timestamp;
        endedAt = env.timestamp;
      }
      if (r.type === "assistant") {
        for (const block of r.message.content) {
          if (
            block.type === "tool_use" &&
            (block as { name: string }).name === "Task"
          ) {
            hasSubagents = true;
          }
        }
      }
    } else if (r.type === "system" && r.subtype === "compact_boundary") {
      hasCompaction = true;
    }
  }

  if (!titleSet) {
    for (const r of records) {
      if (r.type !== "user") continue;
      const content = (r as UserRecord).message.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? (
                content.find((b) => b.type === "text") as
                  { text: string } | undefined
              )?.text
            : undefined;
      const cleaned = text ? stripInjectedTags(text) : "";
      if (cleaned) {
        title = cleaned.slice(0, 120);
        break;
      }
    }
  }

  return {
    sessionId,
    fileName,
    title,
    size,
    lastModified,
    startedAt,
    endedAt,
    cwd,
    gitBranch,
    version,
    messageCount,
    hasSubagents,
    hasCompaction,
  };
}

/** Derive filter facets (tools used, files touched, branches, versions, time range) in one pass. */
export function buildSessionFacets(records: SessionRecord[]): SessionFacets {
  const tools = new Set<string>();
  const files = new Set<string>();
  const branches = new Set<string>();
  const versions = new Set<string>();
  let minTime: string | undefined;
  let maxTime: string | undefined;

  for (const r of records) {
    if (r.type === "assistant") {
      for (const block of r.message.content) {
        if (block.type === "tool_use") {
          const toolUse = block as {
            name: string;
            input: Record<string, unknown>;
          };
          tools.add(toolUse.name);
          const input = toolUse.input;
          const filePath = input?.file_path ?? input?.path ?? input?.filePath;
          if (typeof filePath === "string") files.add(filePath);
        }
      }
    }
    const env = r as {
      gitBranch?: string;
      version?: string;
      timestamp?: string;
    };
    if (env.gitBranch) branches.add(env.gitBranch);
    if (env.version) versions.add(env.version);
    if (env.timestamp) {
      if (!minTime || env.timestamp < minTime) minTime = env.timestamp;
      if (!maxTime || env.timestamp > maxTime) maxTime = env.timestamp;
    }
  }

  return {
    tools: Array.from(tools).sort(),
    files: Array.from(files).sort(),
    branches: Array.from(branches).sort(),
    versions: Array.from(versions).sort(),
    minTime,
    maxTime,
  };
}

/** Map tool_use id -> tool name, so a later tool_result can show which tool it answers. */
export function buildToolNameIndex(
  records: SessionRecord[],
): Map<string, string> {
  const index = new Map<string, string>();
  for (const r of records) {
    if (r.type !== "assistant") continue;
    for (const block of r.message.content) {
      if (block.type === "tool_use") {
        const toolUse = block as { id: string; name: string };
        index.set(toolUse.id, toolUse.name);
      }
    }
  }
  return index;
}

/**
 * Group a flat record array so a single assistant turn split across multiple
 * lines (sharing message.id) renders as one block. Records are otherwise
 * left in file (append) order — we do not reconstruct order via parentUuid.
 */
export interface RenderGroup {
  key: string;
  records: SessionRecord[];
}

export function groupRecordsForRender(records: SessionRecord[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let lastAssistantMessageId: string | null = null;

  for (const r of records) {
    if (r.type === "assistant" && r.message.id) {
      if (lastAssistantMessageId === r.message.id && groups.length > 0) {
        groups[groups.length - 1].records.push(r);
        continue;
      }
      lastAssistantMessageId = r.message.id;
      // Key off the record's own uuid, not message.id — the same message.id
      // can legitimately reappear in a later, non-adjacent group (e.g. across
      // a compaction boundary), and React keys must be unique across the list.
      const key =
        (r as { uuid?: string }).uuid ?? `${r.message.id}-${groups.length}`;
      groups.push({ key, records: [r] });
      continue;
    }
    lastAssistantMessageId = null;
    const key = (r as { uuid?: string }).uuid ?? `${groups.length}`;
    groups.push({ key, records: [r] });
  }

  return groups;
}
