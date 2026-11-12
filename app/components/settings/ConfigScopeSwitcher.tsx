import { FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { basename } from "@/lib/format";

export type ConfigScope = "root" | "custom";

export function ConfigScopeSwitcher({
  scope,
  customDirName,
  onSelectRoot,
  onPickCustom,
}: {
  scope: ConfigScope;
  customDirName?: string;
  onSelectRoot: () => void;
  onPickCustom: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={scope === "root" ? "default" : "outline"}
        size="sm"
        onClick={onSelectRoot}
      >
        Root (~/.claude)
      </Button>
      <Button
        variant={scope === "custom" ? "default" : "outline"}
        size="sm"
        onClick={onPickCustom}
      >
        <FolderOpen className="size-3.5" />
        {scope === "custom" && customDirName
          ? basename(customDirName)
          : "Custom folder…"}
      </Button>
    </div>
  );
}
