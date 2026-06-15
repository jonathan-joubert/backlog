import { useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/date-picker";
import { useLocalStorage } from "@/lib/storage";
import {
  calendarDaysSince,
  saWorkingDaysSince,
  formatDate,
} from "@/lib/dates";
import {
  checkApplicationStatus,
  type FirearmApplication,
  type StatusResult,
} from "@/lib/saps";
import { cn } from "@/lib/utils";

const SAPS_MANDATE_DAYS = 120;

interface AppDraft {
  alias: string;
  fsref: string;
  fserial: string;
  submittedAt: string;
}

const emptyDraft: AppDraft = { alias: "", fsref: "", fserial: "", submittedAt: "" };

export function ApplicationsList() {
  const [apps, setApps] = useLocalStorage<FirearmApplication[]>("backlog_apps", []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FirearmApplication | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // inline add form state
  const [draft, setDraft] = useState<AppDraft>(emptyDraft);

  const addApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.alias || !draft.fsref || !draft.fserial || !draft.submittedAt) {
      toast.error("Please complete all fields.");
      return;
    }
    const next: FirearmApplication = { id: crypto.randomUUID(), ...draft };
    setApps([next, ...apps]);
    setDraft(emptyDraft);
    toast.success("Application saved.");
  };

  const removeApp = (id: string) => {
    setApps(apps.filter((a) => a.id !== id));
    toast.success("Application removed.");
  };

  const saveEdit = (updated: AppDraft) => {
    if (!editing) return;
    if (!updated.alias || !updated.fsref || !updated.fserial || !updated.submittedAt) {
      toast.error("Please complete all fields.");
      return;
    }
    setApps(apps.map((a) => (a.id === editing.id ? { ...a, ...updated } : a)));
    setEditOpen(false);
    setEditing(null);
    toast.success("Application updated.");
  };

  const checkStatus = async (app: FirearmApplication) => {
    setLoadingId(app.id);
    try {
      const result: StatusResult = await checkApplicationStatus(app.fsref, app.fserial);
      setApps(
        apps.map((a) =>
          a.id === app.id
            ? { ...a, lastResult: result, lastCheckedAt: new Date().toISOString() }
            : a,
        ),
      );
      toast.success(`Status updated for ${app.alias}.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch status");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add new application</CardTitle>
          <CardDescription>
            Saved locally in your browser. Nothing is sent until you check status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationForm
            value={draft}
            onChange={setDraft}
            onSubmit={addApp}
            submitLabel={
              <>
                <Plus className="h-4 w-4" />
                Save application
              </>
            }
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {apps.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No applications yet. Add your first one to start tracking.
            </CardContent>
          </Card>
        )}
        {apps.map((app) => (
          <ApplicationRow
            key={app.id}
            app={app}
            loading={loadingId === app.id}
            onCheck={() => checkStatus(app)}
            onRemove={() => removeApp(app.id)}
            onEdit={() => {
              setEditing(app);
              setEditOpen(true);
            }}
          />
        ))}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditing(null);
        }}
      >
        {editing && (
          <EditApplicationDialog
            initial={{
              alias: editing.alias,
              fsref: editing.fsref,
              fserial: editing.fserial,
              submittedAt: editing.submittedAt,
            }}
            onSave={saveEdit}
          />
        )}
      </Dialog>
    </div>
  );
}

function ApplicationForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
}: {
  value: AppDraft;
  onChange: (v: AppDraft) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: React.ReactNode;
}) {
  const set = <K extends keyof AppDraft>(k: K, v: AppDraft[K]) =>
    onChange({ ...value, [k]: v });
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="alias">Alias</Label>
        <Input
          id="alias"
          placeholder="e.g. Glock 19 Gen 5"
          value={value.alias}
          onChange={(e) => set("alias", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fsref">Reference number</Label>
        <Input
          id="fsref"
          placeholder="e.g. 10550740"
          value={value.fsref}
          onChange={(e) => set("fsref", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fserial">Serial number</Label>
        <Input
          id="fserial"
          placeholder="e.g. AX008490"
          value={value.fserial}
          onChange={(e) => set("fserial", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Date submitted</Label>
        <DatePicker
          value={value.submittedAt}
          onChange={(iso) => set("submittedAt", iso)}
          disabled={(d) => d > new Date()}
          placeholder="Pick submission date"
        />
      </div>
      <Button type="submit" className="w-full gap-2">
        {submitLabel}
      </Button>
    </form>
  );
}

function EditApplicationDialog({
  initial,
  onSave,
}: {
  initial: AppDraft;
  onSave: (v: AppDraft) => void;
}) {
  const [draft, setDraft] = useState<AppDraft>(initial);
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit application</DialogTitle>
        <DialogDescription>
          Update saved details. Status history is preserved.
        </DialogDescription>
      </DialogHeader>
      <ApplicationForm
        value={draft}
        onChange={setDraft}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
        submitLabel={<>Save changes</>}
      />
      <DialogFooter className="pt-1">
        <DialogClose asChild>
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

function ApplicationRow({
  app,
  loading,
  onCheck,
  onRemove,
  onEdit,
}: {
  app: FirearmApplication;
  loading: boolean;
  onCheck: () => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const calDays = calendarDaysSince(app.submittedAt);
  const workDays = saWorkingDaysSince(app.submittedAt);
  const overMandate = calDays > SAPS_MANDATE_DAYS;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{app.alias}</CardTitle>
            <CardDescription className="mt-0.5">
              Ref {app.fsref} · SN {app.fserial}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onCheck}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Check
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metric label="Submitted">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {formatDate(app.submittedAt)}
            </span>
          </Metric>
          <Metric label="Calendar days">
            <span
              className={cn(
                "tabular-nums",
                overMandate ? "font-bold text-destructive" : "text-foreground",
              )}
            >
              {calDays}
              {overMandate && (
                <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide">
                  over 120
                </span>
              )}
            </span>
          </Metric>
          <Metric label="Working days (SA)">
            <span className="tabular-nums text-foreground">{workDays}</span>
          </Metric>
        </div>

        {app.lastResult ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                {app.lastResult.status || "Unknown"}
              </Badge>
              {app.lastCheckedAt && (
                <span className="text-xs text-muted-foreground">
                  Checked {formatDate(app.lastCheckedAt)}
                </span>
              )}
            </div>
            <div className="grid gap-1 text-sm">
              <Row label="Status date" value={app.lastResult.statusDate} />
              <Row label="Description" value={app.lastResult.statusDescription} />
              <Row label="Next step" value={app.lastResult.nextStep} />
              <Row label="Make" value={app.lastResult.make} />
              <Row label="Calibre" value={app.lastResult.calibre} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No status fetched yet. Click <span className="font-medium">Check</span> to query SAPS.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value || "—"}</span>
    </div>
  );
}
