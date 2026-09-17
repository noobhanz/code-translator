import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";
import type { SupportedParserLanguage } from "../types";

export type SyntaxNode = Parser.SyntaxNode;
export type Tree = Parser.Tree;

const parsers = new Map<SupportedParserLanguage, Parser>();

function languageFor(id: SupportedParserLanguage): unknown {
  switch (id) {
    case "javascript":
    case "jsx":
      return JavaScript;
    case "typescript":
      return TypeScript.typescript;
    case "tsx":
      return TypeScript.tsx;
  }
}

function getParser(id: SupportedParserLanguage): Parser {
  const existing = parsers.get(id);
  if (existing) {
    return existing;
  }
  const parser = new Parser();
  parser.setLanguage(languageFor(id));
  parsers.set(id, parser);
  return parser;
}

export function parseSource(language: SupportedParserLanguage, source: string): Tree {
  return getParser(language).parse(source);
}
