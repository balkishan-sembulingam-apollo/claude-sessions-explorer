import { get, set, del } from "idb-keyval";

const ROOT_HANDLE_KEY = "claude-sessions-explorer:root-handle";
const CLAUDE_HOME_HANDLE_KEY = "claude-sessions-explorer:claude-home-handle";
const EDITOR_SCHEME_KEY = "claude-sessions-explorer:editor-scheme";
const THEME_KEY = "claude-sessions-explorer:theme";

export async function saveRootHandle(handle: FileSystemDirectoryHandle) {
  await set(ROOT_HANDLE_KEY, handle);
}

export async function loadRootHandle(): Promise<
  FileSystemDirectoryHandle | undefined
> {
  return get<FileSystemDirectoryHandle>(ROOT_HANDLE_KEY);
}

export async function clearRootHandle() {
  await del(ROOT_HANDLE_KEY);
}

/** Home directory handle, used by the settings/configurator page to reach ~/.claude and ~/.claude.json. */
export async function saveClaudeHomeHandle(handle: FileSystemDirectoryHandle) {
  await set(CLAUDE_HOME_HANDLE_KEY, handle);
}

export async function loadClaudeHomeHandle(): Promise<
  FileSystemDirectoryHandle | undefined
> {
  return get<FileSystemDirectoryHandle>(CLAUDE_HOME_HANDLE_KEY);
}

export async function clearClaudeHomeHandle() {
  await del(CLAUDE_HOME_HANDLE_KEY);
}

const CUSTOM_CONFIG_FOLDERS_KEY =
  "claude-sessions-explorer:custom-config-folders";

export interface CustomConfigFolder {
  id: string;
  handle: FileSystemDirectoryHandle;
}

/** Cached list of custom project folders picked from the Settings page, so switching between them doesn't require re-picking each time. */
export async function loadCustomConfigFolders(): Promise<CustomConfigFolder[]> {
  return (await get<CustomConfigFolder[]>(CUSTOM_CONFIG_FOLDERS_KEY)) ?? [];
}

export async function saveCustomConfigFolders(folders: CustomConfigFolder[]) {
  await set(CUSTOM_CONFIG_FOLDERS_KEY, folders);
}

export function loadEditorScheme(): string {
  return localStorage.getItem(EDITOR_SCHEME_KEY) ?? "vscode";
}

export function saveEditorScheme(scheme: string) {
  localStorage.setItem(EDITOR_SCHEME_KEY, scheme);
}

export function loadTheme(): "light" | "dark" {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function saveTheme(theme: "light" | "dark") {
  localStorage.setItem(THEME_KEY, theme);
}
