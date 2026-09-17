import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Code Translator",
  description: "Understand the software you built.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
