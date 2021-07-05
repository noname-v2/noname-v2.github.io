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
                client_1.clients.get(uid).dispatch(msg);
            }
            else {
                if (msg.startsWith('init:')) {
                    let info, room;
                    [uid, info, room] = JSON.parse(msg.slice(5));
                    if (uid && info && typeof uid === 'string') {
                        const old = client_1.clients.get(uid) ?? null;
                        old?.ws?.close(1000, 'replace');
                        const client = new (room ? owner_1.Owner : member_1.Member)(ws, uid, info);
                        if (room) {
                            client.room = room;
                        }
                        client_1.clients.set(uid, client);
                        client.init(old);
                        return;
                    }
                }
                throw ('');
            }
        }
        catch {
            ws.close(1002, 'error');
        }
    });
    ws.on('close', () => {
        try {
            client_1.clients.get(uid)?.uninit();
            client_1.clients.delete(uid);
        }
        catch { }
    });
    ws.on('pong', () => {
        client_1.clients.get(uid)?.alive = true;
    });
});
server.listen(8080);
