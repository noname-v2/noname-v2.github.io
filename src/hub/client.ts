export class Client {
    // WebSocket object
    ws: WebSocket;

    // client unique identifier
    uid: string;

    // client description
    info: any;

    // room info
    room: any;

    // tested by heartbeat
    alive = true;

    constructor(ws: WebSocket, uid: string, info: any) {
        this.ws = ws;
        this.uid = uid;
        this.info = info;
    }
}