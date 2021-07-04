"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
class Client {
    constructor(ws, uid, info) {
        // tested by heartbeat
        this.alive = true;
        this.ws = ws;
        this.uid = uid;
        this.info = info;
    }
}
exports.Client = Client;
