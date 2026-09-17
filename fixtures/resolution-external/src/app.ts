import React from "react";
import Stripe from "stripe";
import fs from "node:fs";
import path from "path";
import lodashFp from "lodash/fp";

export function use(value: unknown) {
  return [React, Stripe, fs, path, lodashFp, value];
}
