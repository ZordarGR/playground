#!/usr/bin/env node
/* Builds deepvein-standalone.html: index.html with style.css, game.js and every
   sprite inlined (sprites become data: URIs), so the whole game is one file. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

let html = read("index.html");
const css = read("style.css");
const js = read("game.js");

// inline stylesheet & script
html = html.replace(
  /<link rel="stylesheet" href="style.css">/,
  () => `<style>\n${css}\n</style>`
);

// sprites → data URIs injected into the JS SPRITE() lookup
const spriteDir = path.join(root, "assets", "sprites");
const sprites = {};
for (const f of fs.readdirSync(spriteDir).sort()) {
  if (!f.endsWith(".svg")) continue;
  const svg = fs.readFileSync(path.join(spriteDir, f), "utf8");
  sprites[f.replace(/\.svg$/, "")] =
    "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}
const bundledJs = js.replace(
  /const SPRITE = id => `assets\/sprites\/\$\{id\}\.svg`;/,
  () => `const SPRITE_DATA = ${JSON.stringify(sprites)};\nconst SPRITE = id => SPRITE_DATA[id];`
);
if (!bundledJs.includes("SPRITE_DATA")) {
  console.error("bundle.js: failed to inline sprites — SPRITE() line not found in game.js");
  process.exit(1);
}

html = html.replace(
  /<script src="game.js"><\/script>/,
  () => `<script>\n${bundledJs}\n</script>`
);

const out = path.join(root, "deepvein-standalone.html");
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB, ${Object.keys(sprites).length} sprites inlined)`);
