import {
  createDiagnostic,
  DiagnosticCode,
  type Diagnostic,
  type FileNode,
  type ManifestSummary,
  type ModuleResolution,
  type PackageManifestSummary,
  type ResolutionEvidence,
} from "@codetranslate/core";
import { canonicalBuiltinName, isNodeBuiltin } from "./builtins";
import { probeInternalPath } from "./candidates";
import { resolutionId } from "./ids";
import { canonicalNpmPackageName, looksLikeBarePackage } from "./packages";
import {
  applyAlias,
  loadTsconfigSettings,
  settingsForFile,
  type TsconfigSettings,
} from "./tsconfig";
import { escapesRepository, isRelativeSpecifier, posixDirname, posixJoin } from "./posix";
import { loadWorkspacePackages, type WorkspacePackage } from "./workspace";

export interface ResolverIndex {
  repositoryId: string;
  filesByPath: Map<string, FileNode>;
  filesById: Map<string, FileNode>;
  tsconfigs: TsconfigSettings[];
  workspacePackages: Map<string, WorkspacePackage>;
  knownExternalPackages: Map<string, { versionRange?: string; manifestPath: string }>;
}

export interface ResolveRequest {
  importer: FileNode;
  specifier: string;
  sourceImportId?: string;
  sourceExportId?: string;
  location?: import("@codetranslate/core").SourceLocation;
}

export async function buildResolverIndex(input: {
  repositoryId: string;
  files: readonly FileNode[];
  manifests: readonly ManifestSummary[];
  readText: (path: string) => Promise<string>;
}): Promise<{ index: ResolverIndex; diagnostics: Diagnostic[] }> {
  const filesByPath = new Map<string, FileNode>();
  const filesById = new Map<string, FileNode>();
  for (const file of input.files) {
    if (file.ignored) {
      continue;
    }
    filesByPath.set(file.path, file);
    filesById.set(file.id, file);
  }

  const tsconfig = await loadTsconfigSettings(input.files, input.readText);
  const workspace = await loadWorkspacePackages(input.files, input.manifests, input.readText);
  const knownExternalPackages = new Map<string, { versionRange?: string; manifestPath: string }>();
  for (const manifest of input.manifests) {
    if (manifest.type !== "package.json") {
      continue;
    }
    addKnownPackages(knownExternalPackages, manifest);
  }

  return {
    index: {
      repositoryId: input.repositoryId,
      filesByPath,
      filesById,
      tsconfigs: tsconfig.settings,
      workspacePackages: workspace.packages,
      knownExternalPackages,
    },
    diagnostics: [...tsconfig.diagnostics, ...workspace.diagnostics],
  };
}

