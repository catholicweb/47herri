// notify.js
import webpush from 'web-push';
import fs from 'fs/promises';
import fetch from 'node-fetch';

const NOTIF_TOKEN = process.env.NOTIF_TOKEN;

async function main() {
    const subsRes = await fetch(`https://arrietaeguren.es/subscriptions?token=${NOTIF_TOKEN}&test=true`);
    let subs = await subsRes.json()

    if (subs.length > 1) return

    let notifications;
    try {
        notifications = JSON.parse(await fs.readFile('./notifications.json', 'utf-8'));
    } catch (err) {
        return
    }

    webpush.setVapidDetails(
        'mailto:admin@47herri.eus',
        process.env.VAPID_PUBLIC,
        process.env.VAPID_PRIVATE
    );

    for (const not of notifications) {
        console.log(not)
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