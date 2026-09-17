import { auth } from "./lib/auth";

export function middleware() {
  return auth();
}
