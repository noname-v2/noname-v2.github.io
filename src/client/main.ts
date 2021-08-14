import { Client } from './client';
import { UI } from './ui';
import { globals} from './globals';

globals.client = new Client();
globals.ui = new UI();
globals.app = globals.ui.create('app');