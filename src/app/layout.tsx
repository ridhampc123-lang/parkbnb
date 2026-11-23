import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/ui/navbar";
import { AppLayoutWrapper } from "@/components/layout/app-layout-wrapper";

export const metadata: Metadata = {
  title: "ParkBnB | Peer-to-Peer Parking Marketplace (Ahmedabad)",
  description: "Reserve verified parking spots before you arrive in Ahmedabad, Gujarat. Covered, secure and commercial spaces on hourly, daily and monthly terms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary-soft selection:text-primary">
        <AppLayoutWrapper navbar={<Navbar />}>
          {children}
        </AppLayoutWrapper>
      </body>
    </html>
  );
}
