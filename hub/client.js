"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.clients = void 0;
exports.clients = new Map();
class Client {
    constructor(...args) {
        // tested by heartbeat
        this.alive = true;
        [this.ws, this.uid, this.info] = args;
        exports.clients.set(this.uid, this);
    }
    get closed() {
        return this.ws.readyState === this.ws.CLOSED;
    }
    send(tag, msg) {
        this.ws.send(tag + (msg ? ':' + msg : ''));
    }
    remove() {
        if (exports.clients.get(this.uid) === this) {
            exports.clients.delete(this.uid);
        }
    }
}
exports.Client = Client;
