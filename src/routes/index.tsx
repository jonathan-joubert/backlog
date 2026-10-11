import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { GiTrident } from "react-icons/gi";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Download,
  ExternalLink,
  Github,
  HelpCircle,
  LockKeyhole,
  Moon,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";

import { checkFirearmStatus, checkSapsHealth, type StatusResult } from "@/lib/saps";
import { LEGAL_WORKING_DAYS, workingDaysSince } from "@/lib/working-days";
import { useTheme } from "@/hooks/use-theme";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Backlog | SAPS Firearm Application Status" },
      {
        name: "description",
        content:
          "Privately save SAPS firearm licence applications on your device and check their status.",
      },
      { property: "og:title", content: "Backlog" },
      {
        property: "og:description",
        content:
          "Privately save SAPS firearm licence applications on your device and check their status.",
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
  submittedAt?: string;
};

const STORAGE_KEY = "saps_apps";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function WorkingDays({ submittedAt }: { submittedAt?: string }) {
  if (!submittedAt) return null;
  const days = workingDaysSince(submittedAt);
  if (days === null) return null;
  const overdue = days > LEGAL_WORKING_DAYS;
  const formatted = new Date(`${submittedAt}T00:00:00`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${
          overdue
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-border bg-muted text-muted-foreground"
        }`}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        {days} working {days === 1 ? "day" : "days"}
        {overdue && " · overdue"}
      </span>
      <span className="text-muted-foreground">since {formatted}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="About the 120 working day limit"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 text-xs leading-5">
          <p className="font-semibold text-foreground">The 120 working day limit</p>
          <p className="mt-1 text-muted-foreground">
            According to the law, SAPS should process a firearm licence application within 120
            working days of submission. This count includes Monday to Friday only and excludes
            South African public holidays.
          </p>
          {overdue && (
            <p className="mt-2 text-destructive">
              This application is {days - LEGAL_WORKING_DAYS} working days past that limit.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function StatusDot({ app, result }: { app: FirearmApplication; result?: StatusResult | string }) {
  let dot: { colour: string; label: string } | null = null;
  if (typeof result === "string") {
    dot = { colour: "bg-destructive", label: "Check failed" };
  } else if (result) {
    const status = result.status.toLowerCase();
    if (status.includes("approv")) {
      dot = { colour: "bg-primary", label: result.status };
    } else if (status.includes("reject") || status.includes("declin")) {
      dot = { colour: "bg-destructive", label: result.status };
    } else {
      dot = { colour: "bg-accent", label: result.status };
    }
  } else if (app.submittedAt) {
    const days = workingDaysSince(app.submittedAt);
    if (days !== null && days > LEGAL_WORKING_DAYS) {
      dot = { colour: "bg-destructive", label: "Overdue" };
    }
  }
  if (!dot) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${dot.colour}`} />
      {dot.label}
    </p>
  );
}

