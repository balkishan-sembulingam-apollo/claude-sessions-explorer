import * as React from "react";

import {
  checkPermission,
  confirmPermission,
  isFileSystemAccessSupported,
  pickAdHocDirectory,
  pickClaudeHomeDirectory,
  restoreClaudeHomeDirectory,
} from "@/lib/fs-access";
import {
  loadCustomConfigFolders,
  saveCustomConfigFolders,
  type CustomConfigFolder,
} from "@/lib/handle-store";
import {
  readGlobalClaudeConfig,
  readProjectClaudeConfig,
  type GlobalClaudeConfig,
  type ProjectClaudeConfig,
} from "@/lib/claude-config";

export type HomeStatus =
  "checking" | "unsupported" | "none" | "needs-permission" | "ready" | "error";

/** "root" = the home-directory grant; any other string is a CustomConfigFolder id. */
export type ConfigScope = "root" | string;

interface SettingsConfigValue {
  homeStatus: HomeStatus;
  homeGranted: boolean;
  error?: string;
  pickHome: () => Promise<void>;
  allowHome: () => Promise<void>;

  scope: ConfigScope;
  setScope: (scope: ConfigScope) => void;
  customFolders: CustomConfigFolder[];
  addCustomFolder: () => Promise<void>;
  removeCustomFolder: (id: string) => void;

  globalConfig: GlobalClaudeConfig | null;
  globalLoading: boolean;
  customConfig: ProjectClaudeConfig | null;
  customLoading: boolean;
  activeCustomFolder: CustomConfigFolder | undefined;
}

const SettingsConfigContext = React.createContext<SettingsConfigValue | null>(
  null,
);

export function SettingsConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [homeStatus, setHomeStatus] = React.useState<HomeStatus>("checking");
  const [homeHandle, setHomeHandle] =
    React.useState<FileSystemDirectoryHandle>();
  const [error, setError] = React.useState<string>();

  const [scope, setScope] = React.useState<ConfigScope>("root");
  const [customFolders, setCustomFolders] = React.useState<
    CustomConfigFolder[]
  >([]);

  const [globalConfig, setGlobalConfig] =
    React.useState<GlobalClaudeConfig | null>(null);
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [customConfig, setCustomConfig] =
    React.useState<ProjectClaudeConfig | null>(null);
  const [customLoading, setCustomLoading] = React.useState(false);

  // Restore the home-directory grant, same "pick once, remember forever" flow as the sessions folder.
  React.useEffect(() => {
    if (!isFileSystemAccessSupported()) {
      setHomeStatus("unsupported");
      return;
    }
    void (async () => {
      const result = await restoreClaudeHomeDirectory();
      if (result.status === "restored") {
        setHomeHandle(result.handle);
        setHomeStatus("ready");
      } else if (result.status === "needs-permission") {
        setHomeHandle(result.handle);
        setHomeStatus("needs-permission");
      } else {
        setHomeStatus("none");
      }
    })();
  }, []);

  // Restore the cached custom-folder list on mount.
  React.useEffect(() => {
    void loadCustomConfigFolders().then(setCustomFolders);
  }, []);

  React.useEffect(() => {
    if (homeStatus !== "ready" || !homeHandle || scope !== "root") return;
    setGlobalLoading(true);
    void readGlobalClaudeConfig(homeHandle)
      .then(setGlobalConfig)
      .finally(() => setGlobalLoading(false));
  }, [homeStatus, homeHandle, scope]);

  const activeCustomFolder = customFolders.find((f) => f.id === scope);

  React.useEffect(() => {
    if (scope === "root" || !activeCustomFolder) return;
    let cancelled = false;
    setCustomLoading(true);
    void (async () => {
      const state = await checkPermission(activeCustomFolder.handle);
      if (state !== "granted") {
        const granted = await confirmPermission(activeCustomFolder.handle);
        if (!granted) {
          if (!cancelled) setCustomLoading(false);
          return;
        }
      }
      const config = await readProjectClaudeConfig(activeCustomFolder.handle);
      if (!cancelled) {
        setCustomConfig(config);
        setCustomLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, activeCustomFolder]);

  const pickHome = React.useCallback(async () => {
    try {
      const handle = await pickClaudeHomeDirectory();
      setHomeHandle(handle);
      setHomeStatus("ready");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to select folder");
      setHomeStatus("error");
    }
  }, []);

  const allowHome = React.useCallback(async () => {
    if (!homeHandle) return;
    const granted = await confirmPermission(homeHandle);
    if (granted) setHomeStatus("ready");
  }, [homeHandle]);

  const addCustomFolder = React.useCallback(async () => {
    try {
      const handle = await pickAdHocDirectory();
      const id = crypto.randomUUID();
      const next = [...customFolders, { id, handle }];
      setCustomFolders(next);
      await saveCustomConfigFolders(next);
      setScope(id);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }
  }, [customFolders]);

  const removeCustomFolder = React.useCallback(
    (id: string) => {
      const next = customFolders.filter((f) => f.id !== id);
      setCustomFolders(next);
      void saveCustomConfigFolders(next);
      setScope((prev) => (prev === id ? "root" : prev));
    },
    [customFolders],
  );

  const value: SettingsConfigValue = {
    homeStatus,
    homeGranted: homeStatus === "ready",
    error,
    pickHome,
    allowHome,
    scope,
    setScope,
    customFolders,
    addCustomFolder,
    removeCustomFolder,
    globalConfig,
    globalLoading,
    customConfig,
    customLoading,
    activeCustomFolder,
  };

  return (
    <SettingsConfigContext.Provider value={value}>
      {children}
    </SettingsConfigContext.Provider>
  );
}

export function useSettingsConfig(): SettingsConfigValue {
  const ctx = React.useContext(SettingsConfigContext);
  if (!ctx)
    throw new Error(
      "useSettingsConfig must be used within SettingsConfigProvider",
    );
  return ctx;
}
