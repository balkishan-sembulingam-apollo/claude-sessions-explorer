import { FolderOpen, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/contexts/app-store";

export function FolderPicker() {
  const { folderStatus, error, pickFolder, allowPersistedFolder } =
    useAppStore();

  if (folderStatus === "checking" || folderStatus === "loading") {
    return (
      <div className="flex h-dvh flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading your Claude sessions…
      </div>
    );
  }

  if (folderStatus === "unsupported") {
    return (
      <Centered>
        <TriangleAlert className="size-8 text-muted-foreground" />
        <h1 className="text-lg font-medium">Browser not supported</h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Claude Sessions Explorer needs the File System Access API, available
          in Chrome and Edge. Open this page in one of those browsers to
          continue.
        </p>
      </Centered>
    );
  }

  if (folderStatus === "needs-permission") {
    return (
      <Centered>
        <FolderOpen className="size-8 text-muted-foreground" />
        <h1 className="text-lg font-medium">Welcome back</h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Allow access to the Claude projects folder you selected before to
          continue where you left off.
        </p>
        <Button onClick={() => void allowPersistedFolder()}>
          Allow access
        </Button>
      </Centered>
    );
  }

  return (
    <Centered>
      <FolderOpen className="size-8 text-muted-foreground" />
      <h1 className="text-lg font-medium">
        Select your Claude projects folder
      </h1>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Pick your{" "}
        <code className="rounded bg-muted px-1 py-0.5">~/.claude/projects</code>{" "}
        folder — usually found under your home directory, inside the hidden{" "}
        <code className="rounded bg-muted px-1 py-0.5">.claude</code> folder.
        You only need to do this once; the folder is remembered for next time.
      </p>
      <Button onClick={() => void pickFolder()}>Select folder</Button>
      {folderStatus === "error" && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-1 flex-col items-center justify-center gap-3 p-8">
      {children}
    </div>
  );
}
