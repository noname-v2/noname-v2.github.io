import { Client } from './client';
import { UI } from './ui';
import { Database } from './database';
import { globals} from './globals';

globals.db = new Database();
globals.client = new Client();
globals.ui = new UI();
globals.app = globals.ui.create('app');