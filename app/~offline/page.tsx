import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — Mise",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center pt-safe pb-safe">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <WifiOff className="size-7" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline</h1>
      <p className="max-w-xs text-muted-foreground">
        This page isn&apos;t cached yet. Your meal plan, saved recipes, and
        grocery list are still available from the tabs below once you reopen
        the app.
      </p>
    </main>
  );
}
