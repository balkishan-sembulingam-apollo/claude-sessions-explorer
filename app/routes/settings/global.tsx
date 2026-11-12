import { JsonFileCard } from "@/components/settings/JsonFileCard";
import { PermissionsSummary } from "@/components/settings/PermissionsSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsConfig } from "@/contexts/settings-config-store";
import { extractPermissions } from "@/lib/claude-config";
import { basename } from "@/lib/format";

export default function GlobalConfig() {
  const {
    scope,
    globalConfig,
    globalLoading,
    customConfig,
    customLoading,
    activeCustomFolder,
  } = useSettingsConfig();

  if (scope === "root") {
    if (globalLoading || !globalConfig) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    return (
      <>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Settings</h2>
          <JsonFileCard
            title="settings.json"
            path="~/.claude/settings.json"
            result={globalConfig.settings}
          >
            <PermissionsSummary
              permissions={extractPermissions(globalConfig.settings.data)}
            />
          </JsonFileCard>
          <JsonFileCard
            title="settings.local.json"
            path="~/.claude/settings.local.json"
            result={globalConfig.settingsLocal}
          >
            <PermissionsSummary
              permissions={extractPermissions(globalConfig.settingsLocal.data)}
            />
          </JsonFileCard>
        </section>
      </>
    );
  }

  if (customLoading || !customConfig) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">
        Settings for{" "}
        {activeCustomFolder
          ? basename(activeCustomFolder.handle.name)
          : "project"}
      </h2>
      <JsonFileCard
        title="settings.json"
        path=".claude/settings.json"
        result={customConfig.settings}
      >
        <PermissionsSummary
          permissions={extractPermissions(customConfig.settings.data)}
        />
      </JsonFileCard>
      <JsonFileCard
        title="settings.local.json"
        path=".claude/settings.local.json"
        result={customConfig.settingsLocal}
      >
        <PermissionsSummary
          permissions={extractPermissions(customConfig.settingsLocal.data)}
        />
      </JsonFileCard>
    </section>
  );
}
