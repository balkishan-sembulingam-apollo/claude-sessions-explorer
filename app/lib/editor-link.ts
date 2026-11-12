export const EDITOR_SCHEMES = [
  { id: "vscode", label: "VS Code", scheme: "vscode" },
  { id: "cursor", label: "Cursor", scheme: "cursor" },
  { id: "windsurf", label: "Windsurf", scheme: "windsurf" },
] as const;

export type EditorSchemeId = (typeof EDITOR_SCHEMES)[number]["id"] | string;

/** Build a `<scheme>://file/<path>:<line>` deep link to open a file in a local editor. */
export function buildEditorLink(
  schemeId: EditorSchemeId,
  absolutePath: string,
  line?: number,
): string {
  const known = EDITOR_SCHEMES.find((s) => s.id === schemeId);
  const scheme = known?.scheme ?? schemeId;
  const suffix = line ? `:${line}` : "";
  return `${scheme}://file${absolutePath}${suffix}`;
}
