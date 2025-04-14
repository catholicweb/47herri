import fetch from 'node-fetch';
import fs from 'fs/promises';

const API_KEY = process.env.YT_API_KEY; // Leer API Key de env
const CHANNEL_ID = 'UCB6hZ1l2VYWu955Fz09Ouzw'; // Reemplázalo por el ID del canal

if (!API_KEY) {
    console.error('Error: La API Key no está definida. Asegúrate de exportarla.');
    process.exit(1);
}
console.log('Fetching videos...')

async function getUploadsPlaylistId() {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error('No se encontró el canal.');
    }


    return data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function getAllPlaylistId(pageToken = '') {
    let url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&key=${API_KEY}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) return [];
    const playlist = data.items.map(item => ({
        playlistId: item.id,
        title: item.snippet.title
    }));

    if (data.nextPageToken) {
        return playlist.concat(await getAllPlaylistId(data.nextPageToken));
    }


    return playlist
}

// Función para obtener vídeos de una página de la playlist y detenerse si se encuentra un vídeo ya en la caché
async function getNewVideos(playlistId, cachedIds, pageToken = '') {
    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=200&key=${API_KEY}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const response = await fetch(url);
    const data = await response.json();
    if (!data.items) return { newVideos: [], nextPageToken: null };

    let newVideos = [];
    for (const item of data.items) {
        const video = {
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt
        };
        // Si el vídeo ya existe en caché, se asume que el resto ya se descargó previamente.
        if (cachedIds.has(video.videoId)) {
            return { newVideos, nextPageToken: null };
        }
        newVideos.push(video);
    }
    return { newVideos, nextPageToken: data.nextPageToken || null };
}


// Función de actualización que realiza llamadas de forma iterativa
async function updateVideos(playlistId, cachedVideos) {
    // Usamos un Set con los IDs ya guardados para búsqueda rápida
    const cachedIds = new Set(cachedVideos.map(v => v.videoId));
    let allNewVideos = [];
    let pageToken = '';
    let stop = false;

    while (!stop) {
        const { newVideos, nextPageToken } = await getNewVideos(playlistId, cachedIds, pageToken);
        allNewVideos = allNewVideos.concat(newVideos);
        if (!nextPageToken) stop = true;
        else pageToken = nextPageToken;
    }
    // Como los nuevos vídeos vienen primero, los concatenamos delante
    return [...allNewVideos, ...cachedVideos];
}



async function loadCachedVideos(file) {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        // Si no existe o error al leer, se asume caché vacía
        return [];
    }
}

// Guarda la lista de vídeos en el fichero
async function saveVideosToFile(videos, file) {
    try {
        await fs.writeFile(file, JSON.stringify(videos));
        console.log(`Vídeos guardados en ${file}`);
    } catch (err) {
        console.error('Error al guardar el archivo:', err);
    }
}

(async () => {
    try {
        const playlistId = await getUploadsPlaylistId();

        let cachedVideos = await loadCachedVideos('assets/videos.json')
        const videos = await updateVideos(playlistId, cachedVideos);
        await saveVideosToFile(videos, 'assets/videos.json'); // Guardar el resultado en un archivo

        const playlists = await getAllPlaylistId()
        let kantak = []
        for (var i = 0; i < playlists.length; i++) {
            if (!playlists[i].title.includes('MEZAKO KANTAK')) continue
            console.log(playlists[i].title, playlists[i].title.split('.')[1])
            let g = await updateVideos(playlists[i].playlistId, []);
            g = g.map(item => {
                return { ...item, playlist: playlists[i].title.split('.')[1] }; // Add key-value pair
            });
            kantak = kantak.concat(g)
        }
        await saveVideosToFile(kantak, 'assets/kantak.json'); // Guardar el resultado en un archivo
        //console.log('Lista de vídeos:', videos);
    } catch (error) {
        console.error('Error:', error.message);
    }
})();