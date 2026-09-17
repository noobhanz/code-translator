import type { ReactNode } from "react";
import { isHostedMode } from "@codetranslate/hosted";
import { SiteHeader } from "../src/components/site-header";
import "./globals.css";

export const metadata = {
  title: "Code Translator",
  description: "Understand the app you built.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {isHostedMode() ? <SiteHeader /> : null}
        <main>{children}</main>
      </body>
    </html>
  );
}
