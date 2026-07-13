import type { Metadata } from "next";
import { GroceryScreen } from "@/components/grocery/grocery-screen";

export const metadata: Metadata = {
  title: "Grocery — Mise",
};

export default function GroceryPage() {
  return <GroceryScreen />;
}
