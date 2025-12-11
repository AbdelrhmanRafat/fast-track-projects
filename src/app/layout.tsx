import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalModal } from "@/components/providers/GlobalModal";
import LoadingOverlay from "@/components/providers/LoadingOverlay";
import { ErrorSuppressor } from "@/components/providers/ErrorSuppressor";
import { ThemeProvider } from "next-themes";
import { DialogManagerProvider } from "@/components/ui/dialog-manager";
import { PWAProvider } from "@/components/providers/PWAProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fast Track Purchasing",
  description: "Fast Track Purchasing - نظام إدارة طلبات الشراء",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/app-Icon.jpg", type: "image/jpeg" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/app-Icon.jpg",
    apple: [
      { url: "/app-Icon.jpg" },
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FT Purchase",
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: "Fast Track Purchasing",
  keywords: ["purchasing", "procurement", "orders", "management", "شراء", "طلبات"],
  authors: [{ name: "Fast Track Team" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* PWA Apple Touch Icons - Required for iOS home screen icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        {/* PWA meta tags for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FT Purchase" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased font-sans bg-background">
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PWAProvider showInstallPrompt={true}>
              <DialogManagerProvider>
                <ErrorSuppressor />
                {children}
                <GlobalModal />
                <LoadingOverlay />
              </DialogManagerProvider>
            </PWAProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