function Index() {
  const [savedApps, setSavedApps] = useState<FirearmApplication[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeResult, setActiveResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [alias, setAlias] = useState("");
  const [fsref, setFsref] = useState("");
  const [fserial, setFserial] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirearmApplication | null>(null);
  const [results, setResults] = useState<Record<string, StatusResult | string>>({});
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const { theme, toggle } = useTheme();
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

  const resetForm = () => {
    setAlias("");
    setFsref("");
    setFserial("");
    setSubmittedAt("");
    setEditingId(null);
    setDuplicate(false);
  };

  const isDuplicate = (ref: string, serial: string, excludeId?: string | null) =>
    savedApps.some(
      (a) =>
        a.id !== excludeId &&
        a.fsref.trim().toLowerCase() === ref.trim().toLowerCase() &&
        a.fserial.trim().toLowerCase() === serial.trim().toLowerCase(),
    );

  const saveApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicate(fsref, fserial, editingId) && !duplicate) {
      setDuplicate(true);
      return;
    }
    const fields = { alias, fsref, fserial, submittedAt: submittedAt || undefined };
    if (editingId) {
      setSavedApps((apps) => apps.map((a) => (a.id === editingId ? { ...a, ...fields } : a)));
    } else {
      setSavedApps((apps) => [...apps, { id: crypto.randomUUID(), ...fields }]);
    }
    resetForm();
  };

  const exportBackup = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), applications: savedApps },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backlog-backup-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (file: File) => {
    setImportMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed?.applications;
        if (!Array.isArray(list)) throw new Error("invalid");
        const valid = list.filter(
          (a): a is { alias: string; fsref: string; fserial: string; submittedAt?: string } =>
            a &&
            typeof a.alias === "string" &&
            typeof a.fsref === "string" &&
            typeof a.fserial === "string",
        );
        if (valid.length === 0) {
          setImportMsg("No applications found in that file.");
          return;
        }
        const next = [...savedApps];
        let added = 0;
        let skipped = 0;
        for (const a of valid) {
          const dupe = next.some(
            (x) =>
              x.fsref.trim().toLowerCase() === a.fsref.trim().toLowerCase() &&
              x.fserial.trim().toLowerCase() === a.fserial.trim().toLowerCase(),
          );
          if (dupe) {
            skipped += 1;
            continue;
          }
          next.push({
            id: crypto.randomUUID(),
            alias: a.alias,
            fsref: a.fsref,
            fserial: a.fserial,
            submittedAt: typeof a.submittedAt === "string" ? a.submittedAt : undefined,
          });
          added += 1;
        }
        if (added > 0) setSavedApps(next);
        setImportMsg(
          `Imported ${added} application${added === 1 ? "" : "s"}${
            skipped ? `, skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : ""
          }.`,
        );
      } catch {
        setImportMsg("That file could not be read. Choose a Backlog backup (.json) file.");
      }
    };
    reader.readAsText(file);
  };

  const startEdit = (app: FirearmApplication) => {
    setEditingId(app.id);
    setAlias(app.alias);
    setFsref(app.fsref);
    setFserial(app.fserial);
    setSubmittedAt(app.submittedAt ?? "");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const removeApplication = (id: string) =>
    setSavedApps((apps) => apps.filter((a) => a.id !== id));

  const filteredApps = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    if (!normalised) return savedApps;
    return savedApps.filter((app) => app.alias.toLowerCase().includes(normalised));
  }, [query, savedApps]);

  const maskValue = (value: string) => {
    if (value.length <= 4) return "••••";
    return `${"•".repeat(Math.min(6, value.length - 4))}${value.slice(-4)}`;
  };

  const checkStatus = async (app: FirearmApplication) => {
    setLoading(true);
    setCheckingId(app.id);
    setError("");
    setActiveResult(null);
    try {
      const result = await checkFirearmStatus({ fsref: app.fsref, fserial: app.fserial });
      setActiveResult(result);
      setResults((r) => ({ ...r, [app.id]: result }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch status.";
      setError(message);
      setResults((r) => ({ ...r, [app.id]: message }));
    } finally {
      setLoading(false);
      setCheckingId(null);
    }
  };

  const checkAll = async () => {
    if (savedApps.length === 0 || bulk) return;
    setResults({});
    setBulk({ done: 0, total: savedApps.length });
    let done = 0;
    for (const app of savedApps) {
      setCheckingId(app.id);
      try {
        const result = await checkFirearmStatus({ fsref: app.fsref, fserial: app.fserial });
        setResults((r) => ({ ...r, [app.id]: result }));
      } catch (err) {
        setResults((r) => ({
          ...r,
          [app.id]: err instanceof Error ? err.message : "Failed to fetch status.",
        }));
      }
      done += 1;
      setBulk({ done, total: savedApps.length });
    }
    setCheckingId(null);
    setBulk(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-primary)_0%,transparent_70%)] opacity-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5 sm:mb-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm sm:h-11 sm:w-11">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Backlog</h1>
              <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
                Your SAPS firearm applications, securely organised on this device.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-sm sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  health.isLoading
                    ? "bg-accent"
                    : health.data?.isUp
                      ? "bg-primary animate-pulse"
                      : "bg-destructive"
                }`}
              />
              <span>SAPS portal:</span>
              <span>{health.isLoading ? "checking…" : health.data?.isUp ? "online" : "offline"}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
               className="rounded-full"
              aria-label="Toggle dark mode"
              onClick={toggle}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <Collapsible open={noticeOpen} onOpenChange={setNoticeOpen} className="mb-6 rounded-lg border border-accent/40 bg-accent/10">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-left hover:bg-accent/15">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-accent-foreground" />
                Important update for Google Play users
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${noticeOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
            Backlog has moved away from Google Play. Recent changes to the SAPS firearm portal mean the previous Android app no longer works. Everything is now available here, where it can be maintained more reliably.
          </CollapsibleContent>
        </Collapsible>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-8">
          <section className="min-w-0 space-y-6">
            <Card ref={formRef}>
              <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
                <CardTitle className="text-lg">{editingId ? "Edit application" : "Add an application"}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                <form onSubmit={saveApplication} className="grid gap-4" autoComplete="off">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Application name
                    <Input
                      placeholder="e.g. My application"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      maxLength={80}
                      required
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-medium">
                      Reference number
                      <Input
                        placeholder="e.g. 00000000"
                        value={fsref}
                        onChange={(e) => setFsref(e.target.value)}
                        inputMode="numeric"
                        maxLength={40}
                        spellCheck={false}
                        required
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                      Serial number
                      <Input
                        placeholder="e.g. ABC123456"
                        value={fserial}
                        onChange={(e) => setFserial(e.target.value)}
                        maxLength={40}
                        spellCheck={false}
                        required
                      />
                    </label>
                  </div>
                  <label className="grid gap-1.5 text-sm font-medium">
                    <span>
                      Date submitted to the DFO <span className="font-normal text-muted-foreground">(optional)</span>
                    </span>
                    <Input
                      type="date"
                      value={submittedAt}
                      max={todayIso()}
                      onChange={(e) => setSubmittedAt(e.target.value)}
                    />
                  </label>
                  {duplicate && (
                    <p className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs leading-5 text-foreground" role="alert">
                      An application with this reference and serial number is already saved. Select
                      “Save anyway” to keep both, or change the details.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {duplicate ? "Save anyway" : editingId ? "Save changes" : "Save application"}
                    </Button>
                    {(editingId || duplicate) && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <LockKeyhole className="h-3.5 w-3.5" /> Saved only in this browser on this device.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3" aria-labelledby="saved-applications-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="saved-applications-heading" className="text-lg font-semibold">Saved applications</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {bulk && (
                    <span className="text-xs text-muted-foreground" aria-live="polite">
                      checking {bulk.done}/{bulk.total}…
                    </span>
                  )}
                  {savedApps.length > 0 && (
                    <Button size="sm" variant="outline" disabled={loading || !!bulk} onClick={checkAll}>
                      <RefreshCw className={`h-4 w-4 ${bulk ? "animate-spin" : ""}`} />
                      Check all
                    </Button>
                  )}
                  {savedApps.length > 0 && (
                    <Button size="sm" variant="outline" onClick={exportBackup} title="Download a backup of your saved applications">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} title="Restore saved applications from a backup file">
                    <Upload className="h-4 w-4" />
                    Import
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) importBackup(file);
                      e.target.value = "";
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{savedApps.length} saved</span>
                </div>
              </div>
              {importMsg && (
                <p className="text-xs text-muted-foreground" role="status">{importMsg}</p>
              )}
              {savedApps.length > 4 && (
                <label className="relative block">
                  <span className="sr-only">Search saved applications</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search by application name" value={query} onChange={(e) => setQuery(e.target.value)} />
                </label>
              )}
              {savedApps.length === 0 && (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm font-medium">No applications saved yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Add your first application above.</p>
                </div>
              )}
              {savedApps.length > 0 && (
                <div className="max-h-[28rem] space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
              {filteredApps.map((app) => (
                <Card key={app.id} className={`shadow-sm transition-colors hover:border-primary/35 ${editingId === app.id ? "border-primary" : ""}`}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{app.alias}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        Ref {maskValue(app.fsref)} · SN {maskValue(app.fserial)}
                      </p>
                      <WorkingDays submittedAt={app.submittedAt} />
                      <StatusDot app={app} result={results[app.id]} />
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                      <Button
                        className="flex-1 sm:flex-none"
                        size="sm"
                        disabled={loading || !!bulk}
                        onClick={() => checkStatus(app)}
                      >
                        <RefreshCw className={`h-4 w-4 ${checkingId === app.id ? "animate-spin" : ""}`} />
                        Check status
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Edit ${app.alias}`}
                        title={`Edit ${app.alias}`}
                        onClick={() => startEdit(app)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Remove ${app.alias}`}
                        title={`Remove ${app.alias}`}
                        onClick={() => setDeleteTarget(app)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
                {filteredApps.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No matching applications.</p>}
                </div>
              )}
            </div>
          </section>

          <section>
            <Card className="lg:sticky lg:top-6">
              <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
                <CardTitle className="flex items-center justify-between gap-3 text-lg">
                  Latest result
                  <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground sm:hidden">
                    <span className={`h-2 w-2 rounded-full ${health.isLoading ? "bg-accent" : health.data?.isUp ? "bg-primary" : "bg-destructive"}`} />
                    SAPS {health.isLoading ? "checking…" : health.data?.isUp ? "online" : "offline"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-5 pb-5 text-sm sm:px-6 sm:pb-6">
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

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove “{deleteTarget?.alias}”?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this application from this device. This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteTarget) {
                    if (editingId === deleteTarget.id) resetForm();
                    removeApplication(deleteTarget.id);
                  }
                  setDeleteTarget(null);
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <footer className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <a
                href="https://github.com/jonathan-joubert/backlog"
                target="_blank"
                rel="noopener noreferrer"
              >
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Github className="h-4 w-4" /> Backlog is open source.
              </p>
              </a>
              <p className="mt-1 text-xs">Built for the South African firearm community.</p>
              <p className="mt-1 text-xs">
                Found a bug or need help? Email{" "}
                <a className="font-medium text-primary underline-offset-4 hover:underline" href="mailto:jjoubert@fibco.co.za">
                  jjoubert@fibco.co.za
                </a>
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href="https://www.saps.gov.za/services/firearm_status_enquiry.php"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Official SAPS website <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Collapsible open={privacyOpen} onOpenChange={setPrivacyOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" aria-expanded={privacyOpen}>
                      Privacy policy <ChevronDown className={`h-4 w-4 transition-transform ${privacyOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </div>
              <p className="text-xs sm:text-right">
                Looking for a sport shooting club in the Johannesburg area? Check out{" "}
                <a
                  className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
                  href="https://tssc.org.za/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GiTrident className="h-3.5 w-3.5" aria-hidden="true" />
                  TSSC
                </a>
              </p>
            </div>
          </div>
          <Collapsible open={privacyOpen} onOpenChange={setPrivacyOpen}>
            <CollapsibleContent className="mt-4 rounded-lg border border-border bg-card p-4 text-xs leading-5 sm:p-5">
              <h2 className="font-semibold text-foreground">Privacy policy</h2>
              <p className="mt-2"><strong className="text-foreground">No tracking whatsoever.</strong> Backlog uses no analytics, advertising pixels, tracking cookies or user accounts.</p>
              <p className="mt-2">Your saved application names, reference numbers and serial numbers remain in this browser on this device. They are not stored by Backlog. Clearing this site’s browser data will remove them.</p>
              <p className="mt-2">When you check a status, the reference and serial number are sent through this website’s secure proxy to the official SAPS firearm portal solely to retrieve the result. Backlog does not retain that request or result.</p>
            </CollapsibleContent>
          </Collapsible>
          <p className="mt-5 pb-2 text-xs">Not affiliated with or endorsed by the South African Police Service.</p>
        </footer>
      </div>
    </div>
  );
}
