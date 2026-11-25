import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "ParkBnB | Peer-to-Peer Parking Marketplace (India)",
  description: "Reserve verified parking spots before you arrive across Mumbai, Delhi NCR, Bengaluru, Pune, Hyderabad, Chennai, Ahmedabad, and major Indian cities. Covered, secure and EV-ready spaces on hourly, daily and monthly terms.",
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary-soft selection:text-primary">
        {children}
      </body>
    </html>
  );
}
