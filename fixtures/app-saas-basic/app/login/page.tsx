import { signIn } from "../../lib/auth";

export default function LoginPage() {
  return (
    <main>
      <button type="button" onClick={() => signIn()}>
        Sign in
      </button>
    </main>
  );
}
