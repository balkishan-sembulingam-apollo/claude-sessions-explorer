import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/contexts/app-store";
import { buildEditorLink } from "@/lib/editor-link";
import { truncateForDisplay } from "@/lib/parse-session";

interface FileViewerProps {
  filePath: string;
  /** The transcript-captured snapshot to show — always available, offline. */
  snapshot: string;
  label: string;
}

/** Shows the version of a file captured in the transcript, plus an editor deep-link. */
export function FileViewer({ filePath, snapshot, label }: FileViewerProps) {
  const { editorScheme } = useAppStore();
  const link = buildEditorLink(editorScheme, filePath);

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-1.5">
        <div className="min-w-0">
          <span className="truncate font-mono text-xs" title={filePath}>
            {filePath}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {label} · transcript snapshot
          </span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          nativeButton={false}
          render={<a href={link} target="_blank" rel="noreferrer" />}
        >
          <ExternalLink className="size-3" />
          Open in editor
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto p-3 text-xs">
        <code>{truncateForDisplay(snapshot)}</code>
      </pre>
    </div>
  );
}
