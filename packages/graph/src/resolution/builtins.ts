const NODE_BUILTINS = new Set([
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "sys",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
  "test",
]);

const NODE_BUILTIN_SUBPATHS = new Set([
  "fs/promises",
  "stream/promises",
  "stream/consumers",
  "stream/web",
  "timers/promises",
  "dns/promises",
  "readline/promises",
  "assert/strict",
  "path/posix",
  "path/win32",
  "util/types",
]);

/**
 * Canonical builtin names use the `node:` prefix, even when the source
 * specifier was the unprefixed form (`fs` → `node:fs`).
 */
export function canonicalBuiltinName(specifier: string): string | undefined {
  const stripped = specifier.startsWith("node:") ? specifier.slice(5) : specifier;
  const base = stripped.split("/")[0] ?? stripped;
  if (NODE_BUILTIN_SUBPATHS.has(stripped) || NODE_BUILTINS.has(base)) {
    return `node:${stripped}`;
  }
  return undefined;
}

export function isNodeBuiltin(specifier: string): boolean {
  return canonicalBuiltinName(specifier) !== undefined;
}
