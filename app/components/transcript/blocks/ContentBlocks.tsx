import { Bot, FileText } from "lucide-react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import {
  CollapsibleBlock,
  JsonBlock,
} from "@/components/transcript/blocks/CollapsibleJson";
import { FileViewer } from "@/components/transcript/FileViewer";
import type { ContentBlock } from "@/lib/types";

interface ContentBlocksProps {
  blocks: ContentBlock[];
  /** Only present on the user record that answers a tool_use (the parsed toolUseResult). */
  toolUseResult?: Record<string, unknown>;
  toolNameIndex: Map<string, string>;
}

export function ContentBlocks({
  blocks,
  toolUseResult,
  toolNameIndex,
}: ContentBlocksProps) {
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => (
        <ContentBlockView
          key={i}
          block={block}
          toolUseResult={toolUseResult}
          toolNameIndex={toolNameIndex}
        />
      ))}
    </div>
  );
}

function ContentBlockView({
  block,
  toolUseResult,
  toolNameIndex,
}: {
  block: ContentBlock;
  toolUseResult?: Record<string, unknown>;
  toolNameIndex: Map<string, string>;
}) {
  const [, setSearchParams] = useSearchParams();

  switch (block.type) {
    case "text":
      return (
        <p className="text-base wrap-break-word whitespace-pre-wrap">
          {(block as { text: string }).text}
        </p>
      );

    case "thinking":
      return (
        <CollapsibleBlock label="Thinking">
          <p className="text-sm wrap-break-word whitespace-pre-wrap text-muted-foreground">
            {(block as { thinking: string }).thinking}
          </p>
        </CollapsibleBlock>
      );

    case "tool_use": {
      const b = block as {
        id: string;
        name: string;
        input: Record<string, unknown>;
      };
      return (
        <CollapsibleBlock label={b.name}>
          <JsonBlock value={b.input} />
        </CollapsibleBlock>
      );
    }

    case "tool_result": {
      const b = block as {
        tool_use_id: string;
        is_error?: boolean | null;
        content: string | ContentBlock[];
      };
      const toolName = toolNameIndex.get(b.tool_use_id);
      const filePath = extractFilePath(toolUseResult);

      if (toolName === "Task" && toolUseResult?.agentId) {
        return (
          <div className="flex items-center gap-2 rounded-md border border-border p-2">
            <Bot className="size-3.5 text-muted-foreground" />
            <span className="flex-1 text-xs text-muted-foreground">
              Subagent ({String(toolUseResult.agentType ?? "unknown")}) finished
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setSearchParams({ agent: String(toolUseResult.agentId) })
              }
            >
              Open transcript
            </Button>
          </div>
        );
      }

      if (filePath && typeof toolUseResult !== "undefined") {
        return (
          <FileViewer
            filePath={filePath}
            snapshot={extractFileSnapshot(toolUseResult)}
            label={toolName ?? "File"}
          />
        );
      }

      return (
        <CollapsibleBlock
          label={`${b.is_error ? "Tool result (error)" : "Tool result"} ${toolName ? ` · ${toolName}` : ""}`.trim()}
        >
          <JsonBlock
            value={typeof b.content === "string" ? b.content : b.content}
          />
        </CollapsibleBlock>
      );
    }

    case "image": {
      const b = block as { source: { media_type: string; data: string } };
      return (
        <img
          src={`data:${b.source.media_type};base64,${b.source.data}`}
          alt="attachment"
          loading="lazy"
          className="max-h-96 rounded-md border border-border"
        />
      );
    }

    default:
      return (
        <CollapsibleBlock
          label={
            <span className="flex items-center gap-1.5">
              <FileText className="size-3" />
              {block.type}
            </span>
          }
        >
          <JsonBlock value={block} />
        </CollapsibleBlock>
      );
  }
}

function extractFilePath(
  toolUseResult?: Record<string, unknown>,
): string | undefined {
  if (!toolUseResult) return undefined;
  if (typeof toolUseResult.filePath === "string") return toolUseResult.filePath;
  const file = toolUseResult.file as { filePath?: string } | undefined;
  if (file?.filePath) return file.filePath;
  return undefined;
}

function extractFileSnapshot(toolUseResult: Record<string, unknown>): string {
  if (typeof toolUseResult.content === "string") return toolUseResult.content;
  const file = toolUseResult.file as { content?: string } | undefined;
  if (file?.content) return file.content;
  if (typeof toolUseResult.newString === "string")
    return toolUseResult.newString;
  if (typeof toolUseResult.originalFile === "string")
    return toolUseResult.originalFile;
  return JSON.stringify(toolUseResult, null, 2);
}
