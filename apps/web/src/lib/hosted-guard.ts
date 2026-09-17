import { redirect } from "next/navigation";
import { isHostedMode } from "@codetranslate/hosted";

export function requireHostedMode(): void {
  if (!isHostedMode()) {
    redirect("/");
  }
}
