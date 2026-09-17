import something from "./something.js";
import { foo as bar } from "./foo.js";
import * as utils from "./utils.js";
import "./side-effect.js";

/**
 * Greet someone by name.
 */
export function hello(name) {
  return `Hello ${name}`;
}

export const add = (a, b) => a + b;

export async function load() {
  return import("./lazy.js");
}

class UserService {
  getUser(id) {
    return id;
  }
}

const express = require("express");
const { readFile } = require("fs");

module.exports = {};
