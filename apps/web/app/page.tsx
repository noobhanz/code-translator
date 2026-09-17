import { isHostedMode } from "@codetranslate/hosted";
import { HostedLanding } from "../src/components/landing";
import { OverviewApp } from "./ui";

export default function Page() {
  if (isHostedMode()) {
    return <HostedLanding />;
  }
  return <OverviewApp />;
}
