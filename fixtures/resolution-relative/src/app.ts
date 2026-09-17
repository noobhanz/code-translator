import { foo } from "./lib/foo";
import { util } from "../util";
import { nested } from "./dir";
import { exact } from "./exact.js";
import { missing } from "./missing-relative";

const fs = require("./lib/foo");

export async function load() {
  return import("./dir");
}

export function useAll() {
  return [foo, util, nested, exact, fs];
}
