// Shapes for the on-disk ~/.claude/projects format. See plan doc for the full spec.
// We only type what we render; unknown fields pass through via [key: string]: unknown.

export type ContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | {
      type: "tool_result";
      tool_use_id: string;
      is_error?: boolean | null;
      content: string | ContentBlock[];
    }
  | { type: "thinking"; thinking: string; signature?: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    }
  | UnknownContentBlock;

export interface UnknownContentBlock {
  type: string;
  [key: string]: unknown;
}

export interface EnvelopeFields {
  uuid?: string;
  parentUuid?: string | null;
  sessionId?: string;
  timestamp?: string;
  cwd?: string;
  gitBranch?: string;
  version?: string;
  isSidechain?: boolean;
  userType?: string;
  entrypoint?: string;
  promptId?: string;
  permissionMode?: string;
  agentId?: string;
}

export interface UserRecord extends EnvelopeFields {
  type: "user";
  message: { role: "user"; content: string | ContentBlock[] };
  toolUseResult?: Record<string, unknown>;
  isCompactSummary?: boolean;
  isMeta?: boolean;
}

export interface AssistantRecord extends EnvelopeFields {
  type: "assistant";
  message: {
    id: string;
    model?: string;
    role: "assistant";
    content: ContentBlock[];
    stop_reason?: string | null;
  };
  requestId?: string;
  attributionSkill?: string;
  attributionAgent?: string;
  attributionMcpTool?: string;
}

export interface SystemRecord extends EnvelopeFields {
  type: "system";
  subtype?: string;
  level?: string | null;
  content?: string | null;
  compactMetadata?: {
    trigger?: string;
    preTokens?: number;
    postTokens?: number;
    [key: string]: unknown;
  };
  logicalParentUuid?: string;
}

export interface AttachmentRecord extends EnvelopeFields {
  type: "attachment";
  attachment: { type: string; [key: string]: unknown };
}

export interface MetaRecord {
  type:
    | "ai-title"
    | "custom-title"
    | "mode"
    | "permission-mode"
    | "pr-link"
    | "last-prompt"
    | "queue-operation"
    | "file-history-snapshot";
  sessionId?: string;
  aiTitle?: string;
  customTitle?: string;
  [key: string]: unknown;
}

export type SessionRecord =
  UserRecord | AssistantRecord | SystemRecord | AttachmentRecord | MetaRecord;

export function isConversationRecord(
  r: SessionRecord,
): r is UserRecord | AssistantRecord | SystemRecord | AttachmentRecord {
  return (
    r.type === "user" ||
    r.type === "assistant" ||
    r.type === "system" ||
    r.type === "attachment"
  );
}

export interface SessionMeta {
  sessionId: string;
  fileName: string;
  title: string;
  size: number;
  lastModified: number;
  startedAt?: string;
  endedAt?: string;
  cwd?: string;
  gitBranch?: string;
  version?: string;
  messageCount: number;
  hasSubagents: boolean;
  hasCompaction: boolean;
}

export interface MemoryFile {
  name: string;
  fileName: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface ProjectInfo {
  key: string; // short hash of dirName, used as the routing key (dirName is too long for a URL)
  dirName: string;
  cwd?: string; // real path, resolved lazily from session cwd
  sessionCount: number;
  lastActivity: number;
  sessions: SessionMeta[];
  memoryFiles: MemoryFile[];
  dirHandle: FileSystemDirectoryHandle;
}

export interface SessionFacets {
  tools: string[];
  files: string[];
  branches: string[];
  versions: string[];
  minTime?: string;
  maxTime?: string;
}
