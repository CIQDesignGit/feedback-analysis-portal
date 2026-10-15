const { copyFileSync, mkdirSync } = require("fs");
const { dirname, join } = require("path");

const dest = join(
  "node_modules/@ciq-dev/ciq-design-system/src/styles/tokens.css",
);
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(join(__dirname, "ciq-tokens.css"), dest);
