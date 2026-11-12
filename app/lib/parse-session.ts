import type { SessionRecord } from "@/lib/types";

const MAX_INLINE_STRING = 20_000;

/** Truncate huge inline strings (base64 images, giant tool output) for display. */
export function truncateForDisplay(
  value: string,
  max = MAX_INLINE_STRING,
): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n… truncated (${value.length.toLocaleString()} chars total)`;
}

/**
 * Strip Claude Code's system-injected tag wrappers (<ide_opened_file>, <command-message>,
 * <local-command-caveat>, etc.) so raw XML doesn't leak into a title derived from message text.
 */
export function stripInjectedTags(raw: string): string {
  return raw
    .replace(/<([a-zA-Z][\w-]*)>[\s\S]*?<\/\1>/g, " ")
    .replace(/<\/?[a-zA-Z][\w-]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Stream a session .jsonl file line by line, parsing each independently.
 * Malformed lines are skipped rather than aborting the whole parse.
 */
export async function parseSessionFile(file: File): Promise<SessionRecord[]> {
  const records: SessionRecord[] = [];
  const stream = file.stream().pipeThrough(new TextDecoderStream());
  const reader = stream.getReader();

  let buffer = "";
  const consumeBuffer = (chunk: string, isFinal: boolean) => {
    buffer += chunk;
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      pushLine(line);
    }
    if (isFinal && buffer.trim()) {
      pushLine(buffer);
      buffer = "";
    }
  };

  const pushLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      records.push(JSON.parse(trimmed) as SessionRecord);
    } catch {
      // skip malformed line
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) {
      consumeBuffer("", true);
      break;
    }
    consumeBuffer(value, false);
  }

  return records;
}

/**
 * Cheap pass: read only enough of the file to get a title/cwd/branch hint,
 * without parsing every line. Used for the fast project list.
 */
export async function parseSessionMetaHint(file: File): Promise<{
  cwd?: string;
  gitBranch?: string;
  version?: string;
  title?: string;
  startedAt?: string;
}> {
  // Read only the first ~64KB — enough to hit the first few records, which
  // is where cwd/branch/version/title records typically appear.
  const head = await file.slice(0, 65_536).text();
  const lines = head.split("\n");
  let cwd: string | undefined;
  let gitBranch: string | undefined;
  let version: string | undefined;
  let title: string | undefined;
  let startedAt: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (!cwd && typeof obj.cwd === "string") cwd = obj.cwd;
    if (!gitBranch && typeof obj.gitBranch === "string")
      gitBranch = obj.gitBranch;
    if (!version && typeof obj.version === "string") version = obj.version;
    if (!startedAt && typeof obj.timestamp === "string")
      startedAt = obj.timestamp;
    if (obj.type === "ai-title" && typeof obj.aiTitle === "string")
      title = obj.aiTitle;
    if (obj.type === "custom-title" && typeof obj.customTitle === "string")
      title = obj.customTitle;
    if (!title && obj.type === "user") {
      const content = (obj.message as { content?: unknown } | undefined)
        ?.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content.find(
                (b): b is { type: "text"; text: string } =>
                  typeof b === "object" &&
                  b !== null &&
                  (b as { type?: string }).type === "text",
              )?.text
            : undefined;
      const cleaned = text ? stripInjectedTags(text) : "";
      if (cleaned) title = cleaned.slice(0, 120);
    }
    if (cwd && gitBranch && version && title) break;
  }

  return { cwd, gitBranch, version, title, startedAt };
}
