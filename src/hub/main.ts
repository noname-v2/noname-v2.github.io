import { Server } from 'ws';
import { readFileSync } from 'fs';
import { createServer } from 'https';
import { clients } from './client';
import { Owner } from './owner';
import { Member } from './member';

const server = createServer({
    cert: readFileSync('cert.pem'),
    key: readFileSync('key.pem'),
});

const wss = new Server({server});
wss.on('connection', ws => {
    let uid: string | null = null;
    ws.on('message', (msg: string) => {
        try {
            if (uid) {
                const idx = msg.indexOf(':');
                const method = msg.slice(0, idx);
                const arg = msg.slice(idx + 1);
                (clients.get(uid) as any)[method](arg);
            }
            else {
                if (msg.startsWith('init:')) {
                    let info: any, room: any;
                    [uid, info, room] = JSON.parse(msg.slice(5));

                    if (uid && info && typeof uid === 'string') {
                        const old = clients.get(uid) ?? null;
                        old?.ws?.close(1000, 'replace');
                        if (room) {
                            (new Owner(ws, uid, info)).init(old, room);
                        }
                        else {
                            (new Member(ws, uid, info)).init(old);
                        }
                        return;
                    }
                }
                throw(new Error('client not initialized'));
            }
        }
        catch (e) {
            ws.close(1002, e.toString());
        }
    });

    ws.on('close', () => {
        try {
            clients.get(uid)?.uninit();
        }
        catch {}
    });

    setTimeout(() => {
        if (!uid) {
            ws.close(1002, 'init');
        }
    }, 10000);

    ws.on('pong', () => {
        const client = clients.get(uid);
        if (client) {
            client.alive = true;
        }
    });
});

setInterval(() => {
    for (const client of clients.values()) {
        try {
            if (client.alive === false) {
                client.ws.close(1001, 'heartbeat');
            }
            else {
                client.alive = false;
                client.ws.ping();
            }
        }
        catch {}
    }
}, 3000);

server.listen(8080);