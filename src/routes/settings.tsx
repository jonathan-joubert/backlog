import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const LOCAL_KEYS = ["backlog_apps", "backlog_firearms", "backlog_theme"];

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Backlog" },
      { name: "description", content: "Manage local data and install Backlog as an app." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const clearAll = () => {
    try {
      LOCAL_KEYS.forEach((k) => window.localStorage.removeItem(k));
      toast.success("All local data cleared. Reloading…");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("Could not clear local data.");
    }
  };

  const install = async () => {
    if (!installEvent) {
      toast.info("Use your browser's menu → 'Add to Home Screen' / 'Install app'.");
      return;
    }
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      toast.success("Backlog installed.");
      setInstalled(true);
    }
    setInstallEvent(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your locally stored data and install Backlog on your device.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Install as an app</CardTitle>
          <CardDescription>
            Add Backlog to your home screen for an app-like, full-screen experience. Works offline-free —
            all data still lives on your device only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={install} disabled={installed} className="gap-2">
            <Download className="h-4 w-4" />
            {installed ? "Installed" : installEvent ? "Install Backlog" : "Install (use browser menu)"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            <strong>iOS Safari:</strong> tap the Share icon, then "Add to Home Screen".<br />
            <strong>Android Chrome:</strong> tap the menu, then "Install app" or "Add to Home screen".
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clear all local data</CardTitle>
          <CardDescription>
            Permanently deletes every saved application, firearm, and preference from this browser. This
            action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear all local data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Erase everything stored locally?</AlertDialogTitle>
                <AlertDialogDescription>
                  All saved applications, firearms, and preferences will be permanently removed from this
                  device. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
