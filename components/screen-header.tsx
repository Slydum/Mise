import { cn } from "@/lib/utils";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Large-typography page header shared by all tab screens. */
export function ScreenHeader({ title, subtitle, className, children }: ScreenHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div className="min-w-0">
        {subtitle ? (
          <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
        ) : null}
        <h1 className="font-serif text-4xl font-medium tracking-tight">{title}</h1>
      </div>
      {children}
    </header>
  );
}
