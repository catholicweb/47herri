import fs from 'fs'
import vm from 'vm'

// 1. Read the HTML file
const html = fs.readFileSync('_includes/events.html', 'utf8');
const raw_site = fs.readFileSync('_site/assets/site.json', 'utf8');

let site = JSON.parse(raw_site)

// 2. Extract <script> content using regex
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match;
let fullScript = '';

while ((match = scriptRegex.exec(html)) !== null) {
    fullScript += match[1] + '\n';
}

// 3. Set up a shared context to capture functions
const context = { window: {}, vueApp: {} };
vm.createContext(context); // sandbox

// 4. Run the script in that context
const script = new vm.Script(fullScript);
script.runInContext(context);

// 5. Now you can call functions declared in the script
let events = context.buildEvents(site.pages)

let ordering = ['type']
let filter = /hiletak|ekitaldiak|aitortzaren/i
events = events.filter(event => filter.test(JSON.stringify(event)));


context.vueApp.parseDateToISO = function(dateStr) {
    let [day, month, year] = dateStr.split("/").map(num => parseInt(num, 10));
    let now = new Date();
    let eventDate = new Date(year || now.getFullYear(), month - 1, day);
    if (!year && eventDate < now) eventDate.setFullYear(eventDate.getFullYear() + 1);
    return eventDate.toISOString();
}

function isTomorrow(date) {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const input = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return input.getTime() === tomorrow.getTime();
}

const getDateTime = event => new Date(`${(event.dates[0] || '9999-12-31').split("T")[0]}T${event.times[0] || '00:00'}:00Z`);
events = events
    .map(event => ({
        ...event,
        dates: event.dates.map(context.vueApp.parseDateToISO) // Convert dates
    }))
    .filter(event => !event.dates.length || event.dates.some(date => isTomorrow(new Date(date))))
    .sort((a, b) => getDateTime(a) - getDateTime(b))

let mappers = context.getMappers()

const mappingFns = ordering.map(fnc => mappers[fnc])
let notify = context.groupEvents(events, mappingFns);

let notifications = Object.keys(notify).map(title => {
    let body = ''
    let image = ''
    for (var i = 0; i < notify[title].length; i++) {
        body += notify[title][i].times[0] + ' - ' + notify[title][i].location + '\n'
        if (!image) image = notify[title][i].image
    }
    return {
        title: title,
        options: {
            body: body,
            icon: image
        }
    }
})

fs.writeFileSync('notifications.json', JSON.stringify(notifications));