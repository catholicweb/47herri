import fetch from 'node-fetch';
import fs from 'fs'; // Importar el módulo de sistema de archivos

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

async function getVideos(playlistId, pageToken = '') {
    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) return [];

    const videos = data.items.map(item => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt
    }));

    if (data.nextPageToken) {
        return videos.concat(await getVideos(playlistId, data.nextPageToken));
    }

    return videos;
}



async function saveVideosToFile(videos) {
    fs.writeFile('assets/videos.json', JSON.stringify(videos, null, 2), (err) => {
        if (err) {
            console.error('Error al guardar el archivo:', err);
        } else {
            console.log('Videos guardados en assets/videos.json');
        }
    });
}

(async () => {
    try {
        const playlistId = await getUploadsPlaylistId();
        const videos = await getVideos(playlistId);
        await saveVideosToFile(videos); // Guardar el resultado en un archivo
        console.log('Lista de vídeos:', videos);
    } catch (error) {
        console.error('Error:', error.message);
    }
})();