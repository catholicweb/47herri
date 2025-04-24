import fetch from 'node-fetch';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;
import fs from 'fs'; // Importar el módulo de sistema de archivos


const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

async function fetchCors(url, bypass) {
    if (bypass) {
        let response = await fetch(url, { referrerPolicy: "no-referrer", cache: "force-cache" });
        return response.text()
    } else {
        let response = await fetch(`https://arrietaeguren.es/cors?url=${encodeURIComponent(url)}`, { referrerPolicy: "no-referrer", cache: "force-cache" });
        return response.text()
    }
}

function extract(elem) {
    if (!elem) return ''
    return elem.innerHTML.replace(/<p>|<\/p>|<br>/g, '\n').replace(/<span .+?>|<\/span>|<p .+?>|\t/g, '').replace(/\n\n+/g, '\n\n')
}

function scraper(source, map, area = '', data = {}) {
    let doc = new JSDOM(source);
    doc = doc.window.document
    //doc = parser.parseFromString(source, 'text/html');
    for (let [key, value] of Object.entries(map)) {
        data[key] = extract(doc.querySelector(area + ' ' + value))
    }
    return data
}


function parseBibleCom(htmlString) {
    let doc = new JSDOM(htmlString);
    doc = doc.window.document
    //const doc = parser.parseFromString(htmlString, 'text/html');
    const verses = {};
    doc.querySelectorAll('.verse').forEach(verse => {
        // Busca la clase que coincide con "v" seguido de dígitos
        const verseKey = Array.from(verse.classList).find(cls => /^v\d+$/.test(cls));
        if (verseKey) {
            let text = '';
            verse.querySelectorAll('.content').forEach(el => {
                text += el.textContent.trim() + ' ';
            });
            text = text.trim();
            // Si ya existe un contenido para ese verso, lo concatenamos
            verses[verseKey] = verses[verseKey] ? verses[verseKey] + '\n ' + text : text;
        }
    });
    return verses
}



async function fetchBibleCom(version, reference) {
    const { book, chapter, verses } = parseReference(reference);
    const verseNums = Array.isArray(verses[0]) ? verses.flat() : verses;
    version = version.split(':')
    let source = await fetchCors(`https://www.bible.com/_next/data/NSe_168GcWF7M6ZbZ1-Jv/en/audio-bible/${version[1] || '56'}/${book}.${chapter}.${version[0]}.json?versionId=${version[1] || '56'}&usfm=${book}.${chapter}.${version[0]}`)
    source = JSON.parse(source).pageProps.chapterInfo.content
    let chapterVerses = parseBibleCom(source)
    const verseTexts = verseNums.map(verse => chapterVerses['v' + verse]).join(' ').replace(/ +\./g, '.')
    return verseTexts;
}







async function fetchBizkeliza(date) {
    let formattedDate = date.toISOString().split('T')[0].split('-').reverse().join('-');
    console.log('fetchBizkeliza', formattedDate)

    let source = await fetchCors(`https://bizkeliza.org/eu/ebanjelizazinoa/liturgia/ebenjelioa-eta-irakurgaiak/?d=${formattedDate}`)

    let readings = scraper(source, {
        evangelio: 'div:nth-last-of-type(1)',
        salmo: 'div:nth-last-of-type(2)',
        primera: 'div:nth-last-of-type(4)',
        segunda: 'div:nth-last-of-type(3)',
    }, '.evangelio-textos-content')



    if (!readings.primera) {
        readings.primera = readings.segunda
        delete readings.segunda
    }
    let ref = { date: formattedDate }
    /*if (readings.primera) ref.primera = readings.primera.split('\n').filter(Boolean)[2]
    if (readings.salmo) ref.salmo = readings.salmo.split('\n').filter(Boolean)[0]
    if (readings.segunda) ref.segunda = readings.segunda.split('\n').filter(Boolean)[2]*/

    if (readings.evangelio) {
        ref.evangelio = readings.evangelio.split('\n').filter(Boolean)[2].trim().replace('', '–')
        if (ref.evangelio.length > 30 || ref.evangelio.length == 0) ref.evangelio = readings.evangelio.split('\n').filter(Boolean)[1].trim().replace('', '–')
        if (ref.evangelio.length > 30 || ref.evangelio.length == 0) ref.evangelio = readings.evangelio.split('\n').filter(Boolean)[3].trim().replace('', '–')
    }


    console.log(ref)
    return { ref, readings }
}






