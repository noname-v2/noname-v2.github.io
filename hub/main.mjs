import ws from 'ws';
import fs from 'fs';
import https from 'https';

const server = https.createServer({
        cert: fs.readFileSync('cert.pem'),
        key: fs.readFileSync('key.pem'),
});

const wss = new ws.Server({server});
wss.on('connection', client => {
    client.on('message', msg => {
        console.log('received: ' + msg)
    });
    client.send('ready');
});

server.listen(8080);