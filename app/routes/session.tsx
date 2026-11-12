import * as React from "react";
import { useParams, useSearchParams } from "react-router";

import { SessionFilterPanel } from "@/components/transcript/SessionFilterPanel";
import { TranscriptView } from "@/components/transcript/TranscriptView";
import { useAppStore } from "@/contexts/app-store";
import {
  DEFAULT_FILTERS,
  filterGroups,
  type SessionFilters,
} from "@/lib/session-filters";
import { buildToolNameIndex, groupRecordsForRender } from "@/lib/session-model";
import type { SessionFacets, SessionRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY_FACETS: SessionFacets = {
  tools: [],
  files: [],
  branches: [],
  versions: [],
};

export default function Session() {
  const { projects, getSession, getSubagentSession } = useAppStore();
  const { projectKey, sessionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = searchParams.get("agent");

  const project = projects.find((p) => p.key === projectKey);

  const [records, setRecords] = React.useState<SessionRecord[] | null>(null);
  const [facets, setFacets] = React.useState<SessionFacets>(EMPTY_FACETS);
  const [filters, setFilters] = React.useState<SessionFilters>(DEFAULT_FILTERS);

  React.useEffect(() => {
    if (!project || !sessionId) return;
    setRecords(null);
    setFilters(DEFAULT_FILTERS);

    const load = agentId
      ? getSubagentSession(project, sessionId, agentId)
      : getSession(project, sessionId);

    void load.then((parsed) => {
      setRecords(parsed.records);
      setFacets(parsed.facets);
    });
  }, [project, sessionId, agentId, getSession, getSubagentSession]);

  const toolNameIndex = React.useMemo(
    () => (records ? buildToolNameIndex(records) : new Map<string, string>()),
    [records],
  );

  const allGroups = React.useMemo(
    () => (records ? groupRecordsForRender(records) : []),
    [records],
  );

  const filteredGroups = React.useMemo(
    () => filterGroups(allGroups, filters),
    [allGroups, filters],
  );

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Project not found.
      </div>
    );
  }

  if (!records) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-8">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-2/3" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {agentId && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
          Viewing subagent transcript
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("agent");
              setSearchParams(next);
            }}
          >
            back to main session
          </Button>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <TranscriptView
            groups={filteredGroups}
            toolNameIndex={toolNameIndex}
          />
        </div>
        <SessionFilterPanel
          facets={facets}
          filters={filters}
          onChange={setFilters}
          matchCount={filteredGroups.length}
        />
      </div>
    </div>
  );
}
