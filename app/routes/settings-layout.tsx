import { Outlet } from "react-router";

import { RetentionAlert } from "@/components/settings/RetentionAlert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsConfig } from "@/contexts/settings-config-store";
import { extractCleanupDays } from "@/lib/claude-config";

export default function SettingsLayout() {
  const {
    homeStatus,
    error,
    pickHome,
    allowHome,
    scope,
    globalConfig,
    customConfig,
  } = useSettingsConfig();

  if (homeStatus === "unsupported") {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Claude Sessions Explorer needs the File System Access API, available in
        Chrome and Edge.
      </div>
    );
  }

  if (homeStatus === "checking") {
    return (
      <div className="flex flex-1 flex-col gap-3 p-8">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (homeStatus === "none" || homeStatus === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-lg font-medium">Settings &amp; permissions</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Select your <code>~/.claude</code> folder to inspect your global
          settings, permissions, and MCP configuration. (Chrome won't let a site
          request access to your whole home directory, so this targets{" "}
          <code>.claude</code> directly — <code>~/.claude.json</code>, which
          lives outside it, isn't reachable from here.)
        </p>
        <Button onClick={() => void pickHome()}>Select ~/.claude folder</Button>
        {homeStatus === "error" && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  if (homeStatus === "needs-permission") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-lg font-medium">Welcome back</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Allow access to your ~/.claude folder to continue viewing settings.
        </p>
        <Button onClick={() => void allowHome()}>Allow access</Button>
      </div>
    );
  }

  const activeSettingsData =
    scope === "root"
      ? globalConfig?.settings.data
      : customConfig?.settings.data;
  const cleanupDays = extractCleanupDays(activeSettingsData);

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">
            Settings &amp; permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Inspect global (root) or a specific project's local Claude Code
            configuration. Nothing here is ever sent anywhere — it's read
            straight from disk.
          </p>
        </div>

        <RetentionAlert cleanupDays={cleanupDays} />

        <Outlet />
      </div>
    </ScrollArea>
  );
}
