"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const fs_1 = require("fs");
const https_1 = require("https");
const client_1 = require("./client");
const owner_1 = require("./owner");
const member_1 = require("./member");
const types_1 = require("./types");
const server = https_1.createServer({
    cert: fs_1.readFileSync('cert.pem'),
    key: fs_1.readFileSync('key.pem'),
});
const wss = new ws_1.Server({ server });
/** Send number of clients to idle clients. */
const update = () => {
    for (const client of client_1.clients.values()) {
        if (client instanceof member_1.Member && client.joined === null) {
            client.send('num', wss.clients.size.toString());
        }
    }
};
wss.on('connection', ws => {
    let uid = null;
    ws.on('message', (msg) => {
        try {
            if (uid) {
                const idx = msg.indexOf(':');
                const method = msg.slice(0, idx);
                const arg = msg.slice(idx + 1);
                // call owner of member methods
                const client = client_1.clients.get(uid);
                if (client?.ws === ws) {
                    if ((client instanceof owner_1.Owner && types_1.owner2hub.includes(method)) ||
                        (client instanceof member_1.Member && types_1.member2hub.includes(method))) {
                        client[method](arg);
                    }
                }
            }
            else {
                // create a new client
                if (msg.startsWith('init:')) {
                    let info, room;
                    [uid, info, room] = JSON.parse(msg.slice(5));
                    if (uid && info && typeof uid === 'string') {
                        const old = client_1.clients.get(uid) ?? null;
                        old?.ws?.close(1000, 'replace');
                        if (room) {
                            new owner_1.Owner(ws, uid, info).init(old, room);
                        }
                        else {
                            new member_1.Member(ws, uid, info).init(old);
                        }
                        update();
                        return;
                    }
                }
                // received message without initialization
                throw (new Error('client not initialized'));
            }
        }
        catch (e) {
            ws.close(1002, e.toString());
        }
    });
    ws.on('close', () => {
        // call uninitialization method
        try {
            const client = client_1.clients.get(uid);
            if (client?.ws === ws) {
                client.uninit();
            }
            update();
        }
        catch { }
    });
    ws.on('pong', () => {
        // assert that client is alive
        const client = client_1.clients.get(uid);
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
    for (const client of client_1.clients.values()) {
        try {
            if (client.alive === false) {
                client.ws.close(1001, 'heartbeat');
            }
            else {
                client.alive = false;
                client.ws.ping();
            }
        }
        catch { }
    }
}, 3000);
server.listen(8080);
