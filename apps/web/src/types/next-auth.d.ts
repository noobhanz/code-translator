import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    githubLogin?: string;
    githubUserId?: string;
    avatarUrl?: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      githubLogin: string;
      githubUserId: string;
      avatarUrl?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubLogin?: string;
    githubUserId?: string;
    avatarUrl?: string;
  }
}
