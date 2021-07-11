import { Server } from 'ws';
import { readFileSync } from 'fs';
import { createServer } from 'https';
import { clients } from './client';
import { Owner } from './owner';
import { Member } from './member';
import { owner2hub, member2hub, split } from './types';

const server = createServer({
    cert: readFileSync('cert.pem'),
    key: readFileSync('key.pem'),
});

const wss = new Server({server});

/** Send number of clients to idle clients. */
const update = () => {
    for (const client of clients.values()) {
        if (client instanceof Member && client.joined === null) {
            client.send('num', wss.clients.size.toString());
        }
    }
}

wss.on('connection', ws => {
    let uid: string | null = null;
    ws.on('message', (msg: string) => {
        try {
            if (uid) {
                const [method, arg] = split(msg);

                // call owner of member methods
                const client = clients.get(uid);
                if (client?.ws === ws) {
                    if ((client instanceof Owner && owner2hub.includes(method as typeof owner2hub[number])) ||
                        (client instanceof Member && member2hub.includes(method as typeof member2hub[number]))) {
                        client[method](arg);
                    }
                }
            }
            else {
                // create a new client
                if (msg.startsWith('init:')) {
                    let info: any, room: any;
                    [uid, info, room] = JSON.parse(msg.slice(5));

                    if (uid && info && typeof uid === 'string') {
                        const old = clients.get(uid) ?? null;
                        old?.ws?.close(1000, 'replace');
                        if (room) {
                            new Owner(ws, uid, info).init(old, room);
                        }
                        else {
                            new Member(ws, uid, info).init(old);
                        }
                        update();
                        return;
                    }
                }

                // received message without initialization
                throw(new Error('client not initialized'));
            }
        }
        catch (e) {
            ws.close(1002, e.toString());
        }
    });

    ws.on('close', () => {
        // call uninitialization method
        try {
            const client = clients.get(uid);
            if (client?.ws === ws) {
                client.uninit();
            }
            update();
        }
        catch {}
    });

    ws.on('pong', () => {
        // assert that client is alive
        const client = clients.get(uid);
        if (client) {
            client.alive = true;
        }
    });

    setTimeout(() => {
        // close if not initialized within 10s
        if (!uid) {
            ws.close(1002, 'init');
        }
    }, 10000);
});

setInterval(() => {
    // find and remove inactive clients
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