export function resolveSpecifier(
  index: ResolverIndex,
  request: {
    importer: FileNode;
    specifier: string;
    sourceImportId?: string;
    sourceExportId?: string;
    location?: import("@codetranslate/core").SourceLocation;
  },
): { resolution: ModuleResolution; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const id = resolutionId({
    repositoryId: index.repositoryId,
    importerFileId: request.importer.id,
    specifier: request.specifier,
    location: request.location,
  });

  const base = {
    id,
    importerFileId: request.importer.id,
    specifier: request.specifier,
    sourceImportId: request.sourceImportId,
    sourceExportId: request.sourceExportId,
  };

  if (isRelativeSpecifier(request.specifier)) {
    return finishRelative(index, request, base, diagnostics);
  }

  const settings = settingsForFile(request.importer.path, index.tsconfigs);
  const aliasTargets = settings ? applyAlias(request.specifier, settings.aliases) : undefined;
  if (aliasTargets && aliasTargets.length > 0) {
    return finishAlias(index, request, base, aliasTargets, settings?.path, diagnostics);
  }

  if (isNodeBuiltin(request.specifier)) {
    const packageName = canonicalBuiltinName(request.specifier) ?? `node:${request.specifier}`;
    return {
      resolution: complete(base, {
        kind: "builtin",
        packageName,
        resolutionStrategy: "builtin",
        confidence: 1,
        evidence: [{ type: "node-builtin", value: packageName }],
      }),
      diagnostics,
    };
  }

  const workspace = matchWorkspacePackage(index, request.specifier);
  if (workspace) {
    return finishWorkspace(index, request, base, workspace, diagnostics);
  }

  const packageName = looksLikeBarePackage(request.specifier)
    ? canonicalNpmPackageName(request.specifier)
    : undefined;
  const known = packageName ? index.knownExternalPackages.get(packageName) : undefined;

  if (settings?.baseUrl !== undefined && packageName && !known) {
    const baseUrlHit = probeInternalPath(
      posixJoin(settings.baseUrl, request.specifier),
      index.filesByPath,
    );
    if (baseUrlHit.hit) {
      return {
        resolution: complete(base, {
          kind: "internal",
          targetFileId: baseUrlHit.hit.file.id,
          resolutionStrategy: "baseUrl",
          confidence: 0.8,
          candidates: baseUrlHit.candidates,
          evidence: [
            { type: "tsconfig-path", value: `baseUrl:${settings.baseUrl}` },
            { type: baseUrlHit.hit.evidenceType, value: baseUrlHit.hit.path },
          ],
        }),
        diagnostics,
      };
    }
  }

  if (packageName) {
    const evidence: ResolutionEvidence[] = [{ type: "package-manifest", value: packageName }];
    if (known) {
      evidence[0] = { type: "package-manifest", value: known.manifestPath };
    }
    return {
      resolution: complete(base, {
        kind: "external",
        packageName,
        resolutionStrategy: "package",
        confidence: known ? 1 : 0.7,
        evidence,
      }),
      diagnostics,
    };
  }

  diagnostics.push(
    createDiagnostic(
      "warning",
      DiagnosticCode.IMPORT_UNRESOLVED,
      `Could not resolve module specifier "${request.specifier}".`,
      request.importer.path,
    ),
  );
  return {
    resolution: complete(base, {
      kind: "unresolved",
      resolutionStrategy: "unresolved",
      confidence: 0,
      evidence: [],
    }),
    diagnostics,
  };
}

function finishRelative(
  index: ResolverIndex,
  request: { importer: FileNode; specifier: string },
  base: Pick<
    ModuleResolution,
    "id" | "importerFileId" | "specifier" | "sourceImportId" | "sourceExportId"
  >,
  diagnostics: Diagnostic[],
): { resolution: ModuleResolution; diagnostics: Diagnostic[] } {
  const fromDir = posixDirname(request.importer.path);
  const combined = posixJoin(fromDir, request.specifier);
  if (escapesRepository(combined)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.IMPORT_UNRESOLVED,
        `Relative specifier "${request.specifier}" points outside the repository.`,
        request.importer.path,
      ),
    );
    return {
      resolution: complete(base, {
        kind: "unresolved",
        resolutionStrategy: "relative",
        confidence: 0,
        candidates: [combined],
        evidence: [],
      }),
      diagnostics,
    };
  }

  const probed = probeInternalPath(combined, index.filesByPath);
  if (!probed.hit) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.IMPORT_UNRESOLVED,
        `Could not resolve relative specifier "${request.specifier}".`,
        request.importer.path,
      ),
    );
    return {
      resolution: complete(base, {
        kind: "unresolved",
        resolutionStrategy: "relative",
        confidence: 0,
        candidates: probed.candidates,
        evidence: [],
      }),
      diagnostics,
    };
  }

  return {
    resolution: complete(base, {
      kind: "internal",
      targetFileId: probed.hit.file.id,
      resolutionStrategy: "relative",
      confidence: 1,
      candidates: probed.candidates,
      evidence: [{ type: probed.hit.evidenceType, value: probed.hit.path }],
    }),
    diagnostics,
  };
}

function finishAlias(
  index: ResolverIndex,
  request: { importer: FileNode; specifier: string },
  base: Pick<
    ModuleResolution,
    "id" | "importerFileId" | "specifier" | "sourceImportId" | "sourceExportId"
  >,
  targets: string[],
  tsconfigPath: string | undefined,
  diagnostics: Diagnostic[],
): { resolution: ModuleResolution; diagnostics: Diagnostic[] } {
  const allCandidates: string[] = [];
  for (const target of targets) {
    const probed = probeInternalPath(target, index.filesByPath);
    allCandidates.push(...probed.candidates);
    if (probed.hit) {
      return {
        resolution: complete(base, {
          kind: "internal",
          targetFileId: probed.hit.file.id,
          resolutionStrategy: "alias",
          confidence: 1,
          candidates: allCandidates,
          evidence: [
            { type: "tsconfig-path", value: tsconfigPath },
            { type: probed.hit.evidenceType, value: probed.hit.path },
          ],
        }),
        diagnostics,
      };
    }
  }

  diagnostics.push(
    createDiagnostic(
      "warning",
      DiagnosticCode.IMPORT_UNRESOLVED,
      `Alias specifier "${request.specifier}" did not match a repository file.`,
      request.importer.path,
    ),
  );
  return {
    resolution: complete(base, {
      kind: "unresolved",
      resolutionStrategy: "alias",
      confidence: 0,
      candidates: allCandidates,
      evidence: tsconfigPath ? [{ type: "tsconfig-path", value: tsconfigPath }] : [],
    }),
    diagnostics,
  };
}

