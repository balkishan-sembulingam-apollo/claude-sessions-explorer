import * as React from "react";

import {
  confirmPermission,
  isFileSystemAccessSupported,
  pickRootDirectory,
  restoreRootDirectory,
} from "@/lib/fs-access";
import {
  loadEditorScheme,
  loadTheme,
  saveEditorScheme,
  saveTheme,
} from "@/lib/handle-store";
import { resolveProjectCwd, scanProjects } from "@/lib/scan";
import { parseSessionFile } from "@/lib/parse-session";
import { buildSessionFacets } from "@/lib/session-model";
import type { ProjectInfo, SessionFacets, SessionRecord } from "@/lib/types";

type FolderStatus =
  | "checking"
  | "unsupported"
  | "none"
  | "needs-permission"
  | "loading"
  | "ready"
  | "error";

interface ParsedSession {
  records: SessionRecord[];
  facets: SessionFacets;
}

interface AppStoreValue {
  folderStatus: FolderStatus;
  error?: string;
  rootHandle?: FileSystemDirectoryHandle;
  projects: ProjectInfo[];
  pickFolder: () => Promise<void>;
  allowPersistedFolder: () => Promise<void>;

  theme: "light" | "dark";
  toggleTheme: () => void;
  editorScheme: string;
  setEditorScheme: (scheme: string) => void;

  getSession: (
    project: ProjectInfo,
    sessionId: string,
  ) => Promise<ParsedSession>;
  getSubagentSession: (
    project: ProjectInfo,
    sessionId: string,
    agentId: string,
  ) => Promise<ParsedSession>;
}

const AppStoreContext = React.createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [folderStatus, setFolderStatus] =
    React.useState<FolderStatus>("checking");
  const [error, setError] = React.useState<string>();
  const [rootHandle, setRootHandle] =
    React.useState<FileSystemDirectoryHandle>();
  const [projects, setProjects] = React.useState<ProjectInfo[]>([]);

  const [theme, setTheme] = React.useState<"light" | "dark">(() => loadTheme());
  const [editorScheme, setEditorSchemeState] = React.useState(() =>
    loadEditorScheme(),
  );

  const sessionCache = React.useRef(new Map<string, ParsedSession>());

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const loadFromHandle = React.useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      setFolderStatus("loading");
      setRootHandle(handle);
      try {
        const scanned = await scanProjects(handle);
        setProjects(scanned);
        setFolderStatus("ready");
        // Resolve each project's real cwd asynchronously (one update per project,
        // not per session) so the sidebar/home cards can show a readable name.
        for (const project of scanned) {
          void resolveProjectCwd(project, (cwd) => {
            setProjects((prev) =>
              prev.map((p) => (p.key === project.key ? { ...p, cwd } : p)),
            );
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to read folder");
        setFolderStatus("error");
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!isFileSystemAccessSupported()) {
      setFolderStatus("unsupported");
      return;
    }
    void (async () => {
      const result = await restoreRootDirectory();
      if (result.status === "restored") {
        await loadFromHandle(result.handle);
      } else if (result.status === "needs-permission") {
        setRootHandle(result.handle);
        setFolderStatus("needs-permission");
      } else {
        setFolderStatus("none");
      }
    })();
  }, [loadFromHandle]);

  const pickFolder = React.useCallback(async () => {
    try {
      const handle = await pickRootDirectory();
      await loadFromHandle(handle);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to select folder");
      setFolderStatus("error");
    }
  }, [loadFromHandle]);

  const allowPersistedFolder = React.useCallback(async () => {
    if (!rootHandle) return;
    const granted = await confirmPermission(rootHandle);
    if (granted) await loadFromHandle(rootHandle);
  }, [rootHandle, loadFromHandle]);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      saveTheme(next);
      return next;
    });
  }, []);

  const setEditorScheme = React.useCallback((scheme: string) => {
    setEditorSchemeState(scheme);
    saveEditorScheme(scheme);
  }, []);

  const getSession = React.useCallback(
    async (project: ProjectInfo, sessionId: string): Promise<ParsedSession> => {
      const cacheKey = `${project.key}/${sessionId}`;
      const cached = sessionCache.current.get(cacheKey);
      if (cached) return cached;

      const fileHandle = await project.dirHandle.getFileHandle(
        `${sessionId}.jsonl`,
      );
      const file = await fileHandle.getFile();
      const records = await parseSessionFile(file);
      const facets = buildSessionFacets(records);
      const parsed = { records, facets };
      sessionCache.current.set(cacheKey, parsed);
      return parsed;
    },
    [],
  );

  const getSubagentSession = React.useCallback(
    async (
      project: ProjectInfo,
      sessionId: string,
      agentId: string,
    ): Promise<ParsedSession> => {
      const cacheKey = `${project.key}/${sessionId}/agent-${agentId}`;
      const cached = sessionCache.current.get(cacheKey);
      if (cached) return cached;

      const sessionDir = await project.dirHandle.getDirectoryHandle(sessionId);
      const subagentsDir = await sessionDir.getDirectoryHandle("subagents");
      const fileHandle = await subagentsDir.getFileHandle(
        `agent-${agentId}.jsonl`,
      );
      const file = await fileHandle.getFile();
      const records = await parseSessionFile(file);
      const facets = buildSessionFacets(records);
      const parsed = { records, facets };
      sessionCache.current.set(cacheKey, parsed);
      return parsed;
    },
    [],
  );

  const value: AppStoreValue = {
    folderStatus,
    error,
    rootHandle,
    projects,
    pickFolder,
    allowPersistedFolder,
    theme,
    toggleTheme,
    editorScheme,
    setEditorScheme,
    getSession,
    getSubagentSession,
  };

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const ctx = React.useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
