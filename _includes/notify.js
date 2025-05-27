// notify.js
const webpush = require('web-push');
const fs = require('fs/promises');
const fetch = require('node-fetch');

const NOTIF_TOKEN = process.env.NOTIF_TOKEN;

async function main() {
    const subsRes = await fetch(`https://arrietaeguren.es/subscriptions?token=${NOTIF_TOKEN}`);
    const subs = (await subsRes.json()).slice(0, 1);

    const notificationsData = await fs.readFile('./notifications.json', 'utf-8');
    const notifications = JSON.parse(notificationsData);

    webpush.setVapidDetails(
        'mailto:admin@47herri.eus',
        process.env.VAPID_PUBLIC,
        process.env.VAPID_PRIVATE
    );

    for (const not of notifications) {
        for (const sub of subs) {
            try {
                await webpush.sendNotification(sub, JSON.stringify(not));
            } catch (err) {
                console.error('Error con suscripción:', err);
            }
        }
    }

    await fs.rm('./notifications.json');
}

main().catch(err => {
    console.error('Fallo general:', err);
    process.exit(1);
});