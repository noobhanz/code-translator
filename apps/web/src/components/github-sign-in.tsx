import { signIn } from "../lib/auth";

export function GitHubSignInButton({ label = "Continue with GitHub" }: { label?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/apps" });
      }}
    >
      <button type="submit">{label}</button>
    </form>
  );
}
