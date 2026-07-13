import type { Metadata } from "next";
import { TodayScreen } from "@/components/today/today-screen";

export const metadata: Metadata = {
  title: "Today — Mise",
};

export default function TodayPage() {
  return <TodayScreen />;
}
