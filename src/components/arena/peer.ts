import { trigger } from '../../client/client';
import { Component } from '../../components/component';

export class Peer extends Component {
	$playing() {
        if (this.app.arena?.peers) {
            trigger('sync');
        }
    }

    $ready() {
        if (this.app.arena?.peers) {
            trigger('sync');
        }
    }
}