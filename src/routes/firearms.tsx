import { FirearmsList } from "@/components/firearms-list";

export default function FirearmsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Manage firearms</h1>
        <p className="text-sm text-muted-foreground">
          Your digital safe of approved firearms with automatic FCA expiry countdowns.
        </p>
      </header>
      <FirearmsList />
    </div>
  );
}
