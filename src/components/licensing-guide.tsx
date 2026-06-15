import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FCA_SECTIONS } from "@/lib/fca";

export function LicensingGuide({ triggerLabel = "Licensing Sections Guide" }: { triggerLabel?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Licensing Sections Guide</DialogTitle>
          <DialogDescription>
            South African Firearms Control Act — section overview and validity periods.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {FCA_SECTIONS.map((s) => (
              <div
                key={s.code}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-card-foreground">{s.title}</h4>
                  <Badge variant="secondary">
                    Valid {s.validityYears} year{s.validityYears > 1 ? "s" : ""}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <p className="pt-2 text-xs text-muted-foreground">
          Informational summary only. Always confirm with SAPS or a qualified attorney.
        </p>
      </DialogContent>
    </Dialog>
  );
}
