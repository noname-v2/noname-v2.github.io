/** Commands received from Owner.
 * edit: Create or edit room.
 * kick: Remove a client from room.
 * to: Send a message to a client in the room.
 * bcast: Send a message to all clients in the room.
 */
export type Owner2Hub = 'edit' | 'kick' | 'to' | 'bcast';

/** Commands sent to Owner.
 * ready: Room is created.
 * resp: Member yields a result.
 * leave: Member leaves the room.
 * join: Member joins the room.
*/
export type Hub2Owner = 'ready' | 'resp' | 'leave' | 'join';

/** Commands received from Member.
 * join: Join a room.
 * leave: Leave current room.
 * resp: Send to result to owner.
 */
export type Member2Hub = 'join' | 'leave' | 'resp';

/** Commands sent to Member.
 * down: Owner lost connection.
 * msg: Owner sends a UITick.
 * edit: Room info changes (for idle clients).
 * num: Number of connected clients (for idle clients).
 * reload: Full list of rooms.
*/
export type Hub2Member = 'down' | 'msg' | 'edit' | 'reload' | 'num';