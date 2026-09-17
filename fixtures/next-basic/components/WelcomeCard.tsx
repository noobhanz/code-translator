import { greeting } from "../lib/example";

export function WelcomeCard() {
  return (
    <section>
      <p>{greeting("translator")}</p>
    </section>
  );
}
