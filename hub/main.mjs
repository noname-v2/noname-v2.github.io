import ws from 'ws';
import fs from 'fs';
import https from 'https';

const server = https.createServer({
    cert: fs.readFileSync('cert.pem'),
    key: fs.readFileSync('key.pem'),
});

const clients = new Map();
const plans = new Map();

const ownerMessages = {
    /** Create or modify or delete a room. */
    room(room) {
        if (room === null) {
            // room owner exits the room
            if (this.room) {
                ownerMessages.bcast.call(this, 'end');
            }
            this.close(1000);
            this.clients.delete(this.uid);
        }
        else {
            this.joined = this.joined || new Set();
            this.room = room;
        }

        // send room update to idle clients
        msg = 'update:' + JSON.stringify({[this.uid]: room});
        for (const client of clients.values()) {
            if (client.joined === null) {
                client.send(msg);
            }
        }
    },

    /** A room owner kicks a member away. */
    kick(uid) {
        const client = clients.get(uid);
        if (client && client.joined === this.uid) {
            memberMessages.leave.call(client);
        }
    },

    /** Send a message to a member of the room. */
    send(msg) {
        const [uid, msg2] = JSON.parse(msg);
        if (this.room && this.joined.has(uid) && typeof msg2 === 'string') {
            clients.get(uid)?.send('msg:' + msg2);
        }
    },

    /** Send a message to all members of the room. */
    bcast(msg) {
        if (this.room) {
            for (const uid of this.joined) {
                clients.get(uid)?.send('msg:' + msg);
            }
        }
    }
};

const memberMessages = {
    /** Initialize a client with uid and info. */
    init(msg) {
        const [uid, info, room] = JSON.parse(msg);
        if (!uid || !info || typeof uid !== 'string') {
            this.close(1002, 'init');
            return;
        }
        this.uid = uid;
        this.info = info;

        // replace old client
        const old = clients.get(this.uid);
        clients.set(this.uid, this);

        if (room) {
            // create a new room or return to previous room
            ownerMessages.room.call(this, room);

            if (old.members) {
                for (const uid of old.members) {
                    const member = clients.get(uid);
                    if (member?.joined === this.uid) {
                        memberMessages.join.call(member, this.uid);
                    }
                }
            }
        }
        else if (old.members?.size) {
            // disallow an active room owner to join another game
            this.close(1008, 'old');
        }
        else {
            if (old?.joined) {
                // rejoin previous room
                memberMessages.join.call(this, old.joined);
            }

            if (this.joined === null) {
                // send room list
                memberMessages.reload.call(this);
            }
        }
    },

    /** Send full room list to a client. */
    reload() {
        const rooms = {};
        for (const client of clients) {
            if (client.room) {
                rooms[client.uid] = client.room;
            }
        }
        this.send('reload:' + JSON.stringify(rooms));
    },

    /** A client join a room. */
    join(uid) {
        const owner = clients.get(uid);
        if (owner?.room && !this.joined) {
            this.joined = uid;
            owner.joined.add(this.uid);
            owner.send('join:' + this.uid);
        }
    },

    /** A client leaves its current room. */
    leave() {
        if (typeof this.joined === 'string') {
            const owner = clients.get(this.joined);
            this.joined = null;
            if (owner && owner.room && owner.joined.has(this.uid)) {
                owner.send('leave:' + uid);
                owner.joined.delete(uid);
            }
        }

        if (this.CLOSED) {
            // delete closed client without a room
            clients.delete(this.uid);
        }
        else {
            // send room list
            memberMessages.reload.call(this);
        }
    },

    /** Send a response message to the owner of the room. */
    resp(msg) {
        const owner = clients.get(this.joined);
        if (owner && owner.room && owner.joined.has(this.uid)) {
            owner.send('resp:' + msg);
        }
    }
};


const wss = new ws.Server({server});
wss.on('connection', client => {
    // unique ID
    client.uid = null;

    // display name and avatar
    client.info = null;

    // tested by heartbeat
    client.alive = true;

    client.on('message', msg => {
        try {
            const idx = msg.indexOf(':');
            const method = msg.slice(0, idx);
            const msg2 = msg.slice(idx + 1);

            if (method === 'init' || clients.has(client.uid)) {
                (client.room ? ownerMessages : memberMessages)[method]?.call(client, msg2);
            }
            else {
                this.close(1002, 'init');
            }
        }
        catch (e) {
            this.close(1002, 'error');
        }
    });

    client.on('close', () => {
        try {
            if (client.room) {
                ownerMessages.bcast.call(this, 'down');

                // close room after 90s
                setTimeout(() => {
                    if (clients.get(client.uid) === client) {
                        ownerMessages.room.call(client, null);
                    }
                }, 90000);
            }
            else if (client.joined) {
                clients.get(client.joined)?.send('leave:' + client.uid);
            }
            else {
                this.clients.delete(client.uid);
            }
        }
        catch {}
    });

    client.on('pong', () => {
        client.alive = true;
    });
});

setInterval(() => {
    for (const client of wss.clients) {
        try {
            if (client.alive === false) {
                client.close(1001, 'heartbeat');
            }
            else {
                client.alive = false;
                client.ping();
            }
        }
        catch {}
    }
}, 3000);

server.listen(8080);