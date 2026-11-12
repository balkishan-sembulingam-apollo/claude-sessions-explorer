import { FolderGit2 } from "lucide-react";
import { useNavigate } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/contexts/app-store";
import { basename, formatRelativeTime } from "@/lib/format";

export default function Projects() {
  const { projects } = useAppStore();
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        No projects found in the selected folder.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto w-full max-w-6xl p-8">
        <h1 className="mb-1 text-2xl font-semibold">Projects</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {projects.length} project{projects.length === 1 ? "" : "s"} found in
          your Claude sessions folder.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.key}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/project/${project.key}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FolderGit2 className="size-4 shrink-0 text-muted-foreground" />
                  <span
                    className="truncate"
                    title={project.cwd ?? project.dirName}
                  >
                    {basename(project.cwd ?? project.dirName)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {project.sessionCount} session
                    {project.sessionCount === 1 ? "" : "s"}
                  </span>
                  <span>
                    {project.lastActivity
                      ? formatRelativeTime(project.lastActivity)
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
