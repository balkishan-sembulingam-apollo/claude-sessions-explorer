import { useParams } from "react-router";

import { useAppStore } from "@/contexts/app-store";
import { basename } from "@/lib/format";

export default function ProjectIndex() {
  const { projects } = useAppStore();
  const { projectKey } = useParams();
  const project = projects.find((p) => p.key === projectKey);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1
        className="text-lg font-medium"
        title={project?.cwd ?? project?.dirName}
      >
        {project ? basename(project.cwd ?? project.dirName) : ""}
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Select a session from the sidebar to view its transcript, or a memory
        file to read what Claude remembers about this project.
      </p>
    </div>
  );
}
