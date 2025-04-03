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



async function saveVideosToFile(videos, file) {
    fs.writeFile(file, JSON.stringify(videos), (err) => {
        if (err) {
            console.error('Error al guardar el archivo:', err);
        } else {
            console.log('Videos guardados en ', file);
        }
    });
}

(async () => {
    try {
        const playlistId = await getUploadsPlaylistId();
        const videos = await getVideos(playlistId);
        await saveVideosToFile(videos, 'assets/videos.json'); // Guardar el resultado en un archivo

        const playlists = await getAllPlaylistId()
        let kantak = []
        for (var i = 0; i < playlists.length; i++) {
            if (!playlists[i].title.includes('MEZAKO KANTAK')) continue
            console.log(playlists[i].title, playlists[i].title.split('.')[1])
            let g = await getVideos(playlists[i].playlistId)
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