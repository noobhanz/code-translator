import {
  createDiagnostic,
  DiagnosticCode,
  type Diagnostic,
  type ExportDeclaration,
  type FileAnalysis,
  type ImportDeclaration,
  type ImportSpecifier,
  type SourceLocation,
  type SymbolKind,
  type SymbolNode,
} from "@codetranslate/core";
import { DEFAULT_EXPORT_DISPLAY_NAME } from "@codetranslate/shared";
import type { AnalyzeContext, SupportedParserLanguage } from "../types";
import { parseSource, type SyntaxNode, type Tree } from "../tree-sitter/parse";
import { exportId, importId, symbolId } from "./ids";
import { collapseWhitespace, compareLocations, extractJsdoc, locationFromNode } from "./location";

const JSX_TYPES = new Set(["jsx_element", "jsx_self_closing_element", "jsx_fragment"]);
const CALLABLE_TYPES = new Set([
  "arrow_function",
  "function",
  "function_expression",
  "generator_function",
  "generator_function_declaration",
]);
const FUNCTION_DECL_TYPES = new Set(["function_declaration", "generator_function_declaration"]);
const CLASS_DECL_TYPES = new Set(["class_declaration", "abstract_class_declaration"]);

interface ExtractionState {
  context: AnalyzeContext;
  source: string;
  filePath: string;
  language: SupportedParserLanguage;
  parserId: string;
  symbols: SymbolNode[];
  imports: ImportDeclaration[];
  exports: ExportDeclaration[];
  diagnostics: Diagnostic[];
  localExportNames: Set<string>;
  defaultExportLocals: Set<string>;
}

export function extractEcmascriptFile(input: {
  language: SupportedParserLanguage;
  parserId: string;
  source: string;
  filePath: string;
  context: AnalyzeContext;
}): FileAnalysis {
  const state: ExtractionState = {
    context: input.context,
    source: input.source,
    filePath: input.filePath,
    language: input.language,
    parserId: input.parserId,
    symbols: [],
    imports: [],
    exports: [],
    diagnostics: [],
    localExportNames: new Set(),
    defaultExportLocals: new Set(),
  };

  let tree: Tree;
  try {
    tree = parseSource(input.language, input.source);
  } catch (error) {
    state.diagnostics.push(
      createDiagnostic(
        "error",
        DiagnosticCode.SOURCE_PARSE_FAILED,
        `Parser threw: ${error instanceof Error ? error.message : String(error)}`,
        input.filePath,
      ),
    );
    return finalize(state, false, false);
  }

  const hasSyntaxErrors = tree.rootNode.hasError;
  if (hasSyntaxErrors) {
    addSyntaxDiagnostics(state, tree.rootNode);
  }

  walkProgram(state, tree.rootNode);
  applyIntraFileExportFlags(state);
  sortExtracted(state);
  return finalize(state, true, hasSyntaxErrors);
}

function finalize(
  state: ExtractionState,
  successful: boolean,
  hasSyntaxErrors: boolean,
): FileAnalysis {
  return {
    parser: {
      language: state.language,
      parserId: state.parserId,
    },
    symbols: state.symbols,
    imports: state.imports,
    exports: state.exports,
    diagnostics: state.diagnostics,
    parse: { successful, hasSyntaxErrors },
  };
}

function walkProgram(state: ExtractionState, root: SyntaxNode): void {
  const body = root.type === "program" ? root.namedChildren : [root];
  for (const child of body) {
    visitStatement(state, child, { exported: false, defaultExport: false });
  }
  collectDynamicImports(state, root);
}

