import { JsonFileCard } from "@/components/settings/JsonFileCard";
import { McpServersList } from "@/components/settings/McpServersList";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsConfig } from "@/contexts/settings-config-store";
import { extractMcpNeedsAuth, extractMcpServers } from "@/lib/claude-config";

export default function McpServers() {
  const { scope, globalConfig, globalLoading, customConfig, customLoading } =
    useSettingsConfig();

  if (scope === "root") {
    if (globalLoading || !globalConfig)
      return <Skeleton className="h-24 w-full" />;

    const servers = extractMcpServers(globalConfig.settings.data);
    const needsAuth = extractMcpNeedsAuth(globalConfig.mcpNeedsAuth.data);

    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">MCP servers</h2>
        <p className="text-xs text-muted-foreground">
          Full server definitions normally live in <code>~/.claude.json</code>,
          which the browser won't grant access to from here — showing whatever
          is in <code>settings.json</code> plus the auth cache below.
        </p>
        <McpServersList servers={servers} needsAuth={needsAuth} />
        <JsonFileCard
          title="mcp-needs-auth-cache.json"
          path="~/.claude/mcp-needs-auth-cache.json"
          result={globalConfig.mcpNeedsAuth}
        />
      </section>
    );
  }

  if (customLoading || !customConfig)
    return <Skeleton className="h-24 w-full" />;

  const servers = extractMcpServers(customConfig.mcpConfig.data);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">MCP servers</h2>
      <McpServersList servers={servers} needsAuth={[]} />
      <JsonFileCard
        title=".mcp.json"
        path=".mcp.json"
        result={customConfig.mcpConfig}
      />
    </section>
  );
}
