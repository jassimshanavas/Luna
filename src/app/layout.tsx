import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Luna — Your Cycle Companion",
  description: "A beautiful, intelligent period tracker with AI-powered insights, cycle predictions, wellness tracking, and personalized health guidance for every phase of your cycle.",
  keywords: "period tracker, menstrual cycle, fertility, ovulation, women health, cycle tracking",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Luna",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Luna — Your Cycle Companion",
    description: "Track your cycle with intelligence and elegance",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#f472b6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&family=Dancing+Script:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <AppProvider>
            <AppShell>
              {children}
            </AppShell>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
