import { GitCompareArrows, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ContentBlocks } from "@/components/transcript/blocks/ContentBlocks";
import {
  CollapsibleBlock,
  JsonBlock,
} from "@/components/transcript/blocks/CollapsibleJson";
import { RecordChips } from "@/components/transcript/RecordChips";
import type {
  AssistantRecord,
  AttachmentRecord,
  ContentBlock,
  MetaRecord,
  SessionRecord,
  SystemRecord,
  UserRecord,
} from "@/lib/types";
import type { RenderGroup } from "@/lib/session-model";

const META_TYPES = new Set([
  "ai-title",
  "custom-title",
  "mode",
  "permission-mode",
  "pr-link",
  "last-prompt",
  "queue-operation",
  "file-history-snapshot",
]);

export function RecordGroupView({
  group,
  toolNameIndex,
}: {
  group: RenderGroup;
  toolNameIndex: Map<string, string>;
}) {
  const first = group.records[0] as SessionRecord;

  if (first.type === "user")
    return (
      <UserTurn record={first as UserRecord} toolNameIndex={toolNameIndex} />
    );
  if (first.type === "assistant")
    return (
      <AssistantTurn
        records={group.records as AssistantRecord[]}
        toolNameIndex={toolNameIndex}
      />
    );
  if (first.type === "system")
    return <SystemTurn record={first as SystemRecord} />;
  if (first.type === "attachment")
    return <AttachmentTurn record={first as AttachmentRecord} />;
  if (META_TYPES.has(first.type as string))
    return <MetaLine record={first as MetaRecord} />;
  return null;
}

function UserTurn({
  record,
  toolNameIndex,
}: {
  record: UserRecord;
  toolNameIndex: Map<string, string>;
}) {
  const content: ContentBlock[] =
    typeof record.message.content === "string"
      ? [{ type: "text", text: record.message.content }]
      : record.message.content;

  if (record.isCompactSummary) {
    return (
      <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-border bg-muted/30 p-3">
        <span className="text-xs font-medium text-muted-foreground">
          Compacted context summary
        </span>
        <ContentBlocks blocks={content} toolNameIndex={toolNameIndex} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <User className="size-3.5" />
        User
        <RecordChips record={record} />
      </div>
      <ContentBlocks
        blocks={content}
        toolUseResult={record.toolUseResult}
        toolNameIndex={toolNameIndex}
      />
    </div>
  );
}

function AssistantTurn({
  records,
  toolNameIndex,
}: {
  records: AssistantRecord[];
  toolNameIndex: Map<string, string>;
}) {
  const content = records.flatMap((r) => r.message.content);
  const first = records[0];
  const model = records.find((r) => r.message.model)?.message.model;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        Assistant
        {model && (
          <Badge
            variant="outline"
            className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
          >
            {model}
          </Badge>
        )}
        <RecordChips record={first} />
      </div>
      <ContentBlocks blocks={content} toolNameIndex={toolNameIndex} />
    </div>
  );
}

function SystemTurn({ record }: { record: SystemRecord }) {
  if (record.subtype === "compact_boundary") {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <GitCompareArrows className="size-3.5" />
        <div className="h-px flex-1 bg-border" />
        <span>
          Context compacted ({record.compactMetadata?.trigger ?? "auto"}
          {record.compactMetadata?.preTokens &&
          record.compactMetadata?.postTokens
            ? ` · ${record.compactMetadata.preTokens.toLocaleString()} → ${record.compactMetadata.postTokens.toLocaleString()} tokens`
            : ""}
          )
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant={record.level === "error" ? "destructive" : "outline"}>
        system:{record.subtype ?? "info"}
      </Badge>
      <RecordChips record={record} />
      {record.content && <span className="truncate">{record.content}</span>}
    </div>
  );
}

function AttachmentTurn({ record }: { record: AttachmentRecord }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">attachment:{record.attachment.type}</Badge>
        <RecordChips record={record} />
      </div>
      <CollapsibleBlock label="Details">
        <JsonBlock value={record.attachment} />
      </CollapsibleBlock>
    </div>
  );
}

function MetaLine({ record }: { record: MetaRecord }) {
  return (
    <CollapsibleBlock
      label={
        <span className="text-xs text-muted-foreground">
          {record.type}
          {record.aiTitle ? `: ${record.aiTitle}` : ""}
          {record.customTitle ? `: ${record.customTitle}` : ""}
        </span>
      }
    >
      <JsonBlock value={record} />
    </CollapsibleBlock>
  );
}