function visitStatement(
  state: ExtractionState,
  node: SyntaxNode,
  flags: { exported: boolean; defaultExport: boolean },
): void {
  switch (node.type) {
    case "import_statement":
      extractImportStatement(state, node);
      return;
    case "export_statement":
      extractExportStatement(state, node);
      return;
    case "function_declaration":
    case "generator_function_declaration":
    case "function":
    case "function_expression":
      extractFunctionDeclaration(state, node, flags);
      return;
    case "class_declaration":
    case "abstract_class_declaration":
    case "class":
      extractClassDeclaration(state, node, flags);
      return;
    case "interface_declaration":
      extractNamedType(state, node, "interface", flags);
      return;
    case "type_alias_declaration":
      extractNamedType(state, node, "type", flags);
      return;
    case "enum_declaration":
      extractNamedType(state, node, "enum", flags);
      return;
    case "lexical_declaration":
    case "variable_declaration":
      extractVariableDeclaration(state, node, flags);
      return;
    case "expression_statement":
      extractExpressionStatement(state, node);
      return;
    default:
      return;
  }
}

function extractImportStatement(state: ExtractionState, node: SyntaxNode): void {
  const source = findStringLiteral(node) ?? "";
  const specifiers = importSpecifiersFromClause(node);
  if (specifiers.length === 0 && source) {
    specifiers.push({ type: "side-effect" });
  }
  pushImport(state, node, "static", source, specifiers);
}

function importSpecifiersFromClause(node: SyntaxNode): ImportSpecifier[] {
  const specifiers: ImportSpecifier[] = [];
  const clause =
    node.childForFieldName("import") ??
    node.namedChildren.find((child) => child.type === "import_clause");

  if (!clause) {
    return specifiers;
  }

  if (clause.type === "identifier") {
    specifiers.push({ type: "default", local: clause.text });
    return specifiers;
  }

  for (const child of clause.namedChildren) {
    if (child.type === "identifier") {
      specifiers.push({ type: "default", local: child.text });
    } else if (child.type === "namespace_import") {
      const local = child.namedChildren.find((part) => part.type === "identifier");
      specifiers.push({ type: "namespace", local: local?.text });
    } else if (child.type === "named_imports") {
      for (const specifier of child.namedChildren) {
        if (specifier.type !== "import_specifier") {
          continue;
        }
        const importedNode = specifier.childForFieldName("name") ?? specifier.namedChildren[0];
        const aliasNode = specifier.childForFieldName("alias") ?? specifier.namedChildren[1];
        const imported = importedNode?.text;
        specifiers.push({
          type: "named",
          imported,
          local: aliasNode?.text ?? imported,
        });
      }
    }
  }
  return specifiers;
}

function extractExportStatement(state: ExtractionState, node: SyntaxNode): void {
  const isDefault = hasChildType(node, "default");
  const fromSource = findStringLiteral(node);
  const declaration = exportedDeclaration(node);

  if (declaration) {
    visitStatement(state, declaration, { exported: true, defaultExport: isDefault });
    const names = declarationNames(declaration, isDefault);
    pushExport(state, node, isDefault ? "default" : "named", names, undefined);
    for (const name of names) {
      if (name !== DEFAULT_EXPORT_DISPLAY_NAME) {
        state.localExportNames.add(name);
      }
      if (isDefault && name !== DEFAULT_EXPORT_DISPLAY_NAME) {
        state.defaultExportLocals.add(name);
      }
    }
    return;
  }

  if (fromSource && (hasStarExport(node) || hasChildType(node, "*"))) {
    pushExport(state, node, "export-all", ["*"], fromSource);
    return;
  }

  const specifiers = exportSpecifiers(node);
  if (fromSource) {
    pushExport(
      state,
      node,
      "re-export",
      specifiers.map((item) => item.exported),
      fromSource,
    );
    return;
  }

  if (isDefault) {
    const identifier = node.namedChildren.find((child) => child.type === "identifier");
    const name = identifier?.text ?? DEFAULT_EXPORT_DISPLAY_NAME;
    pushExport(state, node, "default", [name], undefined);
    if (identifier) {
      state.defaultExportLocals.add(identifier.text);
      state.localExportNames.add(identifier.text);
    }
    return;
  }

  if (specifiers.length > 0) {
    pushExport(
      state,
      node,
      "named",
      specifiers.map((item) => item.exported),
      undefined,
    );
    for (const item of specifiers) {
      state.localExportNames.add(item.local);
    }
  }
}

