import fs from "node:fs/promises";
import { sha256Hex } from "@codetranslate/shared";

export async function hashFileContents(absolutePath: string): Promise<string> {
  const buffer = await fs.readFile(absolutePath);
  return sha256Hex(buffer);
}

export async function peekFileBytes(absolutePath: string, byteCount: number): Promise<Buffer> {
  const handle = await fs.open(absolutePath, "r");
  try {
    const buffer = Buffer.alloc(byteCount);
    const { bytesRead } = await handle.read(buffer, 0, byteCount, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}
