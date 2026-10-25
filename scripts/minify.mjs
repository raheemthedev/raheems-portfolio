// Minifies the site's JavaScript and CSS in place for deployment (run by
// Vercel after `npm run build`; see vercel.json). The scripts share globals
// across files, so they're minified as plain scripts: top-level names are
// left alone, only what's inside them is shortened.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { transform } from "esbuild";

const files = (await readdir(".")).filter((name) => /\.(js|css)$/.test(name));
let before = 0;
let after = 0;
for (const file of files) {
  const source = await readFile(file, "utf8");
  const { code } = await transform(source, { loader: file.endsWith(".css") ? "css" : "js", minify: true, target: "es2020" });
  await writeFile(file, code);
  before += source.length;
  after += code.length;
}
console.log(`Minified ${files.length} files: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
