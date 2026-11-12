import {
  loadClaudeHomeHandle,
  loadRootHandle,
  saveClaudeHomeHandle,
  saveRootHandle,
} from "@/lib/handle-store";

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export type PermissionState = "granted" | "prompt" | "denied";

/** Read-only permission check — doesn't require a user gesture, unlike requestPermission. */
export async function checkPermission(
  handle: FileSystemDirectoryHandle,
): Promise<PermissionState> {
  // queryPermission/requestPermission aren't in the lib.dom types yet.
  const anyHandle = handle as unknown as {
    queryPermission: (opts: { mode: string }) => Promise<PermissionState>;
    requestPermission: (opts: { mode: string }) => Promise<PermissionState>;
  };
  return anyHandle.queryPermission({ mode: "read" });
}

async function requestPermission(
  handle: FileSystemDirectoryHandle,
): Promise<PermissionState> {
  const anyHandle = handle as unknown as {
    requestPermission: (opts: { mode: string }) => Promise<PermissionState>;
  };
  return anyHandle.requestPermission({ mode: "read" });
}

/** First-visit pick: user selects ~/.claude/projects once. */
export async function pickRootDirectory(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker({
    id: "claude-projects-root",
    mode: "read",
    startIn: "documents",
  });
  await saveRootHandle(handle);
  return handle;
}

export type RestoreResult =
  | { status: "restored"; handle: FileSystemDirectoryHandle }
  | { status: "needs-permission"; handle: FileSystemDirectoryHandle }
  | { status: "none" };

async function restoreDirectory(
  load: () => Promise<FileSystemDirectoryHandle | undefined>,
): Promise<RestoreResult> {
  let handle: FileSystemDirectoryHandle | undefined;
  try {
    handle = await load();
  } catch (e) {
    console.error("Failed to load persisted folder handle from IndexedDB", e);
    return { status: "none" };
  }
  if (!handle) return { status: "none" };

  try {
    const state = await checkPermission(handle);
    if (state === "granted") return { status: "restored", handle };
    return { status: "needs-permission", handle };
  } catch (e) {
    console.error("Failed to query permission for persisted folder handle", e);
    return { status: "needs-permission", handle };
  }
}

/**
 * Every later visit: restore the persisted handle and re-verify permission.
 * Returns null if there's nothing persisted yet, or "needs-gesture" if the
 * browser requires a fresh user gesture before permission can be confirmed.
 */
export async function restoreRootDirectory(): Promise<RestoreResult> {
  return restoreDirectory(loadRootHandle);
}

/** Call on a user gesture (e.g. clicking "Allow") when status is needs-permission. */
export async function confirmPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const state = await requestPermission(handle);
  return state === "granted";
}

/**
 * First-visit pick for the settings/configurator page: user selects their
 * ~/.claude folder once. This targets ~/.claude directly rather than the home
 * directory — Chromium refuses to grant a directory handle for the home
 * directory (and other well-known "sensitive" folders) via
 * showDirectoryPicker, so asking for it would just fail every time.
 */
export async function pickClaudeHomeDirectory(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker({
    id: "claude-home-root",
    mode: "read",
    startIn: "documents",
  });
  await saveClaudeHomeHandle(handle);
  return handle;
}

export async function restoreClaudeHomeDirectory(): Promise<RestoreResult> {
  return restoreDirectory(loadClaudeHomeHandle);
}

/** One-off pick for inspecting a specific project's local .claude/settings.json — not persisted. */
export async function pickAdHocDirectory(): Promise<FileSystemDirectoryHandle> {
  return window.showDirectoryPicker({
    id: "claude-configurator-project",
    mode: "read",
    startIn: "documents",
  });
}

/** Resolve an absolute path (e.g. from persistedOutputPath) to a relative path under root. */
export function toRelativeSegments(
  absolutePath: string,
  rootDirName: string,
): string[] | null {
  const marker = `/${rootDirName}/`;
  const idx = absolutePath.indexOf(marker);
  if (idx === -1) return null;
  const rel = absolutePath.slice(idx + marker.length);
  return rel.split("/").filter(Boolean);
}

/** Walk a directory handle by relative path segments to reach a file handle. */
export async function getFileByPath(
  root: FileSystemDirectoryHandle,
  segments: string[],
): Promise<FileSystemFileHandle | null> {
  let dir = root;
  for (let i = 0; i < segments.length - 1; i++) {
    try {
      dir = await dir.getDirectoryHandle(segments[i]);
    } catch {
      return null;
    }
  }
  try {
    return await dir.getFileHandle(segments[segments.length - 1]);
  } catch {
    return null;
  }
}