function extractFunctionDeclaration(
  state: ExtractionState,
  node: SyntaxNode,
  flags: { exported: boolean; defaultExport: boolean },
): void {
  const nameNode = node.childForFieldName("name");
  const name = nameNode?.text ?? (flags.defaultExport ? DEFAULT_EXPORT_DISPLAY_NAME : undefined);
  if (!name) {
    return;
  }
  pushSymbol(state, {
    node,
    name,
    qualifiedName: name,
    kind: classifyFunctionLike(name, node),
    exported: flags.exported,
    defaultExport: flags.defaultExport,
    async: hasChildType(node, "async"),
    signature: callableSignature(node, state.source, name),
  });
}

function extractClassDeclaration(
  state: ExtractionState,
  node: SyntaxNode,
  flags: { exported: boolean; defaultExport: boolean },
): void {
  const nameNode = node.childForFieldName("name");
  const name = nameNode?.text ?? (flags.defaultExport ? DEFAULT_EXPORT_DISPLAY_NAME : undefined);
  if (!name) {
    return;
  }
  const modifiers: string[] = [];
  if (node.type === "abstract_class_declaration" || hasChildType(node, "abstract")) {
    modifiers.push("abstract");
  }
  pushSymbol(state, {
    node,
    name,
    qualifiedName: name,
    kind: "class",
    exported: flags.exported,
    defaultExport: flags.defaultExport,
    async: false,
    signature: name,
    modifiers,
  });

  const body = node.childForFieldName("body");
  if (!body) {
    return;
  }
  for (const member of body.namedChildren) {
    if (member.type !== "method_definition" && member.type !== "abstract_method_signature") {
      continue;
    }
    extractMethod(state, member, name);
  }
}

function extractMethod(state: ExtractionState, node: SyntaxNode, className: string): void {
  const nameNode = node.childForFieldName("name");
  const name = nameNode?.text;
  if (!name) {
    return;
  }
  const modifiers: string[] = [];
  if (hasChildType(node, "static") || node.text.startsWith("static ")) {
    modifiers.push("static");
  }
  if (hasChildType(node, "async")) {
    modifiers.push("async");
  }
  if (hasChildType(node, "get")) {
    modifiers.push("get");
  }
  if (hasChildType(node, "set")) {
    modifiers.push("set");
  }
  if (hasChildType(node, "abstract") || node.type === "abstract_method_signature") {
    modifiers.push("abstract");
  }
  const qualifiedName = `${className}.${name}`;
  pushSymbol(state, {
    node,
    name,
    qualifiedName,
    kind: "method",
    exported: false,
    defaultExport: false,
    async: hasChildType(node, "async"),
    signature: callableSignature(node, state.source, name),
    modifiers,
  });
}

function extractNamedType(
  state: ExtractionState,
  node: SyntaxNode,
  kind: "interface" | "type" | "enum",
  flags: { exported: boolean; defaultExport: boolean },
): void {
  const nameNode = node.childForFieldName("name");
  const name = nameNode?.text;
  if (!name) {
    return;
  }
  pushSymbol(state, {
    node,
    name,
    qualifiedName: name,
    kind,
    exported: flags.exported,
    defaultExport: flags.defaultExport,
    async: false,
    signature: name,
  });
}

function extractVariableDeclaration(
  state: ExtractionState,
  node: SyntaxNode,
  flags: { exported: boolean; defaultExport: boolean },
): void {
  const isConst = node.child(0)?.text === "const" || hasChildType(node, "const");
  for (const declarator of node.namedChildren) {
    if (declarator.type !== "variable_declarator") {
      continue;
    }
    const nameNode = declarator.childForFieldName("name");
    if (!nameNode) {
      continue;
    }
    const value = declarator.childForFieldName("value");
    maybeExtractRequire(state, declarator, nameNode, value);

    if (nameNode.type !== "identifier") {
      continue;
    }
    const name = nameNode.text;
    const functionLike = unwrapFunctionLike(value);
    if (functionLike) {
      pushSymbol(state, {
        node: declarator,
        name,
        qualifiedName: name,
        kind: classifyFunctionLike(name, functionLike),
        exported: flags.exported,
        defaultExport: flags.defaultExport,
        async: hasChildType(functionLike, "async"),
        signature: callableSignature(functionLike, state.source, name),
      });
      continue;
    }

    pushSymbol(state, {
      node: declarator,
      name,
      qualifiedName: name,
      kind: isConst ? "constant" : "variable",
      exported: flags.exported,
      defaultExport: flags.defaultExport,
      async: false,
      signature: name,
    });
  }
}

