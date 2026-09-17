import { describe, expect, it } from "vitest";
import { hasBinaryExtension, looksBinary } from "./detect";

describe("binary detection", () => {
  it("recognizes binary extensions", () => {
    expect(hasBinaryExtension("logo.png")).toBe(true);
    expect(hasBinaryExtension("photo.jpg")).toBe(true);
    expect(hasBinaryExtension("photo.jpeg")).toBe(true);
    expect(hasBinaryExtension("anim.gif")).toBe(true);
    expect(hasBinaryExtension("pic.webp")).toBe(true);
    expect(hasBinaryExtension("favicon.ico")).toBe(true);
    expect(hasBinaryExtension("doc.pdf")).toBe(true);
    expect(hasBinaryExtension("a.zip")).toBe(true);
    expect(hasBinaryExtension("a.gz")).toBe(true);
    expect(hasBinaryExtension("a.mp4")).toBe(true);
    expect(hasBinaryExtension("a.mov")).toBe(true);
    expect(hasBinaryExtension("a.mp3")).toBe(true);
    expect(hasBinaryExtension("a.wav")).toBe(true);
    expect(hasBinaryExtension("a.woff")).toBe(true);
    expect(hasBinaryExtension("a.woff2")).toBe(true);
    expect(hasBinaryExtension("a.ttf")).toBe(true);
    expect(hasBinaryExtension("a.otf")).toBe(true);
    expect(hasBinaryExtension("index.ts")).toBe(false);
  });

  it("uses a null-byte heuristic", () => {
    expect(looksBinary(Buffer.from("hello world"))).toBe(false);
    expect(looksBinary(Buffer.from([0x00, 0x01, 0x02]))).toBe(true);
    expect(looksBinary(Buffer.from("hello\0world"))).toBe(true);
    expect(looksBinary(Buffer.from([]))).toBe(false);
  });
});
