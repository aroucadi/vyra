import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VYRA",
  description: "Postural hypertrophy and athletic progression protocol.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VYRA",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B0F17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-[#F8FAFC] min-h-screen flex flex-col antialiased selection:bg-emerald-500/20">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