function extractExpressionStatement(state: ExtractionState, node: SyntaxNode): void {
  const expression = node.namedChildren[0];
  if (!expression || expression.type !== "assignment_expression") {
    return;
  }
  const left = expression.childForFieldName("left") ?? expression.namedChildren[0];
  if (!left || left.type !== "member_expression") {
    return;
  }
  if (left.text === "module.exports") {
    pushExport(state, node, "default", [DEFAULT_EXPORT_DISPLAY_NAME], undefined);
  }
}

function maybeExtractRequire(
  state: ExtractionState,
  declarator: SyntaxNode,
  nameNode: SyntaxNode,
  value: SyntaxNode | null,
): void {
  if (!value || !isRequireCall(value)) {
    return;
  }
  const source = findStringLiteral(value) ?? "";
  const specifiers: ImportSpecifier[] = [];
  if (nameNode.type === "identifier") {
    specifiers.push({ type: "default", local: nameNode.text });
  } else if (nameNode.type === "object_pattern") {
    for (const child of nameNode.namedChildren) {
      if (child.type === "shorthand_property_identifier_pattern") {
        specifiers.push({ type: "named", imported: child.text, local: child.text });
      } else if (child.type === "pair_pattern" || child.type === "object_assignment_pattern") {
        const imported = child.namedChildren[0]?.text;
        const local = child.namedChildren[1]?.text ?? imported;
        if (imported) {
          specifiers.push({ type: "named", imported, local });
        }
      }
    }
  }
  pushImport(state, declarator, "require", source, specifiers);
}

function collectDynamicImports(state: ExtractionState, root: SyntaxNode): void {
  const calls = root.descendantsOfType("call_expression");
  for (const call of calls) {
    const fn = call.childForFieldName("function") ?? call.namedChildren[0];
    if (!fn || fn.type !== "import") {
      continue;
    }
    const source = findStringLiteral(call);
    if (source === undefined) {
      continue;
    }
    pushImport(state, call, "dynamic", source, [{ type: "namespace", local: undefined }]);
  }
}

function applyIntraFileExportFlags(state: ExtractionState): void {
  for (const symbol of state.symbols) {
    if (
      state.localExportNames.has(symbol.name) ||
      state.localExportNames.has(symbol.qualifiedName ?? "")
    ) {
      symbol.exported = true;
    }
    if (
      state.defaultExportLocals.has(symbol.name) ||
      state.defaultExportLocals.has(symbol.qualifiedName ?? "")
    ) {
      symbol.exported = true;
      symbol.defaultExport = true;
    }
  }
}

function pushSymbol(
  state: ExtractionState,
  input: {
    node: SyntaxNode;
    name: string;
    qualifiedName: string;
    kind: SymbolKind;
    exported: boolean;
    defaultExport: boolean;
    async: boolean;
    signature?: string;
    modifiers?: string[];
  },
): void {
  const location = locationFromNode(input.node);
  const symbol: SymbolNode = {
    id: symbolId({
      repositoryId: state.context.repositoryId,
      fileId: state.context.fileId,
      kind: input.kind,
      qualifiedName: input.qualifiedName,
      location,
    }),
    name: input.name,
    qualifiedName: input.qualifiedName,
    kind: input.kind,
    fileId: state.context.fileId,
    location,
    exported: input.exported,
    defaultExport: input.defaultExport,
    async: input.async,
  };
  if (input.signature) {
    symbol.signature = input.signature;
  }
  const documentation = extractJsdoc(state.source, documentationIndex(input.node));
  if (documentation) {
    symbol.documentation = documentation;
  }
  if (input.modifiers && input.modifiers.length > 0) {
    symbol.modifiers = input.modifiers;
  }
  if (input.kind === "component" || input.kind === "hook") {
    symbol.metadata = { heuristic: true };
  }
  state.symbols.push(symbol);
}

