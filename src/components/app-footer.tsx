import { Link } from "@tanstack/react-router";
import { FileText, Github, ShieldCheck } from "lucide-react";
import guidelinesAsset from "@/assets/firearm-guidelines.pdf.asset.json";

const GITHUB_URL = "https://github.com/JonathanReeceJoubert/backlog";

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Data Privacy:</span> All data is
              stored locally on your device, giving you full control. No personal information is
              collected or shared with us or third parties, except for direct connections you
              initiate to the official SAPS website when checking application status. For full
              details, please read our{" "}
              <Link to="/privacy" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              <span className="font-semibold text-foreground">Legal Notice:</span> This app is
              not affiliated with SAPS. Status information is fetched from the official SAPS
              website.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs md:items-end">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Github className="h-3.5 w-3.5" />
              Free &amp; open source on GitHub
            </a>
            <a
              href={guidelinesAsset.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent"
            >
              <FileText className="h-3.5 w-3.5" />
              SAPS 120-day processing guidelines (PDF)
            </a>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Backlog collects zero data. Ever.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} Backlog — Personal firearm tracker.</span>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
