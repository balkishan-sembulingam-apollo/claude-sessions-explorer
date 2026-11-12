export interface JsonFileResult {
  fileName: string;
  exists: boolean;
  data?: unknown;
  raw?: string;
  error?: string;
  /** True if the read failed for a reason other than "file genuinely doesn't exist" (e.g. denied permission). */
  permissionDenied?: boolean;
}

async function readJsonIfExists(
  dir: FileSystemDirectoryHandle,
  fileName: string,
): Promise<JsonFileResult> {
  let handle: FileSystemFileHandle;
  try {
    handle = await dir.getFileHandle(fileName);
  } catch (e) {
    if (e instanceof DOMException && e.name === "NotFoundError") {
      return { fileName, exists: false };
    }
    // NotAllowedError, SecurityError, etc. — the file may well exist, we just
    // can't confirm it. Surface that distinctly instead of claiming "not found".
    return {
      fileName,
      exists: false,
      permissionDenied: true,
      error: e instanceof Error ? e.message : "Could not read this file",
    };
  }

  try {
    const file = await handle.getFile();
    const raw = await file.text();
    try {
      return { fileName, exists: true, data: JSON.parse(raw), raw };
    } catch {
      return { fileName, exists: true, raw, error: "File is not valid JSON" };
    }
  } catch (e) {
    return {
      fileName,
      exists: false,
      permissionDenied: true,
      error: e instanceof Error ? e.message : "Could not read this file",
    };
  }
}

export interface GlobalClaudeConfig {
  settings: JsonFileResult;
  settingsLocal: JsonFileResult;
  policyLimits: JsonFileResult;
  remoteSettings: JsonFileResult;
  mcpNeedsAuth: JsonFileResult;
}

/**
 * Chromium refuses to grant a directory handle for the user's home directory
 * (and other well-known "sensitive" folders) via showDirectoryPicker — it's on
 * an internal blocklist. So "Root" scope targets ~/.claude directly instead of
 * ~ itself. That also means ~/.claude.json (a sibling of .claude, not inside
 * it) is permanently out of reach for a client-only app — there is no way to
 * read it without a broader grant the browser won't allow.
 */
export async function readGlobalClaudeConfig(
  claudeDir: FileSystemDirectoryHandle,
): Promise<GlobalClaudeConfig> {
  const [settings, settingsLocal, policyLimits, remoteSettings, mcpNeedsAuth] =
    await Promise.all([
      readJsonIfExists(claudeDir, "settings.json"),
      readJsonIfExists(claudeDir, "settings.local.json"),
      readJsonIfExists(claudeDir, "policy-limits.json"),
      readJsonIfExists(claudeDir, "remote-settings.json"),
      readJsonIfExists(claudeDir, "mcp-needs-auth-cache.json"),
    ]);

  return {
    settings,
    settingsLocal,
    policyLimits,
    remoteSettings,
    mcpNeedsAuth,
  };
}

export interface ProjectClaudeConfig {
  settings: JsonFileResult;
  settingsLocal: JsonFileResult;
  mcpConfig: JsonFileResult;
}

/** Read a specific project folder's local Claude settings and MCP config. */
export async function readProjectClaudeConfig(
  projectHandle: FileSystemDirectoryHandle,
): Promise<ProjectClaudeConfig> {
  const mcpConfig = await readJsonIfExists(projectHandle, ".mcp.json");

  let claudeDir: FileSystemDirectoryHandle | undefined;
  try {
    claudeDir = await projectHandle.getDirectoryHandle(".claude");
  } catch {
    claudeDir = undefined;
  }

  if (!claudeDir) {
    return {
      settings: { fileName: "settings.json", exists: false },
      settingsLocal: { fileName: "settings.local.json", exists: false },
      mcpConfig,
    };
  }

  const [settings, settingsLocal] = await Promise.all([
    readJsonIfExists(claudeDir, "settings.json"),
    readJsonIfExists(claudeDir, "settings.local.json"),
  ]);

  return { settings, settingsLocal, mcpConfig };
}

export interface PermissionRules {
  allow: string[];
  deny: string[];
  ask: string[];
}

/** Pull the allow/deny/ask permission rule lists out of a settings.json payload. */
export function extractPermissions(data: unknown): PermissionRules | null {
  if (!data || typeof data !== "object") return null;
  const permissions = (data as Record<string, unknown>).permissions;
  if (!permissions || typeof permissions !== "object") return null;
  const p = permissions as Record<string, unknown>;

  const toStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string")
      : [];

  return {
    allow: toStringArray(p.allow),
    deny: toStringArray(p.deny),
    ask: toStringArray(p.ask),
  };
}

/** Read the session auto-cleanup window (in days) from a settings.json payload, if configured. */
export function extractCleanupDays(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const value = (data as Record<string, unknown>).cleanupPeriodDays;
  return typeof value === "number" ? value : null;
}

export interface McpServerEntry {
  name: string;
  config: unknown;
}

/** Pull the configured MCP server map out of a ~/.claude.json or .mcp.json payload. */
export function extractMcpServers(data: unknown): McpServerEntry[] {
  if (!data || typeof data !== "object") return [];
  const servers = (data as Record<string, unknown>).mcpServers;
  if (!servers || typeof servers !== "object") return [];
  return Object.entries(servers as Record<string, unknown>).map(
    ([name, config]) => ({
      name,
      config,
    }),
  );
}

/** Pull the list of MCP server names that still need authentication. */
export function extractMcpNeedsAuth(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.filter((key) => {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (value && typeof value === "object") {
      return Boolean((value as Record<string, unknown>).needsAuth);
    }
    return false;
  });
}
