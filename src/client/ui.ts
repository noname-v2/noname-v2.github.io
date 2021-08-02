import { globals } from './globals';
import type { Popup } from '../components';
import type { ComponentTagMap } from '../classes';

/** Type for point location */
export type Point = {x: number, y: number};

/** Type for region range */
export type Region = {x: [number, number], y: [number, number]};

/** Return value of onmove */
export type MoveState = unknown;

/** Transition duration names. */
export type TransitionDuration = 'normal' | 'fast' | 'slow' | 'faster' | 'slower' | null;

/** Type for event point location. */
type EventPoint = {clientX: number, clientY: number}

/** Options used by ui.choose(). */
interface DialogOptions {
    buttons?: [string, string, string?][];
    content?: string;
    id?: string;
    timeout?: number;
}

/** Options used by ui.confirm(). */
interface ConfirmOptions extends DialogOptions {
    ok?: string;
    cancel?: string;
}

/** Callback for dom events. */
class Binding {
	// current offset
	offset: Point | null = null;

	// maximium offset
	movable: Region | null = null;

	// move callback for pointermove
	onmove: ((e: Point) => MoveState) | null = null;

	// move callback for pointermove outside the range
	onoff: ((e1: Point, e2: Point) => Point) | null = null;

	// move callback for pointerup
	onmoveend: ((arg: MoveState) => void )| null = null;

	// click callback for pointerup
	onclick: ((e: Point) => void) | null = null;

	// callback for pointerdown
	ondown: ((e: Point) => void) | null = null;
}

export class UI {
	/** Resolved when ready. */
	#ready: Promise<unknown>;

    /** Popup components cleared when arena close. */
    #popups = new Map<string | number, Popup>();

    /** Count dialog for dialog ID */
    #dialogCount = 0;

	/** Temperoary disable event trigger after pointerup to prevent unintended clicks. */
	#dispatched = false;

    /** Bindings for DOM events. */
	#bindings = new Map<HTMLElement, Binding>();

	// clicking[0]: element that is clicked
	// clicking[1]: location of pointerdown
	// clicking[2]: started by a touch event
	#clicking: [HTMLElement, Point, boolean] | null = null;

	// moving[0]: element that is moved
	// moving[1]: location of pointerdown
	// moving[2]: initial transform of target element when pointerdown is fired
	// moving[3]: return value of the binding.onmove
	// moving[4]: started by a touch event
	#moving: [HTMLElement, Point, Point, MoveState, boolean] | null = null;

	get ready() {
		return this.#ready;
	}

	get popups() {
		return this.#popups;
	}

	get width() {
		return globals.app.width;
	}

	get height() {
		return globals.app.height;
	}

	get zoom() {
		return globals.app.zoom;
	}

	get css() {
		return globals.app.css;
	}

