import { useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { useLocalStorage } from "@/lib/storage";
import { FCA_SECTIONS, getFcaSection } from "@/lib/fca";
import { addYears, countdownTo, formatDate } from "@/lib/dates";
import { type Firearm } from "@/lib/saps";
import { cn } from "@/lib/utils";

export function FirearmsList() {
  const [firearms, setFirearms] = useLocalStorage<Firearm[]>("backlog_firearms", []);
  const [editing, setEditing] = useState<Firearm | null>(null);
  const [open, setOpen] = useState(false);

  const upsert = (f: Firearm) => {
    setFirearms((prev) => {
      const exists = prev.some((p) => p.id === f.id);
      return exists ? prev.map((p) => (p.id === f.id ? f : p)) : [f, ...prev];
    });
  };

  const remove = (id: string) => {
    setFirearms((prev) => prev.filter((p) => p.id !== id));
    toast.success("Firearm removed.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Digital safe</h2>
          <p className="text-sm text-muted-foreground">
            Track licensed firearms and monitor expiry countdowns by FCA section.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" />
              Add firearm
            </Button>
          </DialogTrigger>
          <FirearmDialog
            firearm={editing}
            onSubmit={(f) => {
              upsert(f);
              setOpen(false);
              setEditing(null);
              toast.success(editing ? "Firearm updated." : "Firearm added.");
            }}
          />
        </Dialog>
      </div>

      {firearms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No firearms saved yet. Click <span className="font-medium">Add firearm</span> to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {firearms.map((f) => (
            <FirearmCard
              key={f.id}
              firearm={f}
              onEdit={() => {
                setEditing(f);
                setOpen(true);
              }}
              onRemove={() => remove(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FirearmCard({
  firearm,
  onEdit,
  onRemove,
}: {
  firearm: Firearm;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const section = getFcaSection(firearm.fcaSection);
  const expiry = section ? addYears(firearm.issueDate, section.validityYears) : new Date();
  const cd = countdownTo(expiry);
  const warn = cd.totalDays >= 0 && cd.totalDays <= 180;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {firearm.alias}
            </CardTitle>
            <CardDescription>
              {firearm.serial ? `SN ${firearm.serial}` : "Serial not recorded"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">Section {firearm.fcaSection}</Badge>
          {section && (
            <Badge variant="outline">{section.validityYears}-year licence</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Issued
            </div>
            <div className="text-foreground">{formatDate(firearm.issueDate)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Expires
            </div>
            <div className="text-foreground">{formatDate(expiry)}</div>
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg border p-3",
            cd.expired
              ? "border-destructive/40 bg-destructive/10"
              : warn
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-border bg-muted/40",
          )}
        >
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {cd.expired ? "Expired" : "Time remaining"}
          </div>
          <div
            className={cn(
              "mt-1 font-semibold tabular-nums",
              cd.expired ? "text-destructive" : "text-foreground",
            )}
          >
            {cd.expired
              ? `${cd.years}y ${cd.months}m ${cd.days}d ago`
              : `${cd.years}y · ${cd.months}m · ${cd.days}d`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FirearmDialog({
  firearm,
  onSubmit,
}: {
  firearm: Firearm | null;
  onSubmit: (f: Firearm) => void;
}) {
  const [alias, setAlias] = useState(firearm?.alias ?? "");
  const [serial, setSerial] = useState(firearm?.serial ?? "");
  const [issueDate, setIssueDate] = useState<string>(firearm?.issueDate ?? "");
  const [section, setSection] = useState<string>(firearm?.fcaSection ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias || !issueDate || !section) {
      toast.error("Alias, issue date, and section are required.");
      return;
    }
    onSubmit({
      id: firearm?.id ?? crypto.randomUUID(),
      alias,
      serial: serial || undefined,
      issueDate,
      fcaSection: section,
      createdAt: firearm?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{firearm ? "Edit firearm" : "Add firearm"}</DialogTitle>
        <DialogDescription>
          Details are stored only in your browser.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="f-alias">
            Alias <span className="text-destructive">*</span>
          </Label>
          <Input
            id="f-alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="e.g. Glock 19 Gen 5"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-serial">Serial number</Label>
          <Input
            id="f-serial"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Issue date <span className="text-destructive">*</span>
          </Label>
          <DatePicker
            value={issueDate}
            onChange={setIssueDate}
            disabled={(d) => d > new Date()}
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            FCA section <span className="text-destructive">*</span>
          </Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger>
              <SelectValue placeholder="Choose section" />
            </SelectTrigger>
            <SelectContent>
              {FCA_SECTIONS.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.title} · {s.validityYears}y
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">{firearm ? "Save changes" : "Add firearm"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
