import { DEMO_APP_NAME, getDemoOverview } from "@codetranslate/hosted";
import { ApplicationOverview } from "../../src/components/overview";

export default async function ExamplePage() {
  const demo = await getDemoOverview();
  return (
    <>
      <p className="muted">Example</p>
      <ApplicationOverview model={demo.application} files={demo.files} title={DEMO_APP_NAME} />
    </>
  );
}
