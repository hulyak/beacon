import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LayoutWrapper } from "./layout-wrapper";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Beacon - Voice-Powered Supply Chain Intelligence",
  description: "A voice-first supply chain intelligence platform built with ElevenLabs and Google Cloud AI. Analyze risks, run scenarios, and get real-time alerts through natural speech.",
  keywords: ["supply chain", "voice AI", "ElevenLabs", "Google Cloud", "Gemini", "risk analysis", "scenario simulation"],
  authors: [{ name: "Beacon Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
