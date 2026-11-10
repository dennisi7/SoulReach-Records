import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROSA UHAS Evangelism Records",
  description: "A private record of every evangelism encounter for Royal House Chapel.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
