import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockShorts Generator",
  description: "Create YouTube Shorts using stock videos, AI script parsing, and automated editing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
