import type { Metadata, Viewport } from "next";
import "./globals.css";

// Next.js does not apply basePath to metadata URLs, so prefix them manually
// for subpath deploys like GitHub Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Mise",
  description: "Plan your meals, cook with ease.",
  applicationName: "Mise",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mise",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: `${basePath}/icons/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf8f3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
