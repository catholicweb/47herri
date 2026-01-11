import { read, write } from "./node_utils.js";
import { slugify } from "./utils.js";
const config = read("./pages/config.json");

export function getJSONLD(fm, config, path) {
  const locations = getLocations(fm, config, path);
  const eventNodes = events2JSONLD(fm, config, path);
  return [
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [...locations, ...eventNodes],
      }),
    ],
  ];
}

function getOrg(config) {
  const baseUrl = config.dev?.siteurl;
  return {
    "@type": "Organization",
    url: config.dev?.siteurl,
    sameAs: config.social,
    logo: config.dev?.siteurl + "/icon-512.png",
    name: config.title,
    description: config.description,
    image: baseUrl + "/" + config.image,
    telephone: config.collaborators?.[0]?.phone,
    email: config.collaborators?.[0]?.email,
    address: {
      "@type": "PostalAddress",
      //streetAddress: "Rue Improbable 99",
      //addressLocality: "Paris",
      postalCode: config.zip,
      addressRegion: config.region || "Navarra",
      addressCountry: config.region || "ES",
    },
    //vatID: "FR12345678901",
    //iso6523Code: "0199:724500PMK2A2M1SQQ228",
  };
}

function getLocations(data, config, path) {
  const events = data.events || [];
  const baseUrl = config.dev?.siteurl;
  const graph = [];
  if (path.includes("index")) graph.push(getOrg(config));
  //const uniqueLocations = [...new Set(events.flatMap(e => e.locations))].map(n => );
  data?.sections?.forEach((section) => {
    if (section._block === "map") {
      const details = {};
      const [latitude, longitude] = section.geo?.split(",").map((s) => Number(s.trim())) || [];
      if (!longitude) return;
      graph.push({
        "@type": "Place",
        "@id": getID(baseUrl, path, graph.length ? section.name : undefined), // first location is the main one
        name: section.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: section.street,
          addressLocality: data.title,
          postalCode: section.zip || config.zip,
          addressRegion: config.region || "Navarra",
          addressCountry: config.region || "ES",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: latitude,
          longitude: longitude,
        },
        image: baseUrl + (section.image || data.image || config.image),
        telephone: config.collaborators?.[0]?.phone,
        email: config.collaborators?.[0]?.email,
        url: getID(baseUrl, path),
      });
    }
  });
  return graph;
}

/**
 * Transforms frontmatter events into a JSON-LD @graph.
 * ...
 */
function events2JSONLD(data, config, path) {
  const events = data.events || [];

  const baseUrl = config.dev?.siteurl;
  const now = new Date();
  const eventsHorizon = new Date();
  eventsHorizon.setDate(now.getDate() + 60);

  const dayMap = {
    SU: "Sunday",
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
  };

  const graph = [];
  const graphEvents = [];

  events?.forEach((event, idx) => {
    // 1. Create the Schedule Entry (The "Rule")
    if (event.byday?.length > 0) {
      graph.push({
        "@type": "Schedule",
        "@id": getID(baseUrl, path, event.title),
        name: event.title,
        repeatFrequency: event.byweek?.length > 0 ? "Monthly" : "Weekly",
        byDay: event.byday.map((d) => `https://schema.org/${dayMap[d]}`),
        byWeek: event.byweek?.length ? event.byweek.map((w) => Number(w.replace("WEEK", ""))) : undefined,
        startTime: event.times,
        description: event.notes.join(". ") || undefined,
        location: event.locations.map((loc) => ({ "@id": getID(baseUrl, loc), name: loc, url: getID(baseUrl, loc) })),
      });
    }

    // 2. Create Single Event Instances (The "Occurrences")

    // Logic for Fixed Dates (e.g., San Antón)
    if (event.dates?.length > 0) {
      event.dates?.forEach((dateStr) => {
        event.times?.forEach((time) => {
          graph.push(buildEventInstance(event, dateStr, time, baseUrl, path));
        });
      });
    }

    // Logic for Recurring Dates
    if (event.byday?.length > 0) {
      for (let d = new Date(now); d <= eventsHorizon; d.setDate(d.getDate() + 1)) {
        const dayCode = Object.keys(dayMap).find((key) => dayMap[key] === d.toLocaleDateString("en-US", { weekday: "long" }));

        if (event.byday.includes(dayCode)) {
          // Filter by WEEK3, etc. if applicable
          if (event.byweek && event.byweek.length > 0) {
            const weekOfMonth = Math.ceil(d.getDate() / 7);
            if (!event.byweek.includes(`WEEK${weekOfMonth}`)) continue;
          }

          const dateStr = d.toISOString().split("T")[0];
          event.times?.forEach((time) => {
            graphEvents.push(buildEventInstance(event, dateStr, time, baseUrl, path));
          });
        }
      }
    }
  });

  return [...graph, ...graphEvents.toSorted((a, b) => a.startDate?.localeCompare(b?.startDate)).slice(0, 7)];
}

function getID(baseUrl, path, name) {
  if (!name) return `${baseUrl}/${slugify(path)}`;
  return `${baseUrl}/${slugify(path)}#${slugify(name)}`;
}

function buildEventInstance(event, date, time, baseUrl, path) {
  const typeMapping = {
    mass: "https://www.wikidata.org/wiki/Q132612",
    group: "https://www.wikidata.org/wiki/Q1735729",
    holyHour: "https://www.wikidata.org/wiki/Q5885640",
    funeral: "https://www.wikidata.org/wiki/Q7361870",
  };

  const subid = event.byday?.length ? `-${slugify(date + "-" + time)}` : "";
  return {
    "@type": "Event",
    "@id": getID(baseUrl, path, `${event.title}${subid}`),
    url: getID(baseUrl, path, event.title),
    additionalType: typeMapping[event.type],
    name: event.title,
    //duration: "PT1H",
    startDate: `${date}T${time}`,
    location: event.locations.map((loc) => ({ "@id": getID(baseUrl, loc) })),
    image: event.images ? event.images.map((i) => baseUrl + i) : undefined,
    description: event.notes ? event.notes.join(". ") : undefined,
    eventSchedule: event.byday?.length ? { "@id": getID(baseUrl, path, event.title) } : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    //eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };
}
