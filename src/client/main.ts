import { Client } from './client';
import { UI } from './ui';
import { Database } from './database';
import { Accessor } from './accessor';
import { globals} from './globals';

globals.db = new Database();
globals.accessor = new Accessor();
globals.client = new Client();
globals.ui = new UI();