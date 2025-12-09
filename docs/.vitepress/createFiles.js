import fs from "fs";
import path from "path";
import fg from "fast-glob";
import matter from "gray-matter";
import yaml from "js-yaml";

const ROOT = "./docs/";
const OUT = "./docs/";
const DICTIONARY = JSON.parse(fs.readFileSync("./docs/public/dictionary.json", "utf8"));

// Lista de lenguas a generar
const TARGET_LANGS = Object.keys(DICTIONARY);

// Campos que quieres traducir
const FIELDS = ["title", "description", "html", "name", "actionName"];

function translateValue(value, dict) {
  if (typeof value === "string") return dict[value] || value;
  return value;
}

// Recursivo
function translateObject(obj, dict) {
  if (Array.isArray(obj)) {
    return obj.map((v) => translateObject(v, dict));
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (FIELDS.includes(k)) out[k] = translateValue(v, dict);
      else out[k] = translateObject(v, dict);
    }
    return out;
  }
  return obj;
}

async function run() {
  const files = await fg(["**/*.md", "!aviso-legal.md"], { cwd: ROOT, absolute: true });

  for (const file of files) {
    const original = matter.read(file);

    for (const lang of TARGET_LANGS) {
      const dict = DICTIONARY[lang] || {};
      const translatedData = translateObject(original.data, dict);

      const outContent = matter.stringify(original.content, translatedData, { language: "yaml", yamlOptions: { lineWidth: -1 } });

      const fname = path.basename(file);
      const destDir = path.join(OUT, lang);
      const dest = path.join(destDir, fname);

      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(dest, outContent, "utf8");

      console.log(`→ ${lang}/${fname}`);
    }
  }
}

run();
