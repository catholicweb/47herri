import fs from "fs";
import path from "path";
import fg from "fast-glob";
import matter from "gray-matter";

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parses a Basque date/time string into structured data.
 * @param {string} input - e.g., "igandetan 12.30 2. astea"
 * @returns {Object} { time: string, rrule: string }
 */
function parseBasqueSchedule(input) {
  const text = input.toLowerCase();
  let time = [];
  let rrule = [];

  // 1. Extract Time (matches HH:mm or HH.mm)
  const timeMatch = text.match(/(\d{1,2})[:.](\d{2})/);
  if (timeMatch) {
    time.push(`${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`);
  }

  // 2. Identify Weekly Patterns (mapping Basque day names/suffixes)
  const dayPatterns = [
    { value: "mo", keys: ["astelehen", "astelehenetan"] },
    { value: "tu", keys: ["astearte", "asteartetan"] },
    { value: "we", keys: ["asteazken", "asteazkenetan"] },
    { value: "th", keys: ["ostegun", "ostegunetan"] },
    { value: "fr", keys: ["ostiral", "ostiraletan"] },
    { value: "sa", keys: ["larunbat", "larunbatetan"] },
    { value: "su", keys: ["igande", "igandetan"] },
  ];

  // Check for specific days
  for (const day of dayPatterns) {
    if (day.keys.some((key) => text.includes(key))) {
      rrule.push(day.value);
      break;
    }
  }

  // 3. Identify Week of Month (e.g., "2. astea")
  const weekMatch = text.match(/(\d)\.?\s*astea/);
  if (weekMatch) {
    rrule.push(`week${weekMatch[1]}`);
  }

  // 4. Fallback/Special keywords
  if (text.includes("hilero") || text.includes("hilabete")) {
    rrule.push("monthly");
  } else if (text.includes("urtero")) {
    rrule.push("yearly");
  } else if (text.includes("bi astean behin")) {
    rrule.push("biweekly");
  } else if (text.includes("astelehenetik ostiralera")) {
    rrule.push("mo,tu,we,th,fr");
  }

  return { time, rrule };
}

async function migrateMarkdown(directory) {
  // 1. Find all .md files (including subdirectories)
  const files = await fg(`${directory}/**/*.md`);

  const ekitaldiak = [];
  const mezak = [];

  files.forEach((filePath) => {
    // 2. Read file content
    const fileContent = fs.readFileSync(filePath, "utf-8");

    if (fileContent.sections) return;

    // 3. Parse front matter
    const { data, content } = matter(fileContent);

    const updatedData = {
      image: data.image,
      title: capitalizeFirstLetter(data.title),
      tags: [data.valley || ""],
      sections: [
        {
          _block: "video",
          title: capitalizeFirstLetter(data.title) + " ezagutu",
          links: ["https://www.youtube.com/watch?v=" + data.video || ""],
        },
        {
          _block: "gallery",
          list: data.gallery || [],
        },
        {
          _block: "video-channel",
          title: "Azken ospakizunak",
          filter: data.title,
        },
      ],
    };

    for (var i = 0; i < data.locations?.length || 0; i++) {
      updatedData.sections.push({
        _block: "map",
        title: "Non gaude",
        name: data.locations[i].name,
        geo: data.locations[i].geo,
        tags: [...(i !== 0 ? ["hidden"] : [])], // Spreads ['hidden'] if true, nothing if false
      });
    }

    for (var i = 0; i < data.ekitaldiak?.length; i++) {
      const ekitaldia = data.ekitaldiak[i];
      ekitaldiak.push({
        title: ekitaldia.title,
        date: ekitaldia.date?.split(" ")[0],
        image: ekitaldia.image,
        notes: ekitaldia.notes,
        custom: [
          {
            location: [data.title],
            times: ekitaldia.date?.split(" ")[1],
          },
        ],
      });
    }

    for (var i = 0; i < data.mezak?.length; i++) {
      const meza = data.mezak[i];
      mezak.push({
        title: "Misa",
        location: [capitalizeFirstLetter(data.title)],
        times: parseBasqueSchedule(meza.date || "").time,
        rrule: parseBasqueSchedule(meza.date || "").rrule,
        exceptions: [meza.cancelled],
        notes: meza.notes,
        language: meza.language,
      });
    }

    // 5. Stringify back to Markdown format
    console.log(content, updatedData, updatedData.video);
    const newContent = matter.stringify(content || "", updatedData);

    // 6. Save back to disk
    const newPath = filePath.replace("/home/miguel/Tech/47herri-old/herriak/", "./pages/");
    fs.writeFileSync(newPath, newContent, "utf-8");

    console.log(`Updated: ${filePath} -> ${newPath}`);
  });

  const events = JSON.stringify({ "events-feast": ekitaldiak, "events-mass": mezak });
  //fs.writeFileSync("./pages/events.json", events, "utf-8");
}

migrateMarkdown("/home/miguel/Tech/47herri-old/herriak/"); // Path to your markdown folder
