import { parseSessionMetaHint } from "@/lib/parse-session";
import { basename } from "@/lib/format";
import type { ProjectInfo } from "@/lib/types";

export interface GlobalSearchResult {
  projectKey: string;
  projectLabel: string;
  sessionId: string;
  sessionTitle: string;
  snippet: string;
  /** The matching record's own uuid — used as a #hash to scroll straight to it. */
  recordUuid?: string;
}

const MAX_RESULTS = 30;
const MAX_SNIPPET_LENGTH = 160;

/** Find the first matching line in a session file without reading the whole file when a match comes early. */
async function findFirstMatch(
  file: File,
  needle: string,
): Promise<string | null> {
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.toLowerCase().includes(needle)) {
          void reader.cancel();
          return line;
        }
      }
    }
    if (buffer.toLowerCase().includes(needle)) return buffer;
  } catch {
    // stream cancelled or unreadable; treat as no match
  }
  return null;
}

function extractUuid(line: string): string | undefined {
  try {
    const parsed = JSON.parse(line);
    return typeof parsed?.uuid === "string" ? parsed.uuid : undefined;
  } catch {
    return undefined;
  }
}

function extractSnippet(line: string, needle: string): string {
  let text = line;
  try {
    const parsed = JSON.parse(line);
    const content = parsed?.message?.content;
    if (typeof content === "string") text = content;
    else if (Array.isArray(content)) {
      const textBlock = content.find(
        (b: { type?: string }) => b && b.type === "text",
      ) as { text?: string } | undefined;
      if (textBlock?.text) text = textBlock.text;
    }
  } catch {
    // not JSON, or shape unexpected — fall back to the raw line
  }

  text = text.replace(/\s+/g, " ").trim();
  const idx = text.toLowerCase().indexOf(needle);
  if (idx === -1) return text.slice(0, MAX_SNIPPET_LENGTH);

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + needle.length + 80);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

/**
 * Search every session across every project for a plain-text match.
 * Stops once MAX_RESULTS is reached; each session file is read line-by-line
 * and abandoned as soon as a match is found, so large files aren't read in full.
 */
export async function searchAllSessions(
  projects: ProjectInfo[],
  query: string,
  isCancelled: () => boolean,
): Promise<GlobalSearchResult[]> {
  const needle = query.toLowerCase();
  const results: GlobalSearchResult[] = [];

  outer: for (const project of projects) {
    const projectLabel = basename(project.cwd ?? project.dirName);
    for (const session of project.sessions) {
      if (isCancelled()) return results;
      try {
        const fileHandle = await project.dirHandle.getFileHandle(
          session.fileName,
        );
        const file = await fileHandle.getFile();
        const match = await findFirstMatch(file, needle);
        if (match) {
          const hint = await parseSessionMetaHint(file).catch(() => undefined);
          results.push({
            projectKey: project.key,
            projectLabel,
            sessionId: session.sessionId,
            sessionTitle: hint?.title ?? session.title,
            snippet: extractSnippet(match, needle),
            recordUuid: extractUuid(match),
          });
          if (results.length >= MAX_RESULTS) break outer;
        }
      } catch {
        // unreadable session file; skip it
      }
    }
  }

  return results;
}
