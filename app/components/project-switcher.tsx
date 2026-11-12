import { ChevronsUpDown, FolderGit2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/contexts/app-store";
import { basename } from "@/lib/format";

export function ProjectSwitcher() {
  const { projects } = useAppStore();
  const { projectKey } = useParams();
  const navigate = useNavigate();

  const current = projects.find((p) => p.key === projectKey);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FolderGit2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span
                    className="truncate font-medium"
                    title={
                      current ? (current.cwd ?? current.dirName) : undefined
                    }
                  >
                    {current
                      ? basename(current.cwd ?? current.dirName)
                      : "Select a project"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {current
                      ? `${current.sessionCount} sessions`
                      : `${projects.length} projects`}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent className="w-64" align="start">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.key}
                onClick={() => navigate(`/project/${project.key}`)}
              >
                <div className="flex min-w-0 flex-col">
                  <span
                    className="truncate"
                    title={project.cwd ?? project.dirName}
                  >
                    {basename(project.cwd ?? project.dirName)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {project.sessionCount} sessions
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            {projects.length === 0 && (
              <DropdownMenuItem disabled>No projects found</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
