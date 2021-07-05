"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const fs_1 = require("fs");
const https_1 = require("https");
const client_1 = require("./client");
const owner_1 = require("./owner");
const member_1 = require("./member");
const server = https_1.createServer({
    cert: fs_1.readFileSync('cert.pem'),
    key: fs_1.readFileSync('key.pem'),
});
const wss = new ws_1.Server({ server });
wss.on('connection', ws => {
    let uid = null;
    ws.on('message', (msg) => {
        try {
            if (uid) {
                const idx = msg.indexOf(':');
                const method = msg.slice(0, idx);
                const arg = msg.slice(idx + 1);
                client_1.clients.get(uid)[method](arg);
            }
            else {
                if (msg.startsWith('init:')) {
                    let info, room;
                    [uid, info, room] = JSON.parse(msg.slice(5));
                    if (uid && info && typeof uid === 'string') {
                        const old = client_1.clients.get(uid) ?? null;
                        old?.ws?.close(1000, 'replace');
                        if (room) {
                            (new owner_1.Owner(ws, uid, info)).init(old, room);
                        }
                        else {
                            (new member_1.Member(ws, uid, info)).init(old);
                        }
                        return;
                    }
                }
                throw (new Error('client not initialized'));
            }
        }
        catch (e) {
            ws.close(1002, e.toString());
        }
    });
    ws.on('close', () => {
        try {
            client_1.clients.get(uid)?.uninit();
        }
        catch { }
    });
    setTimeout(() => {
        if (!uid) {
            ws.close(1002, 'init');
        }
    }, 10000);
    ws.on('pong', () => {
        const client = client_1.clients.get(uid);
        if (client) {
            client.alive = true;
        }
    });
});
setInterval(() => {
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
