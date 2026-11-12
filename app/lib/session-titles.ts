const PREFIX = "claude-sessions-explorer:title:";

/** User-edited session titles, kept locally and layered over the transcript-derived title. */
export function loadSessionTitle(
  projectKey: string,
  sessionId: string,
): string | null {
  return localStorage.getItem(`${PREFIX}${projectKey}:${sessionId}`);
}

export function saveSessionTitle(
  projectKey: string,
  sessionId: string,
  title: string,
) {
  localStorage.setItem(`${PREFIX}${projectKey}:${sessionId}`, title);
}
