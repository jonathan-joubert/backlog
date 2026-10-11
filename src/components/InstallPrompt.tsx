import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const DISMISSED_KEY = "pwa_install_dismissed";
const SHOW_DELAY_MS = 1500;

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

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
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

    let timer: number | undefined;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (timer !== undefined) window.clearTimeout(timer);
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // If the browser never offers a native install dialog (e.g. iOS Safari),
    // fall back to manual Add to Home Screen instructions after a short delay.
    timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [isMobile]);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
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

  const ios = isIos();

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
          {deferredPrompt ? (
            <>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add Backlog to your home screen for quick access and offline use.
              </p>
              <Button size="sm" className="mt-3" onClick={handleInstall} disabled={installing}>
                {installing ? "Installing…" : "Install"}
              </Button>
            </>
          ) : ios ? (
            <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
              <li className="flex items-center gap-1">
                Tap the <Share className="inline h-3.5 w-3.5 shrink-0" aria-label="Share" /> Share
                button in Safari.
              </li>
              <li className="flex items-center gap-1">
                Scroll down and tap{" "}
                <SquarePlus className="inline h-3.5 w-3.5 shrink-0" aria-label="Add" />{" "}
                <span className="font-medium text-card-foreground">Add to Home Screen</span>.
              </li>
              <li>
                Tap <span className="font-medium text-card-foreground">Add</span> to confirm.
              </li>
            </ol>
          ) : (
            <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
              <li>
                Open your browser's menu (<span aria-label="menu">⋮</span> or{" "}
                <span aria-label="menu">≡</span>).
              </li>
              <li>
                Tap{" "}
                <span className="font-medium text-card-foreground">
                  Add to Home screen
                </span>{" "}
                or <span className="font-medium text-card-foreground">Install app</span>.
              </li>
              <li>
                Tap <span className="font-medium text-card-foreground">Add</span> to confirm.
              </li>
            </ol>
          )}
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
