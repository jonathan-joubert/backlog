import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationsList } from "@/components/applications-list";
import type { FirearmApplication } from "@/lib/saps";
import { calendarDaysSince } from "@/lib/dates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Track Applications · Backlog" },
      {
        name: "description",
        content:
          "Track SAPS firearm licence applications with calendar and working-day aging.",
      },
    ],
  }),
  component: TrackApplicationsPage,
});

function TrackApplicationsPage() {
  const [apps, setApps] = useState<FirearmApplication[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("backlog_apps");
      if (raw) setApps(JSON.parse(raw));
    } catch {
      // ignore
    }
    const onStorage = () => {
      try {
        const raw = window.localStorage.getItem("backlog_apps");
        setApps(raw ? JSON.parse(raw) : []);
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);
    const interval = setInterval(onStorage, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  const total = apps.length;
  const overdue = apps.filter((a) => calendarDaysSince(a.submittedAt) > 120).length;
  const pending = apps.filter((a) => !a.lastResult).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Track applications</h1>
        <p className="text-sm text-muted-foreground">
          Monitor each SAPS firearm licence application — its aging, status, and next steps.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Saved applications"
          value={total}
          tone="default"
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Awaiting first status"
          value={pending}
          tone="muted"
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Past 120-day mandate"
          value={overdue}
          tone={overdue > 0 ? "danger" : "muted"}
        />
      </div>

      <ApplicationsList />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "default" | "muted" | "danger";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div
            className={
              "mt-1 text-3xl font-semibold tabular-nums " +
              (tone === "danger"
                ? "text-destructive"
                : tone === "muted"
                  ? "text-foreground"
                  : "text-primary")
            }
          >
            {value}
          </div>
        </div>
        <div
          className={
            "flex h-10 w-10 items-center justify-center rounded-lg " +
            (tone === "danger"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary")
          }
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
