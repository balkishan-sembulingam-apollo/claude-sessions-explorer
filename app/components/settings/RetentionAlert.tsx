import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Claude Code auto-deletes local session transcripts after this many days unless cleanupPeriodDays is set. */
const DEFAULT_CLEANUP_DAYS = 30;

export function RetentionAlert({
  cleanupDays,
}: {
  cleanupDays: number | null;
}) {
  if (cleanupDays !== null) {
    return (
      <Alert>
        <TriangleAlert />
        <AlertTitle>Session retention: {cleanupDays} days</AlertTitle>
        <AlertDescription>
          Sessions in <code>~/.claude/projects</code> are automatically deleted
          after {cleanupDays} day{cleanupDays === 1 ? "" : "s"} (set via{" "}
          <code>cleanupPeriodDays</code> in settings.json).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>
        Sessions are deleted after {DEFAULT_CLEANUP_DAYS} days
      </AlertTitle>
      <AlertDescription>
        No <code>cleanupPeriodDays</code> is set, so Claude Code uses its
        default of {DEFAULT_CLEANUP_DAYS} days — anything this explorer shows
        will eventually disappear from disk. Add{" "}
        <code>"cleanupPeriodDays"</code> to <code>~/.claude/settings.json</code>{" "}
        (a large number, or omit deletion entirely per Claude Code's docs) to
        keep session history around longer.
      </AlertDescription>
    </Alert>
  );
}
