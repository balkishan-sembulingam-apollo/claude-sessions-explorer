import { Outlet, useParams } from "react-router";

import { useAppStore } from "@/contexts/app-store";

export default function Project() {
  const { projects } = useAppStore();
  const { projectKey } = useParams();
  const project = projects.find((p) => p.key === projectKey);

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Project not found.
      </div>
    );
  }

  return <Outlet />;
}
