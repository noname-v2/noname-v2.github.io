"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.clients = void 0;
exports.clients = new Map();
class Client {
    constructor(...args) {
        // tested by heartbeat
        this.alive = true;
        [this.ws, this.uid, this.info] = args;
    }
    send(tag, msg, stringify = false) {
        this.ws.send(tag + ':' + (stringify ? JSON.stringify(msg) : msg));
    }
}
exports.Client = Client;
