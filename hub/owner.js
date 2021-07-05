"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Owner = void 0;
const client_1 = require("./client");
class Owner extends client_1.Client {
    constructor() {
        super(...arguments);
        /** IDs of room members. */
        this.members = new Set();
    }
    init(old) {
        if (old instanceof Owner) {
        }
        else if (old) {
        }
    }
    uninit() {
    }
}
exports.Owner = Owner;
