import { FileText } from "lucide-react";
import * as React from "react";
import { useNavigate, useParams } from "react-router";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/contexts/app-store";
import { formatRelativeTime } from "@/lib/format";
import { parseSessionMetaHint } from "@/lib/parse-session";
import { loadSessionTitle, saveSessionTitle } from "@/lib/session-titles";
import type { ProjectInfo, SessionMeta } from "@/lib/types";

export function ProjectSidebarContent({ projectKey }: { projectKey?: string }) {
  const { projects } = useAppStore();
  const navigate = useNavigate();
  const { sessionId, memoryFile } = useParams();
  const project = projects.find((p) => p.key === projectKey);

  if (!project) {
    return (
      <div className="p-4 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
        Select a project from the switcher above to browse its sessions.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>Sessions</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {project.sessions.map((session, index) => (
              <SidebarMenuItem key={session.sessionId}>
                <SessionRow
                  project={project}
                  session={session}
                  index={index}
                  isActive={session.sessionId === sessionId}
                  onNavigate={() =>
                    navigate(
                      `/project/${project.key}/session/${encodeURIComponent(session.sessionId)}`,
                    )
                  }
                />
              </SidebarMenuItem>
            ))}
            {project.sessions.length === 0 && (
              <SidebarMenuItem>
                <span className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No sessions yet
                </span>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </ScrollArea>

      {project.memoryFiles.length > 0 && (
        <div className="flex min-h-0 flex-col border-t border-sidebar-border">
          <Collapsible
            defaultOpen
            className="group/collapsible flex min-h-0 flex-1 flex-col"
          >
            <SidebarGroup className="flex min-h-0 flex-1 flex-col">
              <SidebarGroupLabel
                render={
                  <CollapsibleTrigger className="flex w-full items-center" />
                }
              >
                Memory
              </SidebarGroupLabel>
              <CollapsibleContent className="min-h-0 flex-1">
                <ScrollArea className="h-full">
                  <SidebarMenuSub className="mr-0 ml-0 gap-1 border-l-0 px-1.5">
                    {project.memoryFiles.map((memory) => (
                      <SidebarMenuSubItem key={memory.fileName}>
                        <SidebarMenuSubButton
                          isActive={memory.fileName === memoryFile}
                          onClick={() =>
                            navigate(
                              `/project/${project.key}/memory/${encodeURIComponent(memory.fileName)}`,
                            )
                          }
                        >
                          <FileText className="size-3.5" />
                          <span className="truncate">{memory.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </ScrollArea>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

/**
 * Resolves and renders its own title independently (a cheap per-file read).
 * Keeping this state local — instead of writing it back into the shared
 * `projects` array — means one session's title becoming ready never
 * re-renders the rest of the sidebar.
 */
function SessionRow({
  project,
  session,
  index,
  isActive,
  onNavigate,
}: {
  project: ProjectInfo;
  session: SessionMeta;
  index: number;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const override = loadSessionTitle(project.key, session.sessionId);
  const [title, setTitle] = React.useState(override ?? session.title);
  const [resolved, setResolved] = React.useState(Boolean(override));
  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(title);

  React.useEffect(() => {
    if (resolved) return;
    let cancelled = false;

    void (async () => {
      try {
        const fileHandle = await project.dirHandle.getFileHandle(
          session.fileName,
        );
        const file = await fileHandle.getFile();
        const hint = await parseSessionMetaHint(file);
        if (!cancelled && hint.title) setTitle(hint.title);
      } catch {
        // leave the sessionId fallback title in place
      } finally {
        if (!cancelled) setResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Runs once per mounted row; re-fetching on prop identity changes isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startRename() {
    setRenameValue(title);
    setRenaming(true);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed) {
      saveSessionTitle(project.key, session.sessionId, trimmed);
      setTitle(trimmed);
    }
    setRenaming(false);
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <SessionNumberBadge index={index} />
        <Input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setRenaming(false);
          }}
          className="h-6 text-xs"
        />
      </div>
    );
  }

  return (
    <SidebarMenuButton
      isActive={isActive}
      onClick={onNavigate}
      onDoubleClick={(e) => {
        e.preventDefault();
        startRename();
      }}
      tooltip={`${title} (double-click to rename)`}
      className="h-auto py-2"
    >
      <SessionNumberBadge index={index} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {resolved ? (
          <span className="truncate text-sm">{title}</span>
        ) : (
          <Skeleton className="h-4 w-32" />
        )}
        <span className="truncate text-xs text-muted-foreground">
          {formatRelativeTime(session.lastModified)}
          {session.messageCount > 0 ? ` · ${session.messageCount} msgs` : ""}
        </span>
      </div>
    </SidebarMenuButton>
  );
}

function SessionNumberBadge({ index }: { index: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background">
      {index + 1}
    </span>
  );
}
