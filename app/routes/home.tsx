import { FolderSearch, Search, Settings2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/contexts/app-store";
import { useSettingsConfig } from "@/contexts/settings-config-store";

const GRANTED_COLOR =
  "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
const NOT_GRANTED_COLOR =
  "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";

function PermissionBadge({ granted }: { granted: boolean }) {
  return (
    <Badge
      variant="outline"
      className={granted ? GRANTED_COLOR : NOT_GRANTED_COLOR}
    >
      {granted ? "Permission granted" : "Permission not granted"}
    </Badge>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { folderStatus } = useAppStore();
  const { homeStatus } = useSettingsConfig();

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div>
            <h1 className="mb-1 text-2xl font-semibold">
              Claude Sessions Explorer
            </h1>
            <p className="text-sm text-muted-foreground">
              A local, client-only browser for everything Claude Code stores on
              this machine. Nothing here is ever uploaded anywhere — every file
              is read straight off disk, in your browser, using the File System
              Access API.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Folder access
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Claude projects folder</p>
                  <p className="text-xs text-muted-foreground">
                    ~/.claude/projects — powers the sessions explorer
                  </p>
                </div>
                <PermissionBadge granted={folderStatus === "ready"} />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">~/.claude folder</p>
                  <p className="text-xs text-muted-foreground">
                    ~/.claude — powers Settings &amp; permissions
                  </p>
                </div>
                <PermissionBadge granted={homeStatus === "ready"} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate("/projects")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FolderSearch className="size-4 text-muted-foreground" />
                  Browse Claude projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  See every project Claude Code has a session history for, and
                  every session inside it — full transcripts, tool calls,
                  thinking blocks, filters, and full-text search across all of
                  them.
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate("/settings")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Settings2 className="size-4 text-muted-foreground" />
                  Settings &amp; permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Inspect global or per-project Claude Code settings, allowed
                  permissions, configured MCP servers, and policy/remote config
                  — for the root install or any custom project folder.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Search className="size-4 text-muted-foreground" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
              <p>
                Press{" "}
                <kbd className="rounded border border-border px-1 py-0.5">
                  ⌘K
                </kbd>{" "}
                anywhere to search every session across every project at once.
              </p>
              <p>
                More sections — housekeeping, usage stats, cross-project memory
                — are on the way; the icon rail in the header is where they'll
                live.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={() => navigate("/projects")}>Get started</Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
