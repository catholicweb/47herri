import fs from "fs";
import fetch from "node-fetch"; // npm install node-fetch@2

const BASE_URL = "https://gxvchjojub.execute-api.eu-west-1.amazonaws.com/production/getmissafreecontent?lang=es&day=";

async function getGospelForDate(dateStr) {
  try {
    const res = await fetch(`${BASE_URL}${dateStr}`);
    const data = await res.json();
    return data.evangeli?.cita || null;
  } catch (e) {
    console.error(`❌ Error en ${dateStr}:`, e.message);
    return null;
  }
}

async function main() {
  const today = new Date();
  const results = {};

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const cita = await getGospelForDate(dateStr);
    if (cita) {
      results[dateStr] = cita;
      console.log(`✅ ${dateStr}: ${cita}`);
    } else {
      console.warn(`⚠️  No se encontró evangelio para ${dateStr}`);
    }

    // Pequeña pausa para no saturar el servidor (opcional)
    await new Promise((r) => setTimeout(r, 300));
  }

  fs.writeFileSync("ref.json", JSON.stringify(results, null, 2), "utf8");
  console.log(`\n📘 Evangelios guardados en ref.json (${Object.keys(results).length} días)`);
}

main();
