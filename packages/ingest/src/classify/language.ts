import { fileName, getExtension } from "@codetranslate/shared";

const EXTENSION_LANGUAGE: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TSX",
  ".mts": "TypeScript",
  ".cts": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JSX",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "Sass",
  ".less": "Less",
  ".html": "HTML",
  ".htm": "HTML",
  ".json": "JSON",
  ".jsonc": "JSON",
  ".md": "Markdown",
  ".mdx": "MDX",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".rb": "Ruby",
  ".php": "PHP",
  ".sql": "SQL",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".sh": "Shell",
  ".bash": "Shell",
  ".zsh": "Shell",
};

const FILENAME_LANGUAGE: Record<string, string> = {
  makefile: "Make",
  gnumakefile: "Make",
  dockerfile: "Dockerfile",
  gemfile: "Ruby",
};

export function inferLanguage(relativePath: string): string | undefined {
  const base = fileName(relativePath).toLowerCase();
  const byName = FILENAME_LANGUAGE[base];
  if (byName) {
    return byName;
  }

  const extension = getExtension(relativePath);
  if (extension === "") {
    return undefined;
  }
  return EXTENSION_LANGUAGE[extension];
}

export function isSourceLanguageExtension(relativePath: string): boolean {
  return inferLanguage(relativePath) !== undefined;
}
