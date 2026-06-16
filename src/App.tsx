import { Routes, Route, Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeInit, ThemeToggle } from "@/components/theme-toggle";
import { LicensingGuide } from "@/components/licensing-guide";
import { SapsStatusBadge } from "@/components/saps-status-badge";
import { AppFooter } from "@/components/app-footer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import TrackApplicationsPage from "@/routes/index";
import FirearmsPage from "@/routes/firearms";
import PrivacyPage from "@/routes/privacy";
import SettingsPage from "@/routes/settings";

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export function App() {
  // useLocation read here only to ensure rerenders propagate to consumers.
  useLocation();

  return (
    <>
      <ThemeInit />
      <TooltipProvider delayDuration={150}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex flex-1 flex-col min-w-0">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4">
                <SidebarTrigger />
                <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                  <SapsStatusBadge />
                  <LicensingGuide />
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-8">
                <Routes>
                  <Route path="/" element={<TrackApplicationsPage />} />
                  <Route path="/firearms" element={<FirearmsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <AppFooter />
            </div>
          </div>
          <Toaster richColors closeButton position="top-right" />
        </SidebarProvider>
      </TooltipProvider>
    </>
  );
}
