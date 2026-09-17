import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(appDir, "../.."),
  transpilePackages: [
    "@codetranslate/application",
    "@codetranslate/core",
    "@codetranslate/ingest",
    "@codetranslate/parser",
    "@codetranslate/graph",
    "@codetranslate/shared",
  ],
  serverExternalPackages: [
    "tree-sitter",
    "tree-sitter-javascript",
    "tree-sitter-typescript",
    "node-gyp-build",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals ?? [];
      config.externals.push(
        "tree-sitter",
        "tree-sitter-javascript",
        "tree-sitter-typescript",
        "node-gyp-build",
      );
    }
    return config;
  },
};

export default nextConfig;
