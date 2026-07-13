import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/profile-screen";

export const metadata: Metadata = {
  title: "Profile — Mise",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