function finishWorkspace(
  index: ResolverIndex,
  request: { specifier: string },
  base: Pick<
    ModuleResolution,
    "id" | "importerFileId" | "specifier" | "sourceImportId" | "sourceExportId"
  >,
  workspace: { pkg: WorkspacePackage; subpath: string },
  diagnostics: Diagnostic[],
): { resolution: ModuleResolution; diagnostics: Diagnostic[] } {
  const bases = workspace.subpath
    ? [
        posixJoin(workspace.pkg.dir, workspace.subpath),
        posixJoin(workspace.pkg.dir, "src", workspace.subpath),
      ]
    : [
        posixJoin(workspace.pkg.dir, "index"),
        posixJoin(workspace.pkg.dir, "src/index"),
        workspace.pkg.dir,
      ];
  const allCandidates: string[] = [];
  for (const candidateBase of bases) {
    const probed = probeInternalPath(candidateBase, index.filesByPath);
    allCandidates.push(...probed.candidates);
    if (probed.hit) {
      return {
        resolution: complete(base, {
          kind: "internal",
          targetFileId: probed.hit.file.id,
          packageName: workspace.pkg.name,
          resolutionStrategy: "workspace",
          confidence: 0.9,
          candidates: allCandidates,
          evidence: [
            { type: "workspace-package", value: workspace.pkg.manifestPath },
            { type: probed.hit.evidenceType, value: probed.hit.path },
          ],
        }),
        diagnostics,
      };
    }
  }

  return {
    resolution: complete(base, {
      kind: "internal",
      packageName: workspace.pkg.name,
      resolutionStrategy: "workspace",
      confidence: 0.4,
      candidates: allCandidates,
      evidence: [{ type: "workspace-package", value: workspace.pkg.manifestPath }],
    }),
    diagnostics,
  };
}

function matchWorkspacePackage(
  index: ResolverIndex,
  specifier: string,
): { pkg: WorkspacePackage; subpath: string } | undefined {
  const packageName = canonicalNpmPackageName(specifier);
  const pkg = index.workspacePackages.get(packageName);
  if (!pkg) {
    return undefined;
  }
  const subpath =
    specifier === packageName ? "" : specifier.slice(packageName.length).replace(/^\//, "");
  return { pkg, subpath };
}

function addKnownPackages(
  known: Map<string, { versionRange?: string; manifestPath: string }>,
  manifest: PackageManifestSummary,
): void {
  const names = [
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  ];
  for (const name of names) {
    if (!known.has(name)) {
      known.set(name, { manifestPath: manifest.path });
    }
  }
}

function complete(
  base: Pick<
    ModuleResolution,
    "id" | "importerFileId" | "specifier" | "sourceImportId" | "sourceExportId"
  >,
  rest: Omit<
    ModuleResolution,
    "id" | "importerFileId" | "specifier" | "sourceImportId" | "sourceExportId"
  >,
): ModuleResolution {
  const resolution: ModuleResolution = {
    id: base.id,
    importerFileId: base.importerFileId,
    specifier: base.specifier,
    kind: rest.kind,
    resolutionStrategy: rest.resolutionStrategy,
    confidence: rest.confidence,
    evidence: rest.evidence,
  };
  if (base.sourceImportId) {
    resolution.sourceImportId = base.sourceImportId;
  }
  if (base.sourceExportId) {
    resolution.sourceExportId = base.sourceExportId;
  }
  if (rest.targetFileId) {
    resolution.targetFileId = rest.targetFileId;
  }
  if (rest.packageName) {
    resolution.packageName = rest.packageName;
  }
  if (rest.candidates) {
    resolution.candidates = rest.candidates;
  }
  return resolution;
}
