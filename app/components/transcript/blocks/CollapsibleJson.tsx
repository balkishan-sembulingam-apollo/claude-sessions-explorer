import { truncateForDisplay } from "@/lib/parse-session";

/** Native <details> block for pretty-printed JSON / raw text, collapsed by default. */
export function CollapsibleBlock({
  label,
  defaultOpen = false,
  children,
}: {
  label: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-md border border-border"
      open={defaultOpen}
    >
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground select-none hover:text-foreground">
        {label}
      </summary>
      <div className="border-t border-border p-3">{children}</div>
    </details>
  );
}

export function JsonBlock({ value }: { value: unknown }) {
  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <pre className="max-h-96 overflow-auto text-xs wrap-break-word whitespace-pre-wrap">
      <code>{truncateForDisplay(text)}</code>
    </pre>
  );
}
