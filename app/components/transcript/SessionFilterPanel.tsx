import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RECORD_TYPE_OPTIONS,
  TIME_PRESETS,
  DEFAULT_FILTERS,
  activeFilterCount,
  hasActiveFilters,
  type SessionFilters,
} from "@/lib/session-filters";
import type { SessionFacets } from "@/lib/types";
import { cn } from "@/lib/utils";

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function CheckboxList({
  category,
  options,
  selected,
  onToggle,
  renderLabel,
  emptyLabel = "None found in this session",
}: {
  category: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  renderLabel?: (value: string) => string;
  emptyLabel?: string;
}) {
  if (options.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  }

  const items = options.map((option) => {
    const id = `filter-${category}-${option}`;
    return (
      <Field key={option} orientation="horizontal" className="gap-2">
        <Checkbox
          id={id}
          checked={selected.includes(option)}
          onCheckedChange={() => onToggle(option)}
        />
        <FieldLabel htmlFor={id} className="min-w-0 text-xs font-normal">
          <span className="truncate" title={option}>
            {renderLabel ? renderLabel(option) : option}
          </span>
        </FieldLabel>
      </Field>
    );
  });

  // A ScrollArea viewport needs a definite (not max-) height to scroll
  // correctly, so only wrap in one once the list is long enough to need it.
  if (options.length <= 6) {
    return <div className="flex flex-col gap-2">{items}</div>;
  }

  return (
    <ScrollArea className="h-40">
      <div className="flex flex-col gap-2 pr-3">{items}</div>
    </ScrollArea>
  );
}

export function SessionFilterPanel({
  facets,
  filters,
  onChange,
  matchCount,
}: {
  facets: SessionFacets;
  filters: SessionFilters;
  onChange: (filters: SessionFilters) => void;
  matchCount?: number;
}) {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-border">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex h-6 items-center justify-between">
            <h2 className="text-sm font-semibold">Filters</h2>
            <Button
              variant="ghost"
              size="xs"
              disabled={!hasActiveFilters(filters)}
              className={cn(!hasActiveFilters(filters) && "invisible")}
              onClick={() =>
                onChange({ ...DEFAULT_FILTERS, search: filters.search })
              }
            >
              <X className="size-3" />
              Clear ({activeFilterCount(filters)})
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Search this session…"
              className="h-8 pl-7 text-sm"
            />
          </div>
          {filters.search && (
            <span className="-mt-3 text-xs text-muted-foreground">
              {matchCount ?? 0} match{matchCount === 1 ? "" : "es"}
            </span>
          )}

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Time range
            </span>
            <div className="flex flex-wrap gap-1">
              {TIME_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  size="xs"
                  variant={
                    filters.timePreset === preset.value ? "default" : "outline"
                  }
                  onClick={() =>
                    onChange({ ...filters, timePreset: preset.value })
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            {filters.timePreset === "custom" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="date"
                  value={filters.customFrom ?? ""}
                  onChange={(e) =>
                    onChange({ ...filters, customFrom: e.target.value })
                  }
                  className={cn(
                    "h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs",
                    "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  )}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={filters.customTo ?? ""}
                  onChange={(e) =>
                    onChange({ ...filters, customTo: e.target.value })
                  }
                  className={cn(
                    "h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs",
                    "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  )}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Type
            </span>
            <CheckboxList
              category="type"
              options={RECORD_TYPE_OPTIONS.map((o) => o.value)}
              selected={filters.recordTypes}
              onToggle={(value) =>
                onChange({
                  ...filters,
                  recordTypes: toggle(filters.recordTypes, value),
                })
              }
              renderLabel={(value) =>
                RECORD_TYPE_OPTIONS.find((o) => o.value === value)?.label ??
                value
              }
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Tool used
            </span>
            <CheckboxList
              category="tools"
              options={facets.tools}
              selected={filters.tools}
              onToggle={(value) =>
                onChange({ ...filters, tools: toggle(filters.tools, value) })
              }
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              File touched
            </span>
            <CheckboxList
              category="files"
              options={facets.files}
              selected={filters.files}
              onToggle={(value) =>
                onChange({ ...filters, files: toggle(filters.files, value) })
              }
              renderLabel={(value) => value.split("/").slice(-2).join("/")}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Branch
            </span>
            <CheckboxList
              category="branches"
              options={facets.branches}
              selected={filters.branches}
              onToggle={(value) =>
                onChange({
                  ...filters,
                  branches: toggle(filters.branches, value),
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Version
            </span>
            <CheckboxList
              category="versions"
              options={facets.versions}
              selected={filters.versions}
              onToggle={(value) =>
                onChange({
                  ...filters,
                  versions: toggle(filters.versions, value),
                })
              }
            />
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
