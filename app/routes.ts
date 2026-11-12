import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("components/app-shell.tsx", [
    index("routes/home.tsx"),
    route("projects", "routes/projects.tsx"),
    route("project/:projectKey", "routes/project.tsx", [
      index("routes/project-index.tsx"),
      route("session/:sessionId", "routes/session.tsx"),
      route("memory/:memoryFile", "routes/memory.tsx"),
    ]),
    route("settings", "routes/settings-layout.tsx", [
      index("routes/settings/global.tsx"),
      route("mcp", "routes/settings/mcp.tsx"),
      route("policy", "routes/settings/policy.tsx"),
      route("remote", "routes/settings/remote.tsx"),
    ]),
  ]),
  route(
    ".well-known/appspecific/com.chrome.devtools.json",
    "routes/well-known.chrome-devtools.tsx",
  ),
] satisfies RouteConfig;
