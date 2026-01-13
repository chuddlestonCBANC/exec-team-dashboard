import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hapax Executive Dashboard",
  description: "Real-time company performance dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[var(--gray-100)]">
        {children}
      </body>
    </html>
  );
}
