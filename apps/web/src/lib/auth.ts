import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma, isHostedMode } from "@codetranslate/hosted";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: isHostedMode() && process.env.DATABASE_URL ? PrismaAdapter(getPrisma()) : undefined,
  events: {
    async signIn({ user, profile, account }) {
      if (!isHostedMode() || !process.env.DATABASE_URL || !user.id) {
        return;
      }
      const githubProfile = profile as
        | { id?: number | string; login?: string; avatar_url?: string; name?: string }
        | undefined;
      const prisma = getPrisma();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          githubUserId: githubProfile?.id ? String(githubProfile.id) : undefined,
          githubLogin: githubProfile?.login,
          name: githubProfile?.name ?? user.name,
          avatarUrl: githubProfile?.avatar_url ?? user.image,
          image: githubProfile?.avatar_url ?? user.image,
        },
      });
      if (account?.access_token) {
        const existing = await prisma.account.findFirst({
          where: { userId: user.id, provider: "github" },
        });
        if (existing) {
          await prisma.account.update({
            where: { id: existing.id },
            data: { access_token: account.access_token },
          });
        }
      }
    },
  },
});
