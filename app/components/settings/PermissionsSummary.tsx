import { Badge } from "@/components/ui/badge";
import type { PermissionRules } from "@/lib/claude-config";

const ALLOW_COLOR =
  "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
const DENY_COLOR = "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
const ASK_COLOR =
  "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

function RuleList({
  label,
  rules,
  colorClass,
}: {
  label: string;
  rules: string[];
  colorClass: string;
}) {
  if (rules.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label} ({rules.length})
      </span>
      <div className="flex flex-wrap gap-1">
        {rules.map((rule) => (
          <Badge key={rule} variant="outline" className={colorClass}>
            {rule}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function PermissionsSummary({
  permissions,
}: {
  permissions: PermissionRules | null;
}) {
  if (!permissions) {
    return (
      <p className="text-xs text-muted-foreground">
        No permission rules configured in this file.
      </p>
    );
  }

  const { allow, deny, ask } = permissions;
  if (allow.length === 0 && deny.length === 0 && ask.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No permission rules configured in this file.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      <RuleList label="Allow" rules={allow} colorClass={ALLOW_COLOR} />
      <RuleList label="Deny" rules={deny} colorClass={DENY_COLOR} />
      <RuleList label="Ask" rules={ask} colorClass={ASK_COLOR} />
    </div>
  );
}
