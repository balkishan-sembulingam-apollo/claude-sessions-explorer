import { Badge } from "@/components/ui/badge";
import { formatTimestamp, shortId } from "@/lib/format";
import type { EnvelopeFields } from "@/lib/types";

const TIMESTAMP_COLOR =
  "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
const BRANCH_COLOR =
  "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
const VERSION_COLOR =
  "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";

/** Every envelope field on a record, surfaced as small badge chips. */
export function RecordChips({
  record,
}: {
  record: EnvelopeFields & { type?: string };
}) {
  const chips: { label: string; title?: string; className?: string }[] = [];

  if (record.timestamp)
    chips.push({
      label: formatTimestamp(record.timestamp),
      className: TIMESTAMP_COLOR,
    });
  if (record.gitBranch)
    chips.push({
      label: record.gitBranch,
      title: "git branch",
      className: BRANCH_COLOR,
    });
  if (record.version)
    chips.push({
      label: `v${record.version}`,
      title: "Claude Code version",
      className: VERSION_COLOR,
    });
  if (record.userType)
    chips.push({ label: record.userType, title: "user type" });
  if (record.entrypoint)
    chips.push({ label: record.entrypoint, title: "entrypoint" });
  if (record.permissionMode)
    chips.push({ label: record.permissionMode, title: "permission mode" });
  if (record.agentId)
    chips.push({
      label: `agent:${shortId(record.agentId)}`,
      title: "agent id",
    });
  if (record.promptId)
    chips.push({
      label: `prompt:${shortId(record.promptId)}`,
      title: "prompt id",
    });
  if (record.uuid)
    chips.push({ label: `uuid:${shortId(record.uuid)}`, title: "record uuid" });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {chips.map((chip, i) => (
        <Badge
          key={i}
          variant="outline"
          title={chip.title}
          className={chip.className}
        >
          {chip.label}
        </Badge>
      ))}
    </div>
  );
}
