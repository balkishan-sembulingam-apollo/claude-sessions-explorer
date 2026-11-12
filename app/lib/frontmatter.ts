/**
 * Minimal YAML-frontmatter parser tailored to the flat `key: value` (+ one
 * level of nesting) shape used by memory/*.md files. Not a general YAML parser.
 */
export function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const [, yaml, body] = match;
  const frontmatter: Record<string, unknown> = {};
  let currentNested: Record<string, unknown> | null = null;
  let currentNestedKey: string | null = null;

  for (const line of yaml.split("\n")) {
    if (!line.trim()) continue;
    const indented = /^\s+/.test(line);
    const lineMatch = line.match(/^(\s*)([\w-]+):\s*(.*)$/);
    if (!lineMatch) continue;
    const [, , key, valueRaw] = lineMatch;
    const value = stripQuotes(valueRaw.trim());

    if (!indented) {
      if (value === "") {
        currentNested = {};
        currentNestedKey = key;
        frontmatter[key] = currentNested;
      } else {
        frontmatter[key] = value;
        currentNested = null;
        currentNestedKey = null;
      }
    } else if (currentNested && currentNestedKey) {
      currentNested[key] = value;
    }
  }

  return { frontmatter, body: body.trim() };
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
