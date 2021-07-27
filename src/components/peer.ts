import { Component } from '../components';

export class Peer extends Component {
	$playing() {
        if (this.client.peer) {
            this.client.trigger('sync');
        }
    }
}