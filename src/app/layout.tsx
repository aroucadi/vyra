import type { Metadata, Viewport } from "next";
import "./globals.css";
import { appStore } from "@/lib/store";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export const metadata: Metadata = {
  title: "NewME — AI-Assisted Strength Coaching",
  description: "Periodized workout and nutrition coaching platform for certified coaches and trainees.",
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
  const currentUser = appStore.getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-[#F8FAFC] min-h-screen flex flex-col antialiased">
        <RoleSwitcher currentUser={currentUser} />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
