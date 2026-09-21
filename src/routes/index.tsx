import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Moon, Sun, Shield, Trash2, RefreshCw } from "lucide-react";

import { checkFirearmStatus, checkSapsHealth, type StatusResult } from "@/lib/saps.functions";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Firearm Status Tracker | SAPS Application Checker" },
      {
        name: "description",
        content:
          "Save your SAPS firearm licence applications and check their status in seconds.",
      },
      { property: "og:title", content: "Firearm Status Tracker" },
      {
        property: "og:description",
        content:
          "Save your SAPS firearm licence applications and check their status in seconds.",
      },
    ],
  }),
  component: Index,
});

type FirearmApplication = {
  id: string;
  alias: string;
  fsref: string;
  fserial: string;
};

const STORAGE_KEY = "saps_apps";

function Index() {
  const [savedApps, setSavedApps] = useState<FirearmApplication[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeResult, setActiveResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alias, setAlias] = useState("");
  const [fsref, setFsref] = useState("");
  const [fserial, setFserial] = useState("");

  const { theme, toggle } = useTheme();
  const fetchStatus = useServerFn(checkFirearmStatus);
  const health = useQuery({
    queryKey: ["saps-health"],
    queryFn: () => checkSapsHealth(),
    staleTime: 60_000,
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSavedApps(JSON.parse(raw));
      } catch {
        /* ignore corrupt storage */
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(savedApps));
  }, [savedApps, hydrated]);

  const addApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedApps((apps) => [...apps, { id: crypto.randomUUID(), alias, fsref, fserial }]);
    setAlias("");
    setFsref("");
    setFserial("");
  };

  const removeApplication = (id: string) =>
    setSavedApps((apps) => apps.filter((a) => a.id !== id));

  const checkStatus = async (app: FirearmApplication) => {
    setLoading(true);
    setError("");
    setActiveResult(null);
    try {
      const result = await fetchStatus({ data: { fsref: app.fsref, fserial: app.fserial } });
      setActiveResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Firearm Status Tracker</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your SAPS firearm licence applications in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                health.data?.isUp ? "bg-emerald-500" : health.isLoading ? "bg-amber-500" : "bg-destructive"
              }`}
            />
            SAPS portal:{" "}
            {health.isLoading ? "checking…" : health.data?.isUp ? "online" : "offline"}
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Add an application</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addApplication} className="space-y-3">
                  <Input
                    placeholder="Alias (e.g. Glock 19)"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Reference number (e.g. 10550740)"
                    value={fsref}
                    onChange={(e) => setFsref(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Serial number (e.g. AX008490)"
                    value={fserial}
                    onChange={(e) => setFserial(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full">
                    Save details
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Saved applications</h2>
              {savedApps.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
              )}
              {savedApps.map((app) => (
                <Card key={app.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                    <div>
                      <p className="font-medium">{app.alias}</p>
                      <p className="text-xs text-muted-foreground">
                        Ref {app.fsref} · SN {app.fserial}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={loading} onClick={() => checkStatus(app)}>
                        Check status
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeApplication(app.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <Card className="md:sticky md:top-10">
              <CardHeader>
                <CardTitle>Latest result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {loading && <p className="text-muted-foreground">Contacting SAPS…</p>}
                {error && !loading && <p className="text-destructive">{error}</p>}
                {!loading && !error && !activeResult && (
                  <p className="text-muted-foreground">
                    Choose a saved application and select “Check status”.
                  </p>
                )}
                {activeResult && !loading && !error && (
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-primary">{activeResult.status}</p>
                    <p>
                      <span className="text-muted-foreground">Date: </span>
                      {activeResult.statusDate}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Description: </span>
                      {activeResult.statusDescription}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Next step: </span>
                      {activeResult.nextStep}
                    </p>
                    <hr className="my-3 border-border" />
                    <p>
                      <span className="text-muted-foreground">Make: </span>
                      {activeResult.make}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Calibre: </span>
                      {activeResult.calibre}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Application: </span>
                      {activeResult.applicationType} · {activeResult.applicationNumber}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
