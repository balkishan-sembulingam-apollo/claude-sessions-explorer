import { Plug, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CollapsibleBlock,
  JsonBlock,
} from "@/components/transcript/blocks/CollapsibleJson";
import type { McpServerEntry } from "@/lib/claude-config";

const NEEDS_AUTH_COLOR =
  "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

export function McpServersList({
  servers,
  needsAuth,
}: {
  servers: McpServerEntry[];
  needsAuth: string[];
}) {
  if (servers.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No MCP servers configured.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {servers.map((server) => {
        const flagged = needsAuth.includes(server.name);
        return (
          <CollapsibleBlock
            key={server.name}
            label={
              <span className="flex items-center gap-1.5">
                <Plug className="size-3" />
                {server.name}
                {flagged && (
                  <Badge variant="outline" className={NEEDS_AUTH_COLOR}>
                    <ShieldAlert className="size-3" />
                    needs auth
                  </Badge>
                )}
              </span>
            }
          >
            <JsonBlock value={server.config} />
          </CollapsibleBlock>
        );
      })}
    </div>
  );
}
