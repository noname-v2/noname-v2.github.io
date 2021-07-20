import { Component } from '../../components';

export class SplashRoom extends Component {
    /** Use <noname-widget> as tag */
    static tag = 'widget';

    /** Avatar image. */
    avatar = this.ui.createElement('image', this.node);

    /** Mode name. */
    caption = this.ui.createElement('caption', this.node);

    /** Status text. */
    status = this.ui.createElement('span', this.node);

    /** Nickname text. */
    nickname = this.ui.createElement('span.nickname', this.node);

    setup([name, np, npmax, [nickname, avatar], state]:
        [string, number, number, [string, string], boolean]) {
        this.ui.setImage(this.avatar, avatar);
        this.caption.innerHTML = name;
        const stateText = state ? '游戏中' : '等待中';
        this.status.innerHTML = `<noname-status data-state="${state}"></noname-status> ${stateText} ${Math.min(np, npmax)} / ${npmax}`;
        this.nickname.innerHTML = `<noname-image></noname-image>${nickname}`;
    }
}