import { JsonFileCard } from "@/components/settings/JsonFileCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsConfig } from "@/contexts/settings-config-store";

export default function Policy() {
  const { scope, setScope, globalConfig, globalLoading } = useSettingsConfig();

  if (scope !== "root") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Policy limits are a machine-wide setting, only available in Root
          scope.
        </p>
        <Button variant="outline" size="sm" onClick={() => setScope("root")}>
          Switch to Root
        </Button>
      </div>
    );
  }

  if (globalLoading || !globalConfig)
    return <Skeleton className="h-24 w-full" />;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Policy</h2>
      <JsonFileCard
        title="policy-limits.json"
        path="~/.claude/policy-limits.json"
        result={globalConfig.policyLimits}
      />
    </section>
  );
}
