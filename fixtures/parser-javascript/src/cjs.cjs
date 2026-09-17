const path = require("path");

function resolve(name) {
  return path.join(".", name);
}

module.exports = { resolve };
