import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, ExternalLink, Loader2 } from "lucide-react";
import { checkSapsHealth, SAPS_PORTAL_URL } from "@/lib/saps";
import { Badge } from "@/components/ui/badge";

export function SapsStatusBadge() {
  const [status, setStatus] = useState<"loading" | "up" | "down">("loading");

  useEffect(() => {
    let cancelled = false;
    const run = () =>
      checkSapsHealth().then((isUp) => {
        if (!cancelled) setStatus(isUp ? "up" : "down");
      });
    run();
    const id = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <a
      href={SAPS_PORTAL_URL}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-accent"
    >
      {status === "loading" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Checking SAPS portal…</span>
        </>
      )}
      {status === "up" && (
        <>
          <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>SAPS portal online</span>
          <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
            live
          </Badge>
        </>
      )}
      {status === "down" && (
        <>
          <CircleAlert className="h-3.5 w-3.5 text-destructive" />
          <span>SAPS portal unreachable</span>
        </>
      )}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}
