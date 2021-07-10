/** Commands received from Owner.
 * edit: Create or edit room.
 * kick: Remove a client from room.
 * to: Send a message to a client in the room.
 * bcast: Send a message to all clients in the room.
 */
export const owner2hub = ['edit', 'kick', 'to', 'bcast'] as const;

/** Commands sent to Owner.
 * ready: Room is created.
 * resp: Member yields a result.
 * leave: Member leaves the room.
 * join: Member joins the room.
*/
export const hub2owner = ['ready', 'resp', 'leave', 'join'] as const;

/** Commands received from Member.
 * join: Join a room.
 * leave: Leave current room.
 * resp: Send to result to owner.
 */
export const member2hub = ['join', 'leave', 'resp'] as const;

/** Commands sent to Member.
 * down: Owner lost connection.
 * msg: Owner sends a UITick.
 * edit: Room info changes (for idle clients).
 * num: Number of connected clients (for idle clients).
 * reload: Full list of rooms.
*/
export const hub2member = ['down', 'msg', 'edit', 'reload', 'num'] as const;