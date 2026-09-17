import { describe, expect, it } from "vitest";
import { DiagnosticCode } from "@codetranslate/core";
import { extractEcmascriptFile } from "./ecmascript";

const context = { repositoryId: "repo_test", fileId: "file_test" };

function parseTs(source: string) {
  return extractEcmascriptFile({
    language: "typescript",
    parserId: "tree-sitter-typescript/typescript",
    source,
    filePath: "file.ts",
    context,
  });
}

function parseJs(source: string) {
  return extractEcmascriptFile({
    language: "javascript",
    parserId: "tree-sitter-javascript",
    source,
    filePath: "file.js",
    context,
  });
}

function parseTsx(source: string) {
  return extractEcmascriptFile({
    language: "tsx",
    parserId: "tree-sitter-typescript/tsx",
    source,
    filePath: "file.tsx",
    context,
  });
}

function parseJsx(source: string) {
  return extractEcmascriptFile({
    language: "jsx",
    parserId: "tree-sitter-javascript/jsx",
    source,
    filePath: "file.jsx",
    context,
  });
}

describe("JavaScript parsing", () => {
  it("extracts functions, async functions, arrows, classes, methods, and module.exports", () => {
    const analysis = parseJs(`
import something from "./something.js";
export function hello(name) { return name; }
export const add = (a, b) => a + b;
export async function load() { return 1; }
class UserService {
  getUser(id) { return id; }
}
module.exports = {};
`);
    expect(analysis.parse.successful).toBe(true);
    expect(analysis.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "hello", kind: "function", exported: true, async: false }),
        expect.objectContaining({ name: "add", kind: "function", exported: true }),
        expect.objectContaining({ name: "load", kind: "function", async: true, exported: true }),
        expect.objectContaining({ name: "UserService", kind: "class" }),
        expect.objectContaining({
          name: "getUser",
          kind: "method",
          qualifiedName: "UserService.getUser",
        }),
      ]),
    );
    expect(analysis.exports.some((item) => item.type === "default")).toBe(true);
  });

  it("extracts ES, namespace, side-effect, require, and dynamic imports", () => {
    const analysis = parseJs(`
import React from "react";
import { useState as state } from "react";
import * as utils from "./utils.js";
import "./side.css";
const express = require("express");
const { readFile } = require("fs");
export async function load() {
  return import("./lazy.js");
}
`);
    expect(analysis.imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "react",
          kind: "static",
          specifiers: [expect.objectContaining({ type: "default", local: "React" })],
        }),
        expect.objectContaining({
          source: "react",
          specifiers: [
            expect.objectContaining({ type: "named", imported: "useState", local: "state" }),
          ],
        }),
        expect.objectContaining({
          source: "./utils.js",
          specifiers: [expect.objectContaining({ type: "namespace", local: "utils" })],
        }),
        expect.objectContaining({
          source: "./side.css",
          specifiers: [expect.objectContaining({ type: "side-effect" })],
        }),
        expect.objectContaining({ source: "express", kind: "require" }),
        expect.objectContaining({ source: "fs", kind: "require" }),
        expect.objectContaining({ source: "./lazy.js", kind: "dynamic" }),
      ]),
    );
  });
});

