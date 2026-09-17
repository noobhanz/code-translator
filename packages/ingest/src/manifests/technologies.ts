import type {
  BasicTechnologyDetection,
  ManifestSummary,
  TechnologyCategory,
  TechnologyEvidence,
} from "@codetranslate/core";

interface TechnologyMapping {
  name: string;
  category: TechnologyCategory;
}

const PACKAGE_TECHNOLOGY: Record<string, TechnologyMapping> = {
  next: { name: "Next.js", category: "framework" },
  react: { name: "React", category: "library" },
  vite: { name: "Vite", category: "framework" },
  express: { name: "Express", category: "framework" },
  "@prisma/client": { name: "Prisma", category: "database" },
  prisma: { name: "Prisma", category: "database" },
  stripe: { name: "Stripe", category: "payment" },
  openai: { name: "OpenAI", category: "ai" },
  "@anthropic-ai/sdk": { name: "Anthropic", category: "ai" },
  "@supabase/supabase-js": { name: "Supabase", category: "database" },
  firebase: { name: "Firebase", category: "other" },
  tailwindcss: { name: "Tailwind CSS", category: "styling" },
  vitest: { name: "Vitest", category: "testing" },
  jest: { name: "Jest", category: "testing" },
};

export function detectInstalledTechnologies(
  manifests: readonly ManifestSummary[],
): BasicTechnologyDetection[] {
  const grouped = new Map<
    string,
    {
      mapping: TechnologyMapping;
      evidence: TechnologyEvidence[];
    }
  >();

  for (const manifest of manifests) {
    if (manifest.type !== "package.json") {
      continue;
    }

    const packages = new Set([
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
    ]);

    for (const packageName of packages) {
      const mapping = PACKAGE_TECHNOLOGY[packageName];
      if (!mapping) {
        continue;
      }
      const existing = grouped.get(mapping.name);
      const evidence: TechnologyEvidence = {
        type: "package",
        packageName,
        manifestPath: manifest.path,
      };
      if (existing) {
        existing.evidence.push(evidence);
      } else {
        grouped.set(mapping.name, { mapping, evidence: [evidence] });
      }
    }
  }

  return [...grouped.values()]
    .map(({ mapping, evidence }) => ({
      name: mapping.name,
      category: mapping.category,
      status: "installed" as const,
      confidence: 1,
      evidence: uniqueEvidence(evidence),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function uniqueEvidence(evidence: TechnologyEvidence[]): TechnologyEvidence[] {
  const seen = new Set<string>();
  const unique: TechnologyEvidence[] = [];
  for (const item of evidence) {
    const key = `${item.packageName}|${item.manifestPath}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }
  return unique;
}
