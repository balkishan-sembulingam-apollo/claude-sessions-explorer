import { FileWarning, FileX, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CollapsibleBlock,
  JsonBlock,
} from "@/components/transcript/blocks/CollapsibleJson";
import { Badge } from "@/components/ui/badge";
import type { JsonFileResult } from "@/lib/claude-config";

export function JsonFileCard({
  title,
  path,
  result,
  children,
}: {
  title: string;
  path: string;
  result: JsonFileResult;
  /** Optional extra summary rendered above the raw JSON (e.g. permissions breakdown). */
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="font-mono text-xs text-muted-foreground">
            {path}
          </span>
          {!result.exists && result.permissionDenied && (
            <Badge
              variant="outline"
              className="gap-1 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              title={result.error}
            >
              <ShieldAlert className="size-3" />
              couldn't read (permission?)
            </Badge>
          )}
          {!result.exists && !result.permissionDenied && (
            <Badge variant="outline" className="gap-1">
              <FileX className="size-3" />
              not found
            </Badge>
          )}
          {result.exists && result.error && (
            <Badge
              variant="outline"
              className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            >
              <FileWarning className="size-3" />
              {result.error}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      {result.exists && (
        <CardContent className="flex flex-col gap-3">
          {children}
          <CollapsibleBlock label={`Raw ${title}`}>
            <JsonBlock value={result.data ?? result.raw} />
          </CollapsibleBlock>
        </CardContent>
      )}
    </Card>
  );
}