describe("TypeScript parsing", () => {
  it("extracts interfaces, types, enums, constants, variables, classes, and signatures", () => {
    const analysis = parseTs(`
export interface User { id: string }
export type UserId = string;
export enum Status { Active, Disabled }
export const DEFAULT_LIMIT = 10;
let currentUser = null;
/**
 * Looks up a user.
 */
export async function getUser(id: UserId): Promise<User | null> {
  return null;
}
export class UserService {
  async find(id: UserId): Promise<User | null> { return null; }
}
`);
    expect(analysis.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "User", kind: "interface", exported: true }),
        expect.objectContaining({ name: "UserId", kind: "type", exported: true }),
        expect.objectContaining({ name: "Status", kind: "enum", exported: true }),
        expect.objectContaining({ name: "DEFAULT_LIMIT", kind: "constant", exported: true }),
        expect.objectContaining({ name: "currentUser", kind: "variable", exported: false }),
        expect.objectContaining({
          name: "getUser",
          kind: "function",
          async: true,
          exported: true,
          documentation: "Looks up a user.",
        }),
        expect.objectContaining({ name: "UserService", kind: "class", exported: true }),
        expect.objectContaining({
          name: "find",
          kind: "method",
          async: true,
          qualifiedName: "UserService.find",
        }),
      ]),
    );
    const getUser = analysis.symbols.find((symbol) => symbol.name === "getUser");
    expect(getUser?.signature).toContain("getUser");
    expect(getUser?.signature).toContain("UserId");
  });

  it("extracts named, default, re-export, and export-all forms and flags locals", () => {
    const analysis = parseTs(`
function Page() {}
export { Page };
export default Page;
export { foo } from "./foo";
export * from "./bar";
export const value = 1;
`);
    const page = analysis.symbols.find((symbol) => symbol.name === "Page");
    expect(page?.exported).toBe(true);
    expect(page?.defaultExport).toBe(true);
    expect(analysis.exports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "named", names: expect.arrayContaining(["Page"]) }),
        expect.objectContaining({ type: "default" }),
        expect.objectContaining({ type: "re-export", source: "./foo" }),
        expect.objectContaining({ type: "export-all", source: "./bar" }),
      ]),
    );
  });

  it("uses a synthetic name for anonymous default exports", () => {
    const analysis = parseTs(`export default function () { return 1; }`);
    expect(analysis.symbols[0]).toMatchObject({
      name: "default",
      defaultExport: true,
      exported: true,
    });
  });
});

describe("JSX and TSX", () => {
  it("classifies JSX-returning PascalCase functions as components", () => {
    const analysis = parseTsx(`
export function Button() {
  return <button>Click</button>;
}
export const WelcomeCard = () => {
  return <section>Welcome</section>;
};
`);
    expect(analysis.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Button", kind: "component", exported: true }),
        expect.objectContaining({ name: "WelcomeCard", kind: "component", exported: true }),
      ]),
    );
  });

  it("does not mark PascalCase functions without JSX as components", () => {
    const analysis = parseTs(`
function UserService() {
  return createUserService();
}
function ParseJSON() {
  return JSON.parse("{}");
}
function createUserService() { return {}; }
`);
    expect(analysis.symbols.find((symbol) => symbol.name === "UserService")?.kind).toBe("function");
    expect(analysis.symbols.find((symbol) => symbol.name === "ParseJSON")?.kind).toBe("function");
  });

  it("classifies useX hooks by name", () => {
    const analysis = parseTsx(`
import { useState } from "react";
export function useCounter() {
  const [count, setCount] = useState(0);
  return count;
}
`);
    expect(analysis.symbols).toContainEqual(
      expect.objectContaining({ name: "useCounter", kind: "hook", exported: true }),
    );
  });

  it("parses JSX files", () => {
    const analysis = parseJsx(`export function IconButton() { return <button>Icon</button>; }`);
    expect(analysis.symbols[0]).toMatchObject({ name: "IconButton", kind: "component" });
  });
});

describe("locations, IDs, and comments", () => {
  it("uses 1-based line and column coordinates", () => {
    const analysis = parseTs(`export function hello() {}\n`);
    const hello = analysis.symbols.find((symbol) => symbol.name === "hello");
    expect(hello?.location.startLine).toBe(1);
    expect(hello?.location.startColumn).toBeGreaterThanOrEqual(1);
    expect(hello?.location.endLine).toBeGreaterThanOrEqual(1);
  });

  it("produces deterministic symbol IDs", () => {
    const source = `export function hello() { return 1; }`;
    const first = parseTs(source).symbols[0]?.id;
    const second = parseTs(source).symbols[0]?.id;
    expect(first).toBe(second);
    expect(first?.startsWith("symbol_")).toBe(true);
  });
});

describe("syntax errors and security", () => {
  it("continues extraction and reports SOURCE_SYNTAX_ERROR", () => {
    const analysis = parseTs(`export function broken(\n  return 123\n`);
    expect(analysis.parse.successful).toBe(true);
    expect(analysis.parse.hasSyntaxErrors).toBe(true);
    expect(analysis.diagnostics.some((d) => d.code === DiagnosticCode.SOURCE_SYNTAX_ERROR)).toBe(
      true,
    );
  });

  it("treats process.exit and child_process as syntax only", () => {
    const analysis = parseJs(`
export function wreck() {
  process.exit(1);
  require("child_process").exec("echo hi");
}
`);
    expect(analysis.parse.successful).toBe(true);
    expect(analysis.symbols).toContainEqual(
      expect.objectContaining({ name: "wreck", kind: "function" }),
    );
  });
});
