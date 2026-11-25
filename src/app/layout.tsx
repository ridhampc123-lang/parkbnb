import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { ServiceWorkerAndInstallPrompt } from "@/components/pwa/sw-register";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#176B5B",
};

export const metadata: Metadata = {
  title: "ParkBnB | Peer-to-Peer Parking Marketplace (India)",
  description: "Reserve verified parking spots before you arrive across Mumbai, Delhi NCR, Bengaluru, Pune, Hyderabad, Chennai, Ahmedabad, and major Indian cities. Covered, secure and EV-ready spaces on hourly, daily and monthly terms.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ParkBnB",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/icon-192.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary-soft selection:text-primary">
        <ServiceWorkerAndInstallPrompt />
        {children}
      </body>
    </html>
  );
}
