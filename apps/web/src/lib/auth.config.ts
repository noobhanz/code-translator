import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

const githubId = process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID;
const githubSecret = process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET;

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: githubId
    ? [
        GitHub({
          clientId: githubId,
          clientSecret: githubSecret,
          authorization: { params: { scope: "read:user" } },
        }),
      ]
    : [],
  callbacks: {
    authorized({ auth, request }) {
      if (process.env.HOSTED_MODE !== "true") {
        return true;
      }
      const path = request.nextUrl.pathname;
      const protectedPath = path.startsWith("/apps") || path.startsWith("/account");
      if (!protectedPath) {
        return true;
      }
      return Boolean(auth?.user);
    },
    async jwt({ token, profile }) {
      const githubProfile = profile as { id?: number | string; login?: string; avatar_url?: string } | undefined;
      const nextToken = token as typeof token & {
        githubUserId?: string;
        githubLogin?: string;
        avatarUrl?: string;
      };
      if (githubProfile?.id) {
        nextToken.githubUserId = String(githubProfile.id);
      }
      if (githubProfile?.login) {
        nextToken.githubLogin = githubProfile.login;
      }
      if (githubProfile?.avatar_url) {
        nextToken.avatarUrl = githubProfile.avatar_url;
      }
      return nextToken;
    },
    async session({ session, token }) {
      const user = session.user as unknown as Record<string, unknown>;
      user.id = String(token.sub ?? "");
      user.githubLogin = String(token.githubLogin ?? "");
      user.githubUserId = String(token.githubUserId ?? "");
      if (token.avatarUrl) {
        user.avatarUrl = String(token.avatarUrl);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