function pushImport(
  state: ExtractionState,
  node: SyntaxNode,
  kind: ImportDeclaration["kind"],
  source: string,
  specifiers: ImportSpecifier[],
): void {
  const location = locationFromNode(node);
  state.imports.push({
    id: importId({ fileId: state.context.fileId, kind, source, location }),
    fileId: state.context.fileId,
    source,
    location,
    kind,
    specifiers,
  });
}

function pushExport(
  state: ExtractionState,
  node: SyntaxNode,
  type: ExportDeclaration["type"],
  names: string[],
  source: string | undefined,
): void {
  const location = locationFromNode(node);
  const declaration: ExportDeclaration = {
    id: exportId({ fileId: state.context.fileId, type, names, source, location }),
    fileId: state.context.fileId,
    location,
    type,
    names,
  };
  if (source !== undefined) {
    declaration.source = source;
  }
  state.exports.push(declaration);
}

function classifyFunctionLike(name: string, node: SyntaxNode): SymbolKind {
  if (/^use[A-Z]/.test(name)) {
    return "hook";
  }
  if (/^[A-Z]/.test(name) && containsJsx(node)) {
    return "component";
  }
  return "function";
}

function containsJsx(node: SyntaxNode): boolean {
  if (JSX_TYPES.has(node.type)) {
    return true;
  }
  return node.descendantsOfType([...JSX_TYPES]).length > 0;
}

function unwrapFunctionLike(node: SyntaxNode | null): SyntaxNode | null {
  if (!node) {
    return null;
  }
  if (CALLABLE_TYPES.has(node.type) || FUNCTION_DECL_TYPES.has(node.type)) {
    return node;
  }
  if (node.type === "parenthesized_expression") {
    return unwrapFunctionLike(node.namedChildren[0] ?? null);
  }
  return null;
}

function callableSignature(node: SyntaxNode, source: string, displayName: string): string {
  const parameters = node.childForFieldName("parameters") ?? node.childForFieldName("parameter");
  const returnType = node.childForFieldName("return_type");
  let paramsText = "()";
  if (parameters) {
    paramsText = collapseWhitespace(parameters.text);
    if (!paramsText.startsWith("(")) {
      paramsText = `(${paramsText})`;
    }
  }
  const returnText = returnType ? collapseWhitespace(returnType.text) : "";
  const signature = `${displayName}${paramsText}${returnText}`;
  return signature.length > 200 ? `${signature.slice(0, 197)}...` : signature;
}

function isRequireCall(node: SyntaxNode): boolean {
  if (node.type !== "call_expression") {
    return false;
  }
  const fn = node.childForFieldName("function") ?? node.namedChildren[0];
  return fn?.type === "identifier" && fn.text === "require";
}

