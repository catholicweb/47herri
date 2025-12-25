// dataExporter.js
import ICAL from "ical.js";
import { read, write } from "./node_utils.js";

function exportCalendar(events) {
  // TODO: export also as ICS
  write("./docs/public/calendar.json", events);
}

function intersectOptions(options, field) {
  options = options.join(",").toUpperCase().split(",");
  const validValues = {
    FREQ: ["YEARLY", "MONTHLY", "WEEKLY", "DAILY", "HOURLY", "MINUTELY", "SECONDLY"],
    BYDAY: ["MO", "TU", "WE", "TH", "FR", "SA", "SU", "1MO", "-1FR" /* etc */],
    BYMONTH: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    BYMONTHDAY: Array.from({ length: 31 }, (_, i) => i + 1),
    BYWEEK: ["WEEK1", "WEEK2", "WEEK3", "WEEK4", "WEEK5"],
    // Añade más campos según necesites
  };
  const validSet = new Set(validValues[field]);
  let valid = options.filter((opt) => validSet.has(opt));

  /*if (field == "BYDAY") {
    const weekMatch = options.join(",").match(/WEEK(\d+)/);
    if (!weekMatch) return valid;
    return valid.map((opt) => weekMatch[1] + opt);
  }*/
  if (field == "FREQ" && !valid.length) {
    const weekMatch = options.join(",").match(/WEEK(\d+)/);
    if (weekMatch) return ["MONTHLY"];

    const validBYDAYS = new Set(validValues["BYDAY"]);
    let byday = options.filter((opt) => validBYDAYS.has(opt));
    if (byday.length) return ["WEEKLY"];
  }
  return valid;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}

function parseDateToISO(dateStr) {
  return dateStr.split("/").toReversed().join("-");
}

export async function fetchCalendar() {
  let input = read("./pages/events.json");
  const events = [];

  Object.keys(input).forEach((key) => {
    if (!key.startsWith("events")) return;
    console.log("Parsing ", key, input[key]?.length);
    for (var i = 0; i < input[key].length; i++) {
      const def = input[key][i];
      const custom = def.custom || [{}];
      // Iterate over each custom sub-item
      for (var j = 0; j < custom.length; j++) {
        const e = { ...def, ...custom[j] };
        const type = key.split("-")[1];
        // Filter out past events
        let dates = toArray(e.date).map((d) => parseDateToISO(d));
        if (dates.length) {
          const now = new Date();
          now.setHours(0, 0, 0, 0); // Our "date" value includes no time (so it is 00.00 by default) while "now" has the current time by default
          dates = dates.filter((date) => new Date(date) >= now);
        }
        if (!dates?.length && !e.rrule?.length) {
          continue;
        }
        events.push({
          type: type,
          title: e.title || e.summary || "",
          times: toArray(e.times),
          dates: dates,
          rrule: toArray(e.rrule).map((r) => r.toUpperCase()),
          images: toArray(e.image || input.default?.[type]?.image),
          byday: intersectOptions(toArray(e.rrule), "BYDAY"),
          byweek: intersectOptions(toArray(e.rrule), "BYWEEK"),
          freq: intersectOptions(toArray(e.rrule), "FREQ"),
          notes: toArray(e.notes || input.default?.[type]?.notes),
          language: e.language,
          end: "",
          locations: toArray(e.location),
          exceptions: toArray(e.except),
        });
      }
    }
  });

  for (var i = 0; i < input.urls?.length; i++) {
    const url = input.urls[i];
    try {
      const res = await fetch(url);
      const text = await res.text();
      const jcalData = ICAL.parse(text);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents("vevent");

      const oneOffEvents = [];

      vevents.forEach((eventComp, index) => {
        const event = new ICAL.Event(eventComp);
        const attach = event.component.getFirstProperty("attach");
        const image = attach?.getParameter("FMTTYPE") || null;

        if (event.isRecurring()) {
          // Get the recurrence rule
          const rruleProp = event.component.getFirstProperty("rrule");
          const rrule = rruleProp ? rruleProp.getFirstValue() : null;

          // Get exception dates
          const exdates = event.component.getAllProperties("exdate").map((p) => {
            const val = p.getFirstValue();
            return val.toJSDate();
          });

          events.push({
            type: "ics",
            title: event.summary || "",
            times: toArray(event.startDate.toJSDate().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })),
            dates: toArray(event.startDate.toJSDate().toLocaleDateString("es-ES")),
            end: event.endDate.toJSDate(),
            images: toArray(image),
            locations: toArray(event.location),
            ...JSON.parse(JSON.stringify(rrule)),
            exceptions: toArray(exdates),
          });
        } else {
          const now = ICAL.Time.now();
          const isPast = event.endDate ? event.endDate.compare(now) < 50 : false;

          if (isPast) return;
          events.push({
            title: event.summary || "",
            times: toArray(event.startDate.toJSDate().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })),
            dates: toArray(toevent.startDate.toJSDate().toLocaleDateString("es-ES")),
            images: toArray(image),
            byday: [],
            freq: ["oneoff"],
            end: event.endDate.toJSDate(),
            locations: toArray(event.location),
            exceptions: [],
          });
        }
      });
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }
  function comp(a, b, key, def = "") {
    return (a[key]?.[0] || def).localeCompare(b[key]?.[0] || def);
  }
  const sorted = events.toSorted((a, b) => comp(a, b, "dates") || comp(a, b, "times") || comp(a, b, "byweek") || comp(a, b, "title"));
  exportCalendar(sorted);
  console.log("Events parsed ", sorted?.length);
  return { sorted };
}
