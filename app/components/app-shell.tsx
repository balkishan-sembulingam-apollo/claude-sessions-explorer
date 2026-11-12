import { Bot, FolderGit2, Home, Search, Settings } from "lucide-react";
import * as React from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GlobalSearchDialog } from "@/components/global-search/GlobalSearchDialog";
import { ProjectSwitcher } from "@/components/project-switcher";
import { ProjectSidebarContent } from "@/components/sidebar-navigation";
import { SettingsSidebarContent } from "@/components/settings/SettingsSidebarContent";
import { ThemeToggle } from "@/components/theme-toggle";
import { FolderPicker } from "@/components/folder-picker";
import { useAppStore } from "@/contexts/app-store";

export default function AppShell() {
  const { folderStatus } = useAppStore();
  const { projectKey } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (folderStatus !== "ready") {
    return <FolderPicker />;
  }

  const isHome = pathname === "/";
  const isSettings = pathname.startsWith("/settings");

  return (
    <SidebarProvider
      open={isHome ? false : undefined}
      onOpenChange={isHome ? () => {} : undefined}
    >
      <Sidebar collapsible="icon">
        {isHome ? (
          <SidebarHeader className="items-center py-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </div>
          </SidebarHeader>
        ) : (
          <>
            <SidebarHeader>{!isSettings && <ProjectSwitcher />}</SidebarHeader>
            <SidebarContent>
              {isSettings ? (
                <SettingsSidebarContent />
              ) : (
                <ProjectSidebarContent projectKey={projectKey} />
              )}
            </SidebarContent>
          </>
        )}
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
          <div className="flex items-center gap-2">
            {!isHome && (
              <>
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4" />
              </>
            )}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={isHome ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => navigate("/")}
                  >
                    <Home className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Home</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={!isHome && !isSettings ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => navigate("/projects")}
                  >
                    <FolderGit2 className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Claude projects</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={isSettings ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Settings &amp; permissions</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Search all sessions (⌘K)</TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>
        </header>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </section>
      </SidebarInset>
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
