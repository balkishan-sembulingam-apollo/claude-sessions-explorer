import { Search } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/contexts/app-store";
import {
  searchAllSessions,
  type GlobalSearchResult,
} from "@/lib/global-search";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { projects } = useAppStore();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      void searchAllSessions(projects, trimmed, () => cancelled).then(
        (found) => {
          if (!cancelled) {
            setResults(found);
            setLoading(false);
          }
        },
      );
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, projects]);

  function goTo(result: GlobalSearchResult) {
    onOpenChange(false);
    const hash = result.recordUuid ? `#${result.recordUuid}` : "";
    navigate(
      `/project/${result.projectKey}/session/${encodeURIComponent(result.sessionId)}${hash}`,
    );
  }

  const trimmed = query.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] flex h-[60vh] w-[60vw] max-w-[60vw] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-[60vw]"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all sessions…"
            className="h-6 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-1 p-2">
            {loading && (
              <p className="p-3 text-xs text-muted-foreground">Searching…</p>
            )}
            {!loading &&
              trimmed.length >= MIN_QUERY_LENGTH &&
              results.length === 0 && (
                <p className="p-3 text-xs text-muted-foreground">
                  No matches found.
                </p>
              )}
            {!loading && trimmed.length < MIN_QUERY_LENGTH && (
              <p className="p-3 text-xs text-muted-foreground">
                Type at least {MIN_QUERY_LENGTH} characters to search every
                session across every project.
              </p>
            )}
            {results.map((result) => (
              <Button
                key={`${result.projectKey}-${result.sessionId}`}
                variant="ghost"
                className="h-auto w-full flex-col items-start gap-0.5 px-3 py-2 text-left whitespace-normal"
                onClick={() => goTo(result)}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {result.projectLabel} · {result.sessionTitle}
                </span>
                <span className="line-clamp-2 text-sm font-normal">
                  {result.snippet}
                </span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