    constructor() {
		// wait for document.body to load
        if (document.readyState === 'loading') {
			this.#ready = new Promise(resolve => {
				document.addEventListener('DOMContentLoaded', resolve);
			});
		}
		else {
			this.#ready = Promise.resolve();
		}
        
		this.ready.then(() => {
			// add bindings for drag operations
			document.body.addEventListener('touchmove', e => this.#pointerMove(e.touches[0], true), {passive: true});
			document.body.addEventListener('touchend', () => this.#pointerEnd(true), {passive: true});
			document.body.addEventListener('touchcancel', () => this.#pointerCancel(true), {passive: true});

			// avoid unexpected mouse event behavior on some Android devices
			if (!globals.accessor.android) {
				document.body.addEventListener('mousemove', e => this.#pointerMove(e, false), {passive: true});
				document.body.addEventListener('mouseup', () => this.#pointerEnd(false), {passive: true});
				document.body.addEventListener('mouseleave', () => this.#pointerCancel(false), {passive: true});
			}

			// bind resize event and disable context menu
			globals.app = this.create('app');
			document.oncontextmenu = () => false;
		});
    }

	/** Get a component by ID. */
	get(id: number) {
		return globals.client.components.get(id);
	}

    /** Create new component. */
    create<T extends keyof ComponentTagMap>(tag: T, parent: HTMLElement | null = null, id: number | null = null): ComponentTagMap[T] {
		const cls = globals.componentClasses.get(tag as string)!;
        const cmp = new cls(cls.tag || tag as string, id);

		// add className for a Component subclass with a static tag
		if (cls.tag) {
			cmp.node.classList.add(tag as string);
		}
		
		if (parent) {
			parent.appendChild(cmp.node);
		}

        return cmp;
    }

	// create HTMLElement
	createElement(tag: string, parent: null | HTMLElement = null) {
		const tags = tag.split('.')
		const tagName = 'noname-' + tags[0];

		// define custom element
		if (!customElements.get(tagName)) {
			customElements.define(tagName, class extends HTMLElement {});
		}

		// create and append to parent
		const node = document.createElement(tagName);
		for (let i = 1; i < tags.length; i++) {
			node.classList.add(tags[i]);
		}
		if (parent) {
			parent.appendChild(node);
		}

		return node;
	}
	
	/** Set background image and set background position/size to center/cover. */
	setBackground(node: HTMLElement, ...args: string[]) {
		if (!args[args.length - 1].split('/').pop()!.includes('.')) {
			args[args.length - 1] += '.webp';
		}
		node.style.background = `url(${args.join('/')}) center/cover`;
	}

	/** Set background image from an extension. */
	setImage(node: HTMLElement, url: string) {
		if (url.includes(':')) {
			const [ext, name] = url.split(':');
			this.setBackground(node, 'extensions', ext, 'images', name);
		}
		else {
			this.setBackground(node, url);
		}
	}

    /** Set binding for ClickEvent. */
	bindClick(node: HTMLElement, onclick: (e: Point) => void) {
		// get or create registry for node
		const binding = this.#bindings.get(node) || this.#register(node);

		// bind click event
		binding.onclick = onclick;
	}

	/** Set binding for MoveEvent. */
	bindMove(node: HTMLElement, config: {
		movable: Region,
		ondown?: (e: Point) => void
		onmove?: (e: Point) => MoveState,
		onmoveend?: (arg?: MoveState) => void,
		onoff?: (e1: Point, e2: Point) => Point,
		offset?: Point
	}) {
		// get or create registry for node
		const binding = this.#bindings.get(node) || this.#register(node);

		// set move area
		binding.movable = config.movable;

		// bind pointerdown event
		binding.ondown = config.ondown ?? null;

		// bind move event
		binding.onmove = config.onmove ?? null;

		// bind moveend event
		binding.onmoveend = config.onmoveend ?? null;

		// bind onoff event
		binding.onoff = config.onoff ?? null;

		// initial offset
		binding.offset = config.offset ?? null;
	}

	/** Fire click event. */
	dispatchClick(node: HTMLElement) {
		// onclick
		const binding = this.#bindings.get(node);

		if (binding && binding.onclick) {
			if (this.#clicking && this.#clicking[0] === node) {
				// use the location of this.#clicking if applicable
				binding.onclick.call(node, this.#clicking[1]);
			}
			else {
				// a pseudo click event without location info
				binding.onclick.call(node, {x: 0, y: 0});
			}
		}

		// avoid duplicate trigger
		this.#resetClick(node);
		this.#resetMove(node);
	}

	/** Fire move event. */
	dispatchMove(node: HTMLElement, location: Point) {
		const binding = this.#bindings.get(node);

		if (binding && binding.movable) {
			// get offset of node
			const movable = binding.movable;
			let x = Math.min(Math.max(location.x, movable.x[0]), movable.x[1]);
			let y = Math.min(Math.max(location.y, movable.y[0]), movable.y[1]);

			// trigger onoff
			if (binding.onoff && (x != location.x || y != location.y)) {
				const off = binding.onoff({x, y}, {x: location.x, y: location.y});
				x = off.x;
				y = off.y;
			}
			
			// set and save node offset
			node.style.transform = `translate(${x}px, ${y}px)`;
			binding.offset = {x, y};

			// trigger onmove
			if (binding.onmove) {
				const state = binding.onmove(binding.offset);

				// save move state to this.#moving if applicable
				if (this.#moving && this.#moving[0] === node) {
					this.#moving[3] = state;
				}
			}
		}
	}

	/** Fire moveend event. */
	dispatchMoveEnd(node: HTMLElement) {
		// onmoveend
		const binding = this.#bindings.get(node);

		if (binding && binding.onmoveend) {
			if (this.#moving && this.#moving[0] === node) {
				// pass the state of this.#moving if applicable
				binding.onmoveend(this.#moving[3]);
			}
			else {
				// a pseudo moveend event without current state
				binding.onmoveend(null);
			}
		}

		// avoid duplicate trigger
		this.#resetClick(node);
		this.#resetMove(node);
	}

	/** Wrapper of HTMLElement.animate(). */
	animate(node: HTMLElement, animation: {
			x?: (number | string)[],
			y?: (number | string)[],
			scale?: (number | string)[],
			opacity?: (number | string)[],
			auto?: boolean,
			forward?: boolean
		}, config?: KeyframeAnimationOptions | number) {
		const keyframes = [];
		
		// get number of keyframes
		let length = 0;
		for (const key in animation) {
			if (Array.isArray((animation as any)[key])) {
				length = Math.max(length, (animation as any)[key].length);
			}
		}

		// create keyframes
		for (let i = 0; i < length; i++) {
			const frame: Keyframe = {};
			if (animation.x) {
				frame.transform = `translateX(${animation.x[i]}px)`;
			}
			if (animation.y) {
				frame.transform = (frame.transform || '') + ` translateY(${animation.y[i]}px)`;
			}
			if (animation.scale) {
				frame.transform = (frame.transform || '') + ` scale(${animation.scale[i]})`;
			}
			if (animation.opacity) {
				frame.opacity = animation.opacity[i].toString();
			}
			keyframes.push(frame);
		}

		// use current style as starting frame
		if (animation.auto) {
			const frame = {} as any;
			for (const key in keyframes[0]) {
				frame[key] = (getComputedStyle(node) as any)[key];
			}
			keyframes.unshift(frame);
		}

		// fill animation configurations
		if (typeof config === 'number') {
			config = {duration: config};
		}
		config ??= {};
		config.easing ??= 'ease';
		config.duration ??= this.getTransition();
		
		const anim = node.animate(keyframes, config);

		// use last frame as final style
		if (animation.forward) {
			const frame = keyframes[keyframes.length - 1];
			for (const key in frame) {
				(node as any).style[key] = frame[key];
			}
		}

		return anim;
	}

    /** Get the duration of transition.
     * @param {TransitionDuration} type - transition type
     */
    getTransition(type: TransitionDuration = null) {
        let key = 'transition';
        if (type && ['fast', 'slow', 'faster', 'slower'].includes(type)) {
            key += '-' + type;
        }
        const duration = parseFloat(this.css.app[key]) || parseFloat(this.css.app.transition);
        return duration * 1000;
    }

    /** Display alert message. */
    async alert(caption: string, config: ConfirmOptions = {}): Promise<true | null> {
        config.buttons = [['ok', config.ok ?? '确定', 'red']];
        return await this.choose(caption, config) === 'ok' ? true : null;
    }

    /** Display confirm message. */
    async confirm(caption: string, config: ConfirmOptions = {}): Promise<boolean | null> {
        config.buttons = [['ok', config.ok ?? '确定', 'red'], ['cancel', config.cancel ?? '取消']];
        const result = await this.choose(caption, config);
        if (result === 'ok') {
            return true;
        }
        if (result === 'cancel') {
            return false;
        }
        return null;
    }

    /** Display confirm message. */
    choose(caption: string, config: DialogOptions={}): Promise<string | null> {
        const dialog = this.create('dialog');
        dialog.update({caption, content: config.content, buttons: config.buttons});
        const promise = new Promise<string | null>(resolve => {
            dialog.onclose = () => {
                resolve(dialog.result);
            };
            this.popup(dialog, config.id);
        });
        if (config.timeout) {
            return Promise.race([promise, new Promise<null>(resolve => {
                setTimeout(() => resolve(null), config.timeout! * 1000);
            })])
        }
        else {
            return promise;
        }
    }

    /** Displa a popup. */
    popup(dialog: Popup, id?: string) {
        const dialogID = id ?? ++this.#dialogCount;
        this.popups.get(dialogID)?.close();
        const onopen = dialog.onopen;
        const onclose = dialog.onclose;

        // other popups that are blurred by dialog.open()
        const blurred: (string | number)[] = [];

        dialog.onopen = () => {
            // blur arena, splash and other popups
            globals.app.node.classList.add('popped');
            for (const [id, popup] of this.popups.entries()) {
                if (popup !== dialog && !popup.node.classList.contains('blurred')) {
                    popup.node.classList.add('blurred');
                    blurred.push(id);
                }
            }

            if (typeof onopen === 'function') {
                onopen();
            }
        };

        dialog.onclose = () => {
            // unblur
            this.popups.delete(dialogID);
            if (this.popups.size === 0) {
                globals.app.node.classList.remove('popped');
            }
            for (const id of blurred) {
                this.popups.get(id)?.node.classList.remove('blurred');
            }
            blurred.length = 0;

            if (typeof onclose === 'function') {
                onclose();
            }
        };

        this.popups.set(dialogID, dialog);
        dialog.ready.then(() => dialog.open());
    }

    /** Clear alert and confirm dialogs. */
    clearPopups() {
        for (const popup of this.popups.values()) {
            popup.close();
        }
        this.popups.clear();
    }

	/** Get the location of mouse or touch event. */
	#locate(e: EventPoint) {
		return {
			x: Math.round(e.clientX / this.zoom),
			y: Math.round(e.clientY / this.zoom)
		}
	}

	/** Register pointerdown for click or move. */
	#register(node: HTMLElement) {
		// event callback
		const binding = new Binding();
		this.#bindings.set(node, binding);

		// register event
		const dispatchDown = (e: EventPoint, touch: boolean) => {
			const origin = this.#locate(e);

			// initialize click event
			if (binding.onclick && !this.#clicking) {
				node.classList.add('clickdown');
				this.#clicking = [node, origin, touch];
			}

			// initialize move event
			if (binding.movable && !this.#moving) {
				this.#moving = [node, origin, binding.offset || {x: 0, y: 0}, null, touch];

				// fire ondown event
				if (binding.ondown) {
					binding.ondown(origin);
				}
			}
		};

		node.addEventListener('touchstart', e => dispatchDown(e.touches[0], true), {passive: true});

		if (!globals.accessor.android) {
			node.addEventListener('mousedown', e => dispatchDown(e, false), {passive: true});
		}

		return binding;
	}

	/** Cancel click callback for current pointerdown. */
	#resetClick(node: HTMLElement) {
		if (this.#clicking && this.#clicking[0] === node) {
			this.#clicking = null;
		}
		node.classList.remove('clickdown');
	}

	/** Cancel move callback for current pointerdown. */
	#resetMove(node: HTMLElement) {
		if (this.#moving && this.#moving[0] === node) {
			this.#moving = null;
		}
	}

	/** Callback for mousemove or touchmove. */
	#pointerMove(e: EventPoint, touch: boolean) {
		const {x, y} = this.#locate(e);

		// not a click event if move distance > 5px
		if (this.#clicking && this.#clicking[2] === touch) {
			const [node, origin] = this.#clicking;
			const dx = origin.x - x;
			const dz = origin.y - y;
			
			if (dx * dx + dz * dz > 25) {
				this.#resetClick(node);
			}
		}

		// get offset and trigger move event
		if (this.#moving && this.#moving[4] === touch) {
			const [node, origin, offset] = this.#moving;
			this.dispatchMove(node, {
				x: x - origin.x + offset.x,
				y: y - origin.y + offset.y
			});
		}
	}

	/** Ccallback for mouseup or touchend. */
	#pointerEnd(touch: boolean) {
		if (this.#dispatched === false) {
			// dispatch events
			if (this.#clicking && this.#clicking[2] === touch) {
				this.#dispatched = true;
				this.dispatchClick(this.#clicking[0]);
			}

			if (this.#moving && this.#moving[4] === touch) {
				this.#dispatched = true;
				this.dispatchMoveEnd(this.#moving[0]);
			}

			// re-enable event trigger after 200ms
			if (this.#dispatched) {
				window.setTimeout(() => this.#dispatched = false, 200);
			}
		}

		if (this.#clicking && this.#clicking[2] === touch) {
			this.#clicking = null;
		}
		
		if (this.#moving && this.#moving[4] === touch) {
			this.#moving = null;
		}
	}

	/** Callback for mouseleave or touchcancel. */
	#pointerCancel(touch: boolean) {
		if (this.#clicking && this.#clicking[2] === touch) {
			this.#clicking[0].classList.remove('clickdown');
		}

		if (this.#moving && this.#moving[4] === touch) {
			this.dispatchMoveEnd(this.#moving[0]);
		}

		this.#clicking = null;
		this.#moving = null;
	}
}