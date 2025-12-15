import fs from "fs";
import fg from "fast-glob";
import path from "path";
import matter from "gray-matter";

const dictPath = "./docs/public/dictionary.json";
const keysToExtract = ["description", "html", "title", "name", "action"];
const valueSet = new Set();
const dictionary = fs.existsSync(dictPath) ? JSON.parse(fs.readFileSync(dictPath, "utf-8")) : {};

function readFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content || "{}");
  }
  return matter(content).data || {};
}

// Añade esta función para recorrer objetos recursivamente
function extractValues(obj, keys) {
  const results = [];
  for (const [k, v] of Object.entries(obj)) {
    if (keys.includes(k) && typeof v === "string") {
      results.push(v.trim());
    }
    if (typeof v === "object" && v !== null) {
      results.push(...extractValues(v, keys));
    }
  }
  return results;
}

// Traducir entradas faltantes
async function translateMissing(valuesArray, language) {
  let code = language;
  if (!dictionary[code]) dictionary[code] = {};

  const missing = valuesArray.filter((phrase) => !dictionary[code][phrase]).slice(0, 10);

  const translations = await translateWithOpenAI(missing, language);

  console.log("translations", translations);

  missing.forEach((text, index) => {
    dictionary[code][text] = translations[index];
  });

  // Guardar actualizaciones
  fs.writeFileSync(dictPath, JSON.stringify(dictionary), "utf-8");
}

// Llamada a OpenAI
async function translateWithOpenAI(missing, language) {
  console.log("[translateWithOpenAI]:", language, missing);

  if (!missing.length) return [];
  if (missing.length == 1 && !missing[0]) return [];

  let apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return console.log("You need an api key!");
  }

  console.log("calling openai");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      //model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a professional translator for a catholic website, texts most likely include catholic event titles, descriptions, timings etc... Very important preserve any markdown or html tags the text might contain. Return only a JSON object with translations, ej translations = { [translation-text-0, translation-text-1... ]}." },
        { role: "user", content: `Translate this array of texts from spanish to ${language}: ${JSON.stringify(missing, null, 2)}` },
      ],
      temperature: 0.3,
    }),
  });
  if (!response.ok) {
    console.error(response);
    throw new Error("Failed to fetch translation");
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message.content) {
    throw new Error("Invalid response from OpenAI");
  }

  return JSON.parse(data.choices[0].message.content).translations;
}

(async () => {
  try {
    // Get values
    const files = await fg(["*.md", "!aviso-legal.md"], { cwd: "./pages", absolute: false });
    for (const file of files) {
      const content = fs.readFileSync("./pages/" + file, "utf-8");
      const parsed = matter(content);
      const values = extractValues(parsed.data, keysToExtract);
      values.forEach((v) => valueSet.add(v));

      if (parsed.content?.trim()) {
        let bits = parsed.content.trim().split("\n");
        bits.forEach((b) => valueSet.add(b));
      }
    }
    const valuesArray = [...valueSet];

    //
    let config = readFrontmatter("./pages/config.json");
    let languages = config.languages?.length ? config.languages : ["Español"];
    for (const lang of languages) {
      await translateMissing(valuesArray, lang);
    }
  } catch (error) {
    console.error("Error loading translating data:", error);
  }
})();
