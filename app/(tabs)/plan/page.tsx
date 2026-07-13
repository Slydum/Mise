import type { Metadata } from "next";
import { PlanScreen } from "@/components/plan/plan-screen";

export const metadata: Metadata = {
  title: "Plan — Mise",
};

export default function PlanPage() {
  return <PlanScreen />;
}
