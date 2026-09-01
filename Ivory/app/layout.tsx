import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shajar Hospital Project",
  description: "Projectapp voor het Shajar-ziekenhuisproject",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
