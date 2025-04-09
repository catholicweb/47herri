import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import fetch from 'node-fetch';

const dir = '.'; // Cambia esto a tu carpeta de .md
const keysToExtract = ['description', 'notes'];
const valueSet = new Set();

const ignoredDirs = new Set(['.git', 'node_modules', '_site']); // Añade aquí los nombres de carpetas a ignorar
function getMarkdownFiles(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.flatMap(entry => {
        if (entry.isDirectory() && ignoredDirs.has(entry.name)) return [];
        const fullPath = path.join(dirPath, entry.name);
        return entry.isDirectory() ? getMarkdownFiles(fullPath) :
            entry.isFile() && path.extname(entry.name) === '.md' ? [fullPath] : [];
    });
}


// Añade esta función para recorrer objetos recursivamente
function extractValues(obj, keys) {
    const results = [];
    for (const [k, v] of Object.entries(obj)) {
        if (keys.includes(k) && typeof v === 'string') {
            results.push(v.trim());
        }
        if (typeof v === 'object' && v !== null) {
            results.push(...extractValues(v, keys));
        }
    }
    return results;
}

const files = getMarkdownFiles(dir);

for (const file of files) {
    console.log(file)
    const content = fs.readFileSync(file, 'utf-8');
    const parsed = matter(content);
    const values = extractValues(parsed.data, keysToExtract);
    values.forEach(v => valueSet.add(v));

    if (parsed.content.trim()) {
        let bits = parsed.content.trim().split('\n')
        bits.forEach(b => valueSet.add(b))
    }
}



// Cargar diccionario existente (o inicializarlo)
const dictPath = 'assets/dictionary.json'
const dictionary = fs.existsSync(dictPath) ?
    JSON.parse(fs.readFileSync(dictPath, 'utf-8')) : {};

// Traducir entradas faltantes
async function translateMissing(valuesArray, language) {
    if (!dictionary[language]) dictionary[language] = {}

    const missing = valuesArray.filter(phrase => !dictionary[language][phrase]);

    const translations = await translateWithOpenAI(missing, language)

    console.log('translations', translations)

    missing.forEach((text, index) => {

        dictionary[language][text] = translations[index];
    });

    // Guardar actualizaciones
    fs.writeFileSync(dictPath, JSON.stringify(dictionary), 'utf-8');
}

// Llamada a OpenAI
async function translateWithOpenAI(missing, language) {
    console.log("[translateWithOpenAI]:", language, missing)

    if (!missing.length) return {}
    if (missing.length == 1 && !missing[0]) return {}

    let apiKey = process.env.OPENAI_API_KEY

    console.log('calling openai')
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { "type": "json_object" },
            messages: [
                { role: "system", content: "You are a professional translator for a catholic website. Return only a JSON object with translations, ej translations = { [translation-text-0, translation-text-1... ]}." },
                { role: "user", content: `Translate this array of texts from basque to ${language}: ${JSON.stringify(missing, null, 2)}` }
            ],
            temperature: 0.3
        })
    });
    if (!response.ok) {
        console.error(response)
        throw new Error("Failed to fetch translation");
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message.content) {
        throw new Error("Invalid response from OpenAI");
    }

    return JSON.parse(data.choices[0].message.content).translations;
}



async function translateAll(valuesArray) {
    valuesArray.push('')
    let a = await translateMissing(valuesArray, 'spanish');


    let keys = Object.keys(dictionary.spanish)
    let langs = ["english", "bulgarian", "italian", "romanian", "portuguese", "catalan", "arabic", "german", "french"]
    for (var i = 0; i < langs.length; i++) {

        // delete uneded entries
        dictionary[langs[i]] = Object.entries(dictionary[langs[i]])
            .filter(([key]) => keys.includes(key)) // Keep entries where the key is in keysToPreserve
            .reduce((acc, [key, value]) => {
                acc[key] = value; // Rebuild the object with the filtered keys
                return acc;
            }, {});

        let a = await translateMissing(keys, langs[i]);

    }
}


// Convertir a array si lo necesitas
const valuesArray = [...valueSet];
console.log(valuesArray);

translateAll(valuesArray)