import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinSyndeo",
  description: "FinSyndeo by SOPHIMA — provider matching and introductions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
