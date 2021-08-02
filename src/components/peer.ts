import { globals } from '../client/globals';
import { Component } from '../components';

export class Peer extends Component {
	$playing() {
        if (this.arena?.peers) {
            globals.client.trigger('sync');
        }
    }
}