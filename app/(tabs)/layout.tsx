import { BottomNav } from "@/components/bottom-nav";

export default function TabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md pt-safe">
      <main className="pb-nav">{children}</main>
      <BottomNav />
    </div>
  );
}
