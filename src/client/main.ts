import { Client } from '../client/client';

const client = new Client();
client.debug = true;
(globalThis as any).client = client;
