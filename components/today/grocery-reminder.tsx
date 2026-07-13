import Link from "next/link";
import { ChevronRight, ShoppingBasket } from "lucide-react";

interface GroceryReminderProps {
  remaining: number;
}

/** Compact nudge toward the grocery list, shown only when there's something left to grab. */
export function GroceryReminder({ remaining }: GroceryReminderProps) {
  if (remaining <= 0) return null;

  return (
    <section className="px-5">
      <Link
        href="/grocery"
        className="flex items-center gap-3.5 rounded-3xl bg-accent px-5 py-4 outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary">
          <ShoppingBasket className="size-5" aria-hidden />
        </span>
        <p className="flex-1 text-sm font-medium text-accent-foreground">
          {remaining} {remaining === 1 ? "item" : "items"} left to grab this week
        </p>
        <ChevronRight className="size-4 shrink-0 text-accent-foreground/60" aria-hidden />
      </Link>
    </section>
  );
}
