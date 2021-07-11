"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.split = exports.hub2member = exports.member2hub = exports.hub2owner = exports.owner2hub = void 0;
/** Commands received from Owner.
 * edit: Create or edit room.
 * kick: Remove a client from room.
 * to: Send a message to a client in the room.
 * bcast: Send a message to all clients in the room.
 */
exports.owner2hub = ['edit', 'kick', 'to', 'bcast'];
/** Commands sent to Owner.
 * ready: Room is created.
 * resp: Member yields a result.
 * leave: Member leaves the room.
 * join: Member joins the room.
*/
exports.hub2owner = ['ready', 'resp', 'leave', 'join'];
/** Commands received from Member.
 * join: Join a room.
 * leave: Leave current room.
 * resp: Send to result to owner.
 */
exports.member2hub = ['join', 'leave', 'resp'];
/** Commands sent to Member.
 * down: Owner lost connection.
 * msg: Owner sends a UITick.
 * edit: Room info changes (for idle clients).
 * num: Number of connected clients (for idle clients).
 * reload: Full list of rooms.
*/
exports.hub2member = ['down', 'msg', 'edit', 'reload', 'num'];
/** Split message. */
function split(msg) {
    const idx = msg.indexOf(':');
    return [msg.slice(0, idx), msg.slice(idx + 1)];
}
exports.split = split;
