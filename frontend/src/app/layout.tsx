import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "GAdmin Toolkit - Email Campaign Management",
  description: "Professional dashboard for managing email campaigns and G Suite users",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
