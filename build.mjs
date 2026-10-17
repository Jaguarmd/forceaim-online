import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const output = resolve(projectRoot, "dist");
const publicFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "config.js",
  "favicon.svg",
  "privacy.html",
  "terms.html",
  "robots.txt",
  "sitemap.xml"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(publicFiles.map((file) => cp(resolve(projectRoot, file), resolve(output, file))));

console.log(`Built ${publicFiles.length} static files into dist/.`);