function findStringLiteral(node: SyntaxNode): string | undefined {
  if (node.type === "string") {
    return unquote(node.text);
  }
  const field = node.childForFieldName("source") ?? node.childForFieldName("arguments") ?? null;
  if (field?.type === "string") {
    return unquote(field.text);
  }
  for (const child of node.namedChildren) {
    if (child.type === "string") {
      return unquote(child.text);
    }
    if (child.type === "arguments") {
      const inner = child.namedChildren.find((part) => part.type === "string");
      if (inner) {
        return unquote(inner.text);
      }
    }
  }
  return undefined;
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith("`") && value.endsWith("`"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function hasChildType(node: SyntaxNode, type: string): boolean {
  return node.children.some((child) => child.type === type);
}

function hasStarExport(node: SyntaxNode): boolean {
  return node.children.some((child) => child.type === "*" || child.text === "*");
}

function exportedDeclaration(node: SyntaxNode): SyntaxNode | null {
  const declaration = node.childForFieldName("declaration");
  if (declaration) {
    return declaration;
  }
  return (
    node.namedChildren.find(
      (child) =>
        FUNCTION_DECL_TYPES.has(child.type) ||
        CLASS_DECL_TYPES.has(child.type) ||
        child.type === "function" ||
        child.type === "function_expression" ||
        child.type === "class" ||
        child.type === "lexical_declaration" ||
        child.type === "variable_declaration" ||
        child.type === "interface_declaration" ||
        child.type === "type_alias_declaration" ||
        child.type === "enum_declaration",
    ) ?? null
  );
}

function declarationNames(node: SyntaxNode, isDefault: boolean): string[] {
  if (
    FUNCTION_DECL_TYPES.has(node.type) ||
    CLASS_DECL_TYPES.has(node.type) ||
    node.type === "function" ||
    node.type === "function_expression" ||
    node.type === "class"
  ) {
    const name = node.childForFieldName("name")?.text;
    return [name ?? DEFAULT_EXPORT_DISPLAY_NAME];
  }
  if (
    node.type === "interface_declaration" ||
    node.type === "type_alias_declaration" ||
    node.type === "enum_declaration"
  ) {
    const name = node.childForFieldName("name")?.text;
    return name ? [name] : [];
  }
  if (node.type === "lexical_declaration" || node.type === "variable_declaration") {
    const names: string[] = [];
    for (const declarator of node.namedChildren) {
      const nameNode = declarator.childForFieldName("name");
      if (nameNode?.type === "identifier") {
        names.push(nameNode.text);
      }
    }
    return names;
  }
  return isDefault ? [DEFAULT_EXPORT_DISPLAY_NAME] : [];
}

function exportSpecifiers(node: SyntaxNode): { local: string; exported: string }[] {
  const clause =
    node.childForFieldName("export") ??
    node.namedChildren.find((child) => child.type === "export_clause");
  if (!clause) {
    return [];
  }
  const result: { local: string; exported: string }[] = [];
  const specifiers = clause.type === "export_clause" ? clause.namedChildren : clause.namedChildren;
  for (const specifier of specifiers) {
    if (specifier.type !== "export_specifier") {
      continue;
    }
    const nameNode = specifier.childForFieldName("name") ?? specifier.namedChildren[0];
    const aliasNode = specifier.childForFieldName("alias") ?? specifier.namedChildren[1];
    const local = nameNode?.text;
    if (!local) {
      continue;
    }
    result.push({ local, exported: aliasNode?.text ?? local });
  }
  return result;
}

function addSyntaxDiagnostics(state: ExtractionState, root: SyntaxNode): void {
  const errors: SyntaxNode[] = [];
  collectErrorNodes(root, errors);
  const unique = errors.slice(0, 20);
  if (unique.length === 0) {
    state.diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.SOURCE_SYNTAX_ERROR,
        "Tree-sitter reported syntax errors in this file.",
        state.filePath,
      ),
    );
    return;
  }
  for (const node of unique) {
    const location = locationFromNode(node);
    state.diagnostics.push(
      createDiagnostic(
        "warning",
        DiagnosticCode.SOURCE_SYNTAX_ERROR,
        `Syntax error near line ${location.startLine}, column ${location.startColumn}.`,
        state.filePath,
      ),
    );
  }
}

function collectErrorNodes(node: SyntaxNode, out: SyntaxNode[]): void {
  if (node.type === "ERROR" || node.isMissing) {
    out.push(node);
  }
  for (const child of node.children) {
    collectErrorNodes(child, out);
  }
}

function documentationIndex(node: SyntaxNode): number {
  let current: SyntaxNode | null = node;
  while (current.parent && current.parent.type === "export_statement") {
    current = current.parent;
  }
  return current.startIndex;
}

function sortExtracted(state: ExtractionState): void {
  state.symbols.sort(byLocationThenName);
  state.imports.sort((a, b) => compareLocations(a.location, b.location));
  state.exports.sort((a, b) => compareLocations(a.location, b.location));
}

function byLocationThenName(
  a: { location: SourceLocation; name: string },
  b: {
    location: SourceLocation;
    name: string;
  },
): number {
  const byLocation = compareLocations(a.location, b.location);
  return byLocation !== 0 ? byLocation : a.name.localeCompare(b.name);
}
