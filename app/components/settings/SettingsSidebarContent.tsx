import {
  FolderOpen,
  Plug,
  ScrollText,
  Settings2,
  ShieldQuestion,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSettingsConfig } from "@/contexts/settings-config-store";
import { basename } from "@/lib/format";

const NAV_ITEMS = [
  { to: "/settings", end: true, label: "Global config", icon: Settings2 },
  { to: "/settings/mcp", end: false, label: "MCP servers", icon: Plug },
  { to: "/settings/policy", end: false, label: "Policy", icon: ShieldQuestion },
  { to: "/settings/remote", end: false, label: "Remote", icon: ScrollText },
];

export function SettingsSidebarContent() {
  const {
    scope,
    setScope,
    customFolders,
    addCustomFolder,
    removeCustomFolder,
  } = useSettingsConfig();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Scope</SidebarGroupLabel>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={scope === "root"}
              onClick={() => setScope("root")}
            >
              <FolderOpen />
              Root (~/.claude)
            </SidebarMenuButton>
          </SidebarMenuItem>

          {customFolders.map((folder) => (
            <SidebarMenuItem key={folder.id}>
              <SidebarMenuButton
                isActive={scope === folder.id}
                onClick={() => setScope(folder.id)}
                tooltip={folder.handle.name}
              >
                <FolderOpen />
                <span className="truncate">{basename(folder.handle.name)}</span>
              </SidebarMenuButton>
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomFolder(folder.id);
                }}
              >
                <X className="size-3" />
              </Button>
            </SidebarMenuItem>
          ))}

          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => void addCustomFolder()}>
              <FolderOpen />
              Add custom folder…
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Configuration</SidebarGroupLabel>
        <ScrollArea className="min-h-0">
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.end
                ? pathname === item.to
                : pathname.startsWith(item.to);
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => navigate(item.to)}
                  >
                    <item.icon />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarGroup>
    </>
  );
}
