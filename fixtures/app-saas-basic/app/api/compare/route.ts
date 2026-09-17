import { compareDocuments } from "../../../lib/openai";

export async function POST() {
  return compareDocuments("left", "right");
}
