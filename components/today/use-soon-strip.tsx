import type { UseSoonItem } from "@/lib/types";

interface UseSoonStripProps {
  items: UseSoonItem[];
}

/** Gentle nudge for ingredients already on hand that are close to their use-by point. */
export function UseSoonStrip({ items }: UseSoonStripProps) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Use soon" className="px-5">
      <h2 className="mb-3 font-serif text-2xl">Use Soon</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-border/60 bg-card py-2.5 pl-3 pr-4 shadow-soft"
          >
            <span aria-hidden className="text-xl">
              {item.emoji}
            </span>
            <span>
              <span className="block text-sm font-medium leading-tight">{item.name}</span>
              <span className="block text-xs text-highlight">
                {item.daysLeft === 1 ? "Use today" : `${item.daysLeft} days left`}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
