import * as React from "react";
import { useLocation } from "react-router";

import { RecordGroupView } from "@/components/transcript/RecordGroup";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RenderGroup } from "@/lib/session-model";

export function TranscriptView({
  groups,
  toolNameIndex,
}: {
  groups: RenderGroup[];
  toolNameIndex: Map<string, string>;
}) {
  const { hash } = useLocation();

  React.useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Re-run whenever the groups actually rendered change (e.g. after a
    // fresh session load), not on every hash-identical re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, groups]);

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        {groups.map((group) => (
          <div
            key={group.key}
            id={group.key}
            className="py-3 target:rounded-md target:ring-2 target:ring-primary"
          >
            <RecordGroupView group={group} toolNameIndex={toolNameIndex} />
          </div>
        ))}
        {groups.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No records match the current filters.
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
