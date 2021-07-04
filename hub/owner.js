"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Owner = void 0;
const client_1 = require("./client");
class Owner extends client_1.Client {
    constructor(room, ...args) {
        super(...args);
        /** IDs of room members. */
        this.members = new Set();
        this.room = room;
    }
}
exports.Owner = Owner;
