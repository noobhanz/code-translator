export { analyzeDependencies } from "./analyze";
export type { AnalyzeDependenciesInput, AnalyzeDependenciesResult } from "./analyze";
export { DependencyGraph } from "./graph/dependency-graph";
export { buildDependencyGraph, edgeTypeForImportKind } from "./graph/builder";
export { computeFileImportance } from "./ranking/importance";
export { buildResolverIndex, resolveSpecifier } from "./resolution/resolver";
export type { ResolverIndex } from "./resolution/resolver";
export { EXTENSION_PRECEDENCE, probeInternalPath } from "./resolution/candidates";
export { canonicalBuiltinName, isNodeBuiltin } from "./resolution/builtins";
export { canonicalNpmPackageName, looksLikeBarePackage } from "./resolution/packages";
export { applyAlias, loadTsconfigSettings, settingsForFile } from "./resolution/tsconfig";
export { matchesWorkspacePattern, parsePnpmWorkspacePackages } from "./resolution/workspace";
export {
  isRelativeSpecifier,
  normalizePosixPath,
  posixDirname,
  posixJoin,
} from "./resolution/posix";
