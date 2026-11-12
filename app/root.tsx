import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { AppStoreProvider } from "@/contexts/app-store";
import { SettingsConfigProvider } from "@/contexts/settings-config-store";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Claude Sessions Explorer</title>
        <Meta />
        <Links />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden bg-background text-foreground antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <AppStoreProvider>
      <SettingsConfigProvider>
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
      </SettingsConfigProvider>
    </AppStoreProvider>
  );
}
