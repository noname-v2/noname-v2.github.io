import ws from 'ws';
import fs from 'fs';
import https from 'https';

const server = https.createServer({
    cert: fs.readFileSync('cert.pem'),
    key: fs.readFileSync('key.pem'),
});

const clients = new Map();
const plans = new Map();

const messages = {

    /** Initialize a client with uid and info. */
    init(msg) {
        [this.uid, this.info] = JSON.parse(msg);
        if (!this.uid || !this.info) {
            client.close(1002, 'init');
            return;
        }

        // replace old client
        const old = clients.get(this.uid);
        clients.set(this.uid, this);
        if (old) {
            if (typeof old.joined === 'string') {
                // rejoint previous room if possible
                const owner = clients.get(clients.joined);
                if (owner && owner.joined.has(this.uid)) {
                    messages.join.call(this, owner.uid);
                }
            }
            else if (old.room) {
                // tell reconnected room owner currently joined clients
                this.room = old.room;
                this.joined = old.joined;
                client.send('up:' + JSON.stringify(Array.from(this.joined)));
            }
        }

        // send room info to new client
        if (client.joined === null) {
            const rooms = {};
            for (const client of clients) {
                if (client.room) {
                    rooms[client.uid] = [client.room, client.joined.size];
                }
            }
            client.send('update:' + JSON.stringify(rooms));
        }
    },

    /** A client join a room. */
    join(msg) {
        const owner = clients.get(msg);
        if (owner && owner.room) {
            owner.joined.add(this.uid);
            owner.send('join:' + this.uid);
            messages.update({[owner.uid]: owner.joined.size});
        }
    },

    /** A client leaves its current room */
    leave() {
        if (typeof this.joined === 'string') {
            const owner = clients.get(this.joined);
            if (owner) {
                messages.kick.call(owner, this.uid);
                this.joined = null;
            }
        }
    },

    /** A room owner kicks a member away. */
    kick(msg) {
        if (this.room && this.joined.has(msg)) {
            this.send('leave:' + msg);
            this.joined.delete(msg);
            messages.update({[owner.uid]: owner.joined.size});
            clients.get(msg)?.joined = null;
        }
    },

    /** Create or modify a room. */
    room(msg) {
        messages.leave.call(this);
        if (!(this.joined instanceof Set)) {
            client.joined = new Set();
        }
        messages.update({[this.uid]: msg});
    },

    /** Send a message to a member of the room. */
    send(msg) {
        const [uid, msg2] = JSON.parse(msg);
        if (this.room && this.joined.has(uid)) {
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
    },

    /** Send a response message to the owner of the room. */
    resp(msg) {
        const owner = clients.get(this.joined);
        if (owner && owner.room) {
            owner.send('resp:' + msg);
        }
    },

    /** Send updates to idle clients. */
    update(msg) {
        msg = 'update:' + JSON.stringify(msg);
        for (const client of clients.values()) {
            if (client.joined === null) {
                client.send(msg);
            }
        }
    }
}


const wss = new ws.Server({server});
wss.on('connection', client => {
    // unique ID
    client.uid = null;

    // display name and avatar
    client.info = null;

    // room info for idle clients
    client.room = null;

    // string: joined another client's room; string[]: clients that joined this.room
    client.joined = null;

    // tested by heartbeat
    client.alive = true;

    client.on('message', msg => {
        try {
            const idx = msg.indexOf(':');
            const method = msg.slice(0, idx);
            const msg2 = msg.slice(idx + 1);

            if (method === 'init' || clients.has(client.uid)) {
                messages[method]?.call(this, msg2);
            }
        }
        catch {}
    });

    client.on('close', () => {
        try {
            if (client.room) {
                messages.bcast.call(this, 'down');
            }
            else if (client.joined) {
                const owner = clients.get(client.joined);
                if (owner && owner.room) {
                    owner.send('left:' + client.uid);
                }
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