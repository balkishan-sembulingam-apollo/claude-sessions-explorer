import { parseFrontmatter } from "@/lib/frontmatter";
import { parseSessionMetaHint } from "@/lib/parse-session";
import type { MemoryFile, ProjectInfo, SessionMeta } from "@/lib/types";
import { shortHash } from "@/lib/utils";

async function* iterateEntries(
  dir: FileSystemDirectoryHandle,
): AsyncGenerator<[string, FileSystemHandle]> {
  const anyDir = dir as unknown as {
    entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
  };
  yield* anyDir.entries();
}

/** Fast pass: list projects + sessions from filenames/sizes only, no file reads. */
export async function scanProjects(
  root: FileSystemDirectoryHandle,
): Promise<ProjectInfo[]> {
  const projects: ProjectInfo[] = [];

  for await (const [name, handle] of iterateEntries(root)) {
    if (handle.kind !== "directory" || name.startsWith(".")) continue;
    const dirHandle = handle as FileSystemDirectoryHandle;

    const sessions: SessionMeta[] = [];
    let memoryFiles: MemoryFile[] = [];
    let lastActivity = 0;

    for await (const [entryName, entryHandle] of iterateEntries(dirHandle)) {
      if (entryHandle.kind === "file" && entryName.endsWith(".jsonl")) {
        const fileHandle = entryHandle as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const sessionId = entryName.replace(/\.jsonl$/, "");
        sessions.push({
          sessionId,
          fileName: entryName,
          title: sessionId,
          size: file.size,
          lastModified: file.lastModified,
          messageCount: 0,
          hasSubagents: false,
          hasCompaction: false,
        });
        lastActivity = Math.max(lastActivity, file.lastModified);
      } else if (entryHandle.kind === "directory" && entryName === "memory") {
        memoryFiles = await scanMemoryFiles(
          entryHandle as FileSystemDirectoryHandle,
        );
      }
    }

    sessions.sort((a, b) => b.lastModified - a.lastModified);

    projects.push({
      key: shortHash(name),
      dirName: name,
      sessionCount: sessions.length,
      lastActivity,
      sessions,
      memoryFiles,
      dirHandle,
    });
  }

  projects.sort((a, b) => b.lastActivity - a.lastActivity);
  return projects;
}

async function scanMemoryFiles(
  memoryDir: FileSystemDirectoryHandle,
): Promise<MemoryFile[]> {
  const files: MemoryFile[] = [];
  for await (const [name, handle] of iterateEntries(memoryDir)) {
    if (handle.kind !== "file" || !name.endsWith(".md")) continue;
    const file = await (handle as FileSystemFileHandle).getFile();
    const raw = await file.text();
    const { frontmatter, body } = parseFrontmatter(raw);
    files.push({
      name: (frontmatter.name as string) ?? name.replace(/\.md$/, ""),
      fileName: name,
      frontmatter,
      body,
    });
  }
  // Directory iteration order isn't guaranteed stable by the File System Access
  // API, so sort deterministically to keep the sidebar list from reshuffling.
  files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

/**
 * Resolve a project's real cwd from the most recently modified session that has
 * one, so the UI can show a readable folder name instead of the encoded dirName.
 * This fires a single update for the whole project — it does not touch
 * `project.sessions`. Session titles are resolved independently, per row, by
 * the sidebar itself, so one session's title becoming ready never re-renders
 * the rest of the list.
 */
export async function resolveProjectCwd(
  project: ProjectInfo,
  onUpdate: (cwd: string) => void,
): Promise<void> {
  for (const session of project.sessions) {
    try {
      const fileHandle = await project.dirHandle.getFileHandle(
        session.fileName,
      );
      const file = await fileHandle.getFile();
      const hint = await parseSessionMetaHint(file);
      if (hint.cwd) {
        onUpdate(hint.cwd);
        return;
      }
    } catch {
      // try the next session
    }
  }
}
