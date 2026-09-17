import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./src/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(() => {
  if (process.env.HOSTED_MODE !== "true") {
    return NextResponse.next();
  }
  return;
});

export const config = {
  matcher: ["/apps/:path*", "/account"],
};