let bibleApp = {
    readings: {},
    ref: {},
    date: new Date(),
    lang: 'eu',
    changeDate: function(diff) {
        this.date.setDate(this.date.getDate() + diff)
        this.fetchReference(this.date)
    },
    tr_test: 1,
    fetchTranslation: async function(lang) {
        let translations = {
            ar: '%25D8%25AC%25D8%25B2%25D8%25A7%25D8%25A6%25D8%25B1%25D9%258A:3193', // arabic
            eu: 'EABD:223', // euskara
            fr: 'PDV2017:133', // french
            es: 'CEE', //BTI:214',
            en: 'NRSV-CI:2015', // english
            it: 'ICL00D:1196', // italian
            ro: 'BINT09:1506', //romana
            pt: 'BPT09DC:228', // portugues
            ca: 'BCI:335', // catalan
            de: 'SCH2000:157', // deutsch
            bg: '%25D0%25A1%25D0%2598:1558' // bulgarian
        }
        lang = Object.keys(translations)[this.tr_test % 9]
        if (lang == 'es') {
            const { book, chapter, verses } = parseReference(this.ref.evangelio);
            const verseNums = Array.isArray(verses[0]) ? verses.flat() : verses;
            let gospel = await fetch('/assets/gospel.json')
            gospel = await gospel.json()
            this.readings = {}
            this.readings.evangelio = verseNums.map(verse => gospel[book][chapter - 1].versiculos[verse - 1]).join(' ').replace(/ +\./g, '.')
        } else {
            console.log(lang, translations[lang])
            let evangelio = await fetchBibleCom(translations[lang], this.ref.evangelio)
            this.readings = { evangelio: evangelio }
        }
    },
    fetchReference: async function(date) {
        if (!date) date = this.date
        let data = await fetchBizkeliza(date)
        this.ref = data.ref
        this.ref.date = this.date.toLocaleDateString('en-GB')
        this.readings = data.readings
        this.fetchTranslation(this.lang)

    }
}




async function saveResults() {
    // Start date: March 26, 2025
    const results = JSON.parse(fs.readFileSync('ref.json', 'utf8') || '{}') || {};
    const startDate = new Date(); // Month is 0-indexed in JavaScript, so March is month 2

    // Iterate over the next XYZ days
    for (let i = -10; i < 200; i++) {
        // Calculate the date
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        // Format the date in the format yyyy-mm-dd
        const formattedDate = currentDate.toISOString().split('T')[0];


        if (results[formattedDate]) continue

        // Call the fetchBizaky function with the current date
        const result = await fetchBizkeliza(currentDate);


        // Store the result in the results object
        results[formattedDate] = result.ref.evangelio || '';

        // Write the results to ref.json
        fs.writeFileSync('ref.json', JSON.stringify(results, null, 2));
    }

    console.log('Results saved to ref.json');
}


async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function downloadGospels(argument) {
    // List of languages
    const languages = {
        eu: 'EABD:223', // euskara
        fr: 'PDV2017:133', // french
        //es: 'CEE', //BTI:214',
        ar: '%25D8%25AC%25D8%25B2%25D8%25A7%25D8%25A6%25D8%25B1%25D9%258A:3193', // arabic
        en: 'NRSV-CI:2015', // english
        it: 'ICL00D:1196', // italian
        ro: 'BINT09:1506', //romana
        pt: 'BPT09DC:228', // portugues
        ca: 'BCI:335', // catalan
        de: 'SCH2000:157', // deutsch
        bg: '%25D0%25A1%25D0%2598:1558' // bulgarian
    }

    // Define the number of chapters for each Gospel
    const gospels = {
        MAT: 28,
        MRK: 16,
        LUK: 24,
        JHN: 21
    };

    let code = '-IvGWn6Vzc1148Q7y0yUf'
    // Iterate over the languages, gospels, and chapters
    for (const tr in languages) {
        for (const book in gospels) {
            const numChapters = gospels[book];
            for (let chapter = 1; chapter <= numChapters; chapter++) {
                let filename = `${tr}-${book}-${chapter}.json`
                console.log(filename)
                if (fs.existsSync(filename)) continue
                let version = languages[tr].split(':')
                let source = await fetchCors(`https://www.bible.com/_next/data/${code}/en/audio-bible/${version[1] || '56'}/${book}.${chapter}.${version[0]}.json?versionId=${version[1] || '56'}&usfm=${book}.${chapter}.${version[0]}`).catch(err => console.error(err))
                source = JSON.parse(source).pageProps.chapterInfo.content
                let chapterVerses = parseBibleCom(source)
                chapterVerses.source = `https://www.bible.com/bible/${version[1]}/${book}.${chapter}.${version[0]}`
                console.log(chapterVerses)
                // Write the results to file
                fs.writeFileSync(filename, JSON.stringify(chapterVerses, null, 2));
                await delay(500);
            }
        }
    }
}



// Function to split the JSON data and write output files
function splitJsonData() {
    const data = fs.readFileSync('../gospel.json', 'utf8');
    let inputData = JSON.parse(data);
    // Iterate through each book and its chapters
    for (const book in inputData) {
        inputData[book].forEach(chapter => {
            // Reformat the 'versiculos' array into an object
            const formattedVersiculos = {};
            chapter.versiculos.forEach((verse, index) => {
                formattedVersiculos[`v${index + 1}`] = verse;
            });

            // Create the output file name
            const fileName = `es-${book}-${chapter.capitulo}.json`;

            // Create the new chapter object with reformatted versiculos
            let map = { MAT: 'mateo', LUK: 'lucas', JHN: 'juan', MRK: 'marcos' }
            formattedVersiculos.source = `https://www.conferenciaepiscopal.es/biblia/${map[book]}/#cap${chapter.capitulo}`

            // Write the new chapter to a file
            fs.writeFileSync(fileName, JSON.stringify(formattedVersiculos, null, 2));
            console.log(`File written: ${fileName}`);
        });
    }
}


splitJsonData()

// Run the function
//saveResults().catch(err => console.error(err));

// Run the function

//downloadGospels().catch(err => console.error(err));