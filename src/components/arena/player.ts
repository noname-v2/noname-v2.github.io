import { Component, Timer } from '../../components';

export class Player extends Component {
    /** Player background. */
    background = this.ui.createElement('background', this.node);

    /** Main hero image. */
    heroImage = this.ui.createElement('image', this.background);

    /** Vice hero image. */
    viceImage = this.ui.createElement('image.vice', this.background);

    /** Container of name content. */
    content = this.ui.createElement('content', this.node);

	/** Main hero name. */
	heroName = this.ui.createElement('caption', this.content);
    
	/** Vice hero name. */
	viceName = this.ui.createElement('caption.vice', this.content);

	/** Nickname of hero's controller. */
	nickname = this.ui.createElement('span', this.content);

    /** Faction label. */
    faction = this.ui.createElement('label', this.content);

    /** HP bar. */
    hp = this.ui.createElement('hp', this.content);

    /** Status marker. */
    marker = this.ui.createElement('caption.marker', this.content);

    /** Timer bar. */
    timer: Timer | null = null;

    initHero(name: string) {
        const info = this.app.getData('hero', name);
        this.data.heroImage = name;
        this.data.heroName = info.name;
        this.data.faction = info.faction;
        this.data.hpMax = info.hp;
        this.data.hp = info.hp;
    }

    $heroImage(name?: string) {
        if (name) {
            this.node.classList.add('hero-shown');
            this.ui.setImage(this.heroImage, name);
        }
        else {
            this.node.classList.remove('hero-shown');
            this.heroImage.style.backgroundImage = '';
        }
    }

    $heroName(name?: string) {
        this.ui.format(this.heroName, name ?? '');
    }

	$nickname(name?: string) {
		this.ui.format(this.nickname, name ?? '');
	}

    $marker(stat?: string) {
        this.ui.format(this.marker, stat ?? '');
    }

    $faction(faction: string) {
        const info = this.lib.faction[faction];
        if (info) {
            const [label, color] = info;
            this.faction.innerHTML = label;
            this.faction.dataset.tglow = color;
            this.heroName.dataset.tshadow = color;
        }
    }

    $hpMax(hp: number) {
        const current = this.hp.childNodes.length;
		if (current < hp) {
			for (let i = current; i < hp; i++) {
				this.ui.createElement('image', this.hp);
			}
		}
		else if (current > hp) {
			for (let i = hp; i < current; i++) {
				this.hp.firstChild!.remove();
			}
		}
    }

    $hp(hp: number) {
        const hpMax = this.hp.childNodes.length;
		for (let i = 0; i < hpMax; i++) {
			const node = <HTMLElement>this.hp.childNodes[hpMax - i - 1];
			node.classList[i < hp ? 'remove' : 'add']('lost');
		}
		if (hp > Math.round(hpMax / 2) || hp === hpMax) {
			this.hp.dataset.condition='high';
		}
		else if (hp > Math.floor(hpMax / 3)) {
			this.hp.dataset.condition='mid';
		}
		else {
			this.hp.dataset.condition='low';
		}
    }

    $timer(config?: [number, number]) {
        if (config) {
            const timer = this.ui.create('timer', this.content);
            timer.start(config, this);
        }
        else {
            this.timer?.remove();
        }
    }

    $owner() {
        if (this.mine) {
            this.node.classList.add('mine');
        }
        else {
            this.node.classList.remove('mine');
        }
    }
}