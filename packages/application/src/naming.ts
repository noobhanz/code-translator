export function humanizeToken(value: string): string {
  const cleaned = value
    .replace(/\[\[\.\.\.(.+?)]]/g, "$1")
    .replace(/\[\.\.\.(.+?)]/g, "$1")
    .replace(/\[(.+?)]/g, "$1")
    .replace(/[-_./]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return value;
  }
  const words = cleaned.split(" ").map((word) => word.toLowerCase());
  const first = words[0];
  if (!first) {
    return cleaned;
  }
  return [capitalize(first), ...words.slice(1)].join(" ");
}

export function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function pageLabelFromRoute(route: string): string {
  if (route === "/") {
    return "Home";
  }
  const segments = route
    .split("/")
    .filter((segment) => segment && segment !== "*" && !segment.startsWith(":"));
  const last = segments[segments.length - 1] ?? route.replace(/^\//, "");
  const mapped: Record<string, string> = {
    login: "Login",
    signin: "Login",
    "sign-in": "Login",
    signup: "Sign up",
    "sign-up": "Sign up",
    dashboard: "Dashboard",
    upload: "Upload",
    settings: "Settings",
    profile: "Profile",
    admin: "Admin",
    compare: "Compare",
    checkout: "Checkout",
  };
  const key = last.toLowerCase();
  if (mapped[key] && segments.length === 1) {
    return mapped[key];
  }
  if (route.includes("/:") || route.includes("*")) {
    const base = segments[segments.length - 1] ?? last;
    const label = mapped[base.toLowerCase()] ?? humanizeToken(base);
    if (!label.toLowerCase().endsWith("s") && !label.toLowerCase().includes("detail")) {
      return `${label.replace(/s$/, "")} details`.replace(/^./, (char) => char.toUpperCase());
    }
    return humanizeToken(`${base} details`);
  }
  if (mapped[key] && segments.length > 1) {
    return `${humanizeToken(segments.slice(0, -1).join(" "))} ${mapped[key].toLowerCase()}`.replace(
      /^./,
      (char) => char.toUpperCase(),
    );
  }
  return humanizeToken(segments.join(" ") || last);
}

export function stripSrcPrefix(path: string): string {
  return path.startsWith("src/") ? path.slice(4) : path;
}
