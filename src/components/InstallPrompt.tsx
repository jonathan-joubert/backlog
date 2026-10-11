import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const DISMISSED_KEY = "pwa_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isInstalledAsPwa(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari sets this when launched from the home screen.
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return true;
  return false;
}

export function InstallPrompt() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    if (isInstalledAsPwa()) return;
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [isMobile]);

  if (!visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleClose = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Install Backlog"
      className="fixed left-3 right-3 top-3 z-50 rounded-lg border border-border bg-card p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Download className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-card-foreground">Install Backlog</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add Backlog to your home screen for quick access and offline use.
          </p>
          <Button size="sm" className="mt-3" onClick={handleInstall} disabled={installing}>
            {installing ? "Installing…" : "Install"}
          </Button>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close install prompt"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
