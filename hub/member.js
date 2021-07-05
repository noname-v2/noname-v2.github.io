"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Member = void 0;
const client_1 = require("./client");
class Member extends client_1.Client {
    init(old) {
        if (old instanceof Member) {
        }
        else if (old) {
        }
    }
    uninit() {
    }
}
exports.Member = Member;
