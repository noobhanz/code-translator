import { isHostedMode } from "@codetranslate/hosted";

export function hostedEnabled(): boolean {
  return isHostedMode();
}
