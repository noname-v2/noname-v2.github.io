import { android, ios } from '../platform';
import { app, lib, componentClasses } from './globals';
import { split } from '../utils';
import type { ComponentTagMap } from '../../build/component-classes';
import type { Point, Region } from '../types-client';

/** Type for point location from an event. */
type EventPoint = {clientX: number, clientY: number, button?: number}

/** Callback for click or drag event. */
interface Binding {
	// current displacement
	offset?: Point;

	// maximium displacement
	movable?: Region;

	// move callback for pointermove
	onmove?: (e: Point) => any;

	// move callback for pointermove outside the range
	onoff?: (e1: Point, e2: Point) => Point;

	// move callback for pointerup
	onmoveend?: (arg: any) => void;

	// click callback for pointerup
	onclick?: (e: Point) => void;

	// callback for pointerdown
	ondown?: (e: Point) => void;

    // callback for right click or long press
    oncontext?: (e: Point) => void;
}

/** Bindings for DOM events. */
const bindings = new Map<HTMLElement, Binding>();

/** Temperoary disable event trigger after pointerup to prevent unintended clicks. */
let dispatched = false;

/** Handler for current click event.
 * [0]: Element that is clicked.
 * [1]: Location of pointerdown.
 * [2]: true: started by a touch event, false: started by a mouse event.
 * [3]: mousedown is triggered by non-left click.
 */
let clicking: [HTMLElement, Point, boolean, boolean] | null = null;

/** Handler for current move event.
 * [0]: Element that is moved.
 * [1]: Location of pointerdown.
 * [2]: Initial transform of target element when pointerdown is fired.
 * [3]: Return value of the binding.onmove.
 * [4]: true: started by a touch event, false: started by a mouse event.
 */
let moving: [HTMLElement, Point, Point, any, boolean] | null = null;

/** Get the location of mouse or touch event. */
function locate(e: EventPoint): Point {
    return {
        x: Math.round(e.clientX / app.zoom),
        y: Math.round(e.clientY / app.zoom)
    }
}

/** Register pointerdown for click or move. */
function register(node: HTMLElement) {
    // event callback
    const binding = {} as Binding;
    bindings.set(node, binding);

    // register event
    const dispatchDown = (e: EventPoint, touch: boolean) => {
        const origin = locate(e);

        // initialize click event
        const right = e.button ? true : false;
        if (((binding.onclick && !right) || binding.oncontext) && !clicking) {
            clicking = [node, origin, touch, right];
            if (!right) {
                // click down effect for left click
                if (binding.onclick) {
                    node.classList.add('clickdown');
                }

                // simulate right click with long press
                if (binding.oncontext) {
                    const bak = clicking;
                    setTimeout(() => {
                        if (bak === clicking) {
                            clicking[3] = true;
                            pointerEnd(touch);
                        }
                    }, 500);
                }
            }
        }

        // initialize move event
        if (binding.movable && !moving) {
            node.classList.add('movedown');
            moving = [node, origin, binding.offset || {x: 0, y: 0}, null, touch];

            // fire ondown event
            if (binding.ondown) {
                binding.ondown(origin);
            }
        }
    };

    node.addEventListener('touchstart', e => dispatchDown(e.touches[0], true), {passive: true});

    if (!ios && !android) {
        node.addEventListener('mousedown', e => dispatchDown(e, false), {passive: true});
    }

    return binding;
}

/** Cancel click callback for current pointerdown. */
function resetClick(node: HTMLElement) {
    if (clicking && clicking[0] === node) {
        clicking = null;
    }
    node.classList.remove('clickdown');
}

/** Cancel move callback for current pointerdown. */
function resetMove(node: HTMLElement) {
    if (moving && moving[0] === node) {
        moving = null;
    }
    node.classList.remove('movedown');
}

/** Callback for mousemove or touchmove. */
function pointerMove(e: EventPoint, touch: boolean) {
    const {x, y} = locate(e);

    // not a click event if move distance > 5px
    if (clicking && clicking[2] === touch) {
        const [node, origin] = clicking;
        const dx = origin.x - x;
        const dz = origin.y - y;
        
        if (dx * dx + dz * dz > 25) {
            resetClick(node);
        }
    }

    // get offset and trigger move event
    if (moving && moving[4] === touch) {
        const [node, origin, offset] = moving;
        const binding = bindings.get(node);
        if (binding?.movable) {
            if (binding.onclick || binding.oncontext) {
                const dx = origin.x - x;
                const dz = origin.y - y;

                if (dx * dx + dz * dz <= 25) {
                    return;
                }
            }

            dispatchMove(node, {
                x: x - origin.x + offset.x,
                y: y - origin.y + offset.y
            });
        }
    }
}

/** Ccallback for mouseup or touchend. */
function pointerEnd(touch: boolean) {
    if (dispatched === false) {
        // dispatch events
        if (clicking && clicking[2] === touch) {
            dispatched = true;
            dispatchClick(clicking[0]);
        }

        if (moving && moving[4] === touch) {
            dispatched = true;
            dispatchMoveEnd(moving[0]);
        }

        // re-enable event trigger after 310ms (slightly > app.css.transition)
        if (dispatched) {
            window.setTimeout(() => dispatched = false, 310);
        }
    }

    if (clicking && clicking[2] === touch) {
        clicking = null;
    }
    
    if (moving && moving[4] === touch) {
        moving[0].classList.remove('movedown');
        moving = null;
    }
}

/** Callback for mouseleave or touchcancel. */
function pointerCancel(touch: boolean) {
    if (clicking && clicking[2] === touch) {
        clicking[0].classList.remove('clickdown');
    }

    if (moving && moving[4] === touch) {
        dispatchMoveEnd(moving[0]);
    }

    clicking = null;
    moving = null;
}

/** Resolved when document is ready. */
export const ready = new Promise<void>(async resolve => {
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    // add bindings for drag operations
    document.body.addEventListener('touchmove', e => pointerMove(e.touches[0], true), {passive: true});
    document.body.addEventListener('touchend', () => pointerEnd(true), {passive: true});
    document.body.addEventListener('touchcancel', () => pointerCancel(true), {passive: true});

    // avoid unexpected mouse event behavior on some Android devices
    if (!android) {
        document.body.addEventListener('mousemove', e => pointerMove(e, false), {passive: true});
        document.body.addEventListener('mouseup', () => pointerEnd(false), {passive: true});
        document.body.addEventListener('mouseleave', () => pointerCancel(false), {passive: true});
    }

    // disable context menu
    document.oncontextmenu = () => false;

    resolve();
});

/** Create new component. */
export function create<T extends keyof ComponentTagMap>(tag: T, parent?: HTMLElement): ComponentTagMap[T] {
    const cls = componentClasses.get(tag as string)!;
    const cmp = new cls(tag as string)

    // add className for a Component subclass with a static tag
    if (cls.tag && cmp.node) {
        cmp.node.classList.add((tag as string).split('').map(
            c => c !== c.toLowerCase() ? '-' + c.toLowerCase() : c
        ).join(''));
    }
    
    if (parent) {
        parent.appendChild(cmp.node);
    }

    return cmp;
}

// create HTMLElement
export function createElement(tag: string, parent: null | HTMLElement = null) {
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
export function setBackground(node: HTMLElement, ...args: string[]) {
    if (!args[args.length - 1].split('/').pop()!.includes('.')) {
        args[args.length - 1] += '.webp';
    }
    node.style.background = `url(${args.join('/')}) center/cover`;
}

/** Set background image from an extension. */
export function setImage(node: HTMLElement, url: string) {
    if (url.includes(':')) {
        const [ext, name] = url.split(':');
        setBackground(node, 'extensions', ext, 'images', name);
    }
    else {
        setBackground(node, url);
    }
}

/** Set binding for move or click event. */
export function bind(node: HTMLElement, config: Binding | ((e: Point) => void)) {
    const binding = bindings.get(node) || register(node);
    if (typeof config === 'function') {
        binding.onclick = config;
    }
    else {
        Object.assign(binding, config);
    }
}

/** Bind both onclick and oncontext. */
export function bindClick(node: HTMLElement, onclick: (e: Point) => void) {
    bind(node, { onclick, oncontext: onclick });
}

/** Fire click event. */
export function dispatchClick(node: HTMLElement) {
    const binding = bindings.get(node);

    // trigger left click
    if (binding?.onclick && (!clicking || !clicking[3])) {
        if (clicking && clicking[0] === node) {
            // use the location of clicking if applicable
            binding.onclick.call(node, clicking[1]);
        }
        else {
            // a pseudo click event without location info
            binding.onclick.call(node, {x: 0, y: 0});
        }
    }

    // trigger right click
    if (binding?.oncontext && clicking && clicking[3]) {
        binding.oncontext.call(node, clicking[1]);
    }

    // avoid duplicate trigger
    resetClick(node);
    resetMove(node);
}

/** Move an element with animation. */
export function moveTo(node: HTMLElement, location: Point, transit: boolean = true) {
    const binding = bindings.get(node);
    if (binding) {
        const offset = binding.offset ?? {x: 0, y: 0};
        if (location.x === offset.x && location.y === offset.y) {
            return;
        }
        node.style.transform = `translate(${location.x}px, ${location.y}px)`;
        if (transit) {
            animate(node, {x: [offset.x, location.x], y: [offset.y, location.y]});
        }
        binding.offset = location;
    }
}

/** Get the transform of an element in x direction. */
export function getX(node: HTMLElement) {
    return bindings.get(node)?.offset?.x ?? 0;
}

/** Get the transform of an element in x direction. */
export function getY(node: HTMLElement) {
    return bindings.get(node)?.offset?.y ?? 0;
}

/** Fire move event. */
export function dispatchMove(node: HTMLElement, location: Point) {
    const binding = bindings.get(node);

    if (binding?.movable) {
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

            // save move state to moving if applicable
            if (moving && moving[0] === node) {
                moving[3] = state;
            }
        }
    }
}

/** Fire moveend event. */
export function dispatchMoveEnd(node: HTMLElement) {
    // onmoveend
    const binding = bindings.get(node);

    if (binding && binding.onmoveend) {
        if (moving && moving[0] === node) {
            // pass the state of moving if applicable
            binding.onmoveend(moving[3]);
        }
        else {
            // a pseudo moveend event without current state
            binding.onmoveend(null);
        }
    }

    // avoid duplicate trigger
    resetClick(node);
    resetMove(node);
}

/** Options for ui.animate(). */
export interface AnimationOptions {
    x?: (number | string)[],
    y?: (number | string)[],
    scale?: (number | string)[],
    opacity?: (number | string)[],
    auto?: boolean,
    forward?: boolean
};

/** Wrapper of HTMLElement.animate(). */
export function animate(node: HTMLElement, animation: AnimationOptions, config?: KeyframeAnimationOptions | number) {
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
    config.duration ??= app.getTransition();
    
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

/** Translate number to zh-CN. */
function toCN(str: string | number, two: boolean = true): string {
    const num = parseInt(str as any);
    if(isNaN(num)) return '';
    if(num == Infinity) return '∞';
    if(num < 0 || num > 99) return num.toString();
    if(num <= 10){
        switch (num) {
            case 0: return '〇';
            case 1: return '一';
            case 2: return two ? '二' : '两';
            case 3: return '三';
            case 4: return '四';
            case 5: return '五';
            case 6: return '六';
            case 7: return '七';
            case 8: return '八';
            case 9: return '九';
            case 10: return '十';
        }
    }
    if (num < 20) {
        return '十' + toCN(num - 10);
    }
    const x = Math.floor(num/10);
    return toCN(x) + '十' + (num > 10 * x ? toCN(num- 10 * x) : '');
}

/** Format text with keywords. */
export function format(node: HTMLElement, content: string) {
    if (!content) {
        node.innerHTML = '';
        return;
    }
    const sections = content.split('@(');
    const keywords = [];
    for (let i = 1; i < sections.length; i++) {
        let [name, content] = split(sections[i], ')');
        if (typeof content === 'string') {
            if (lib.keyword[name]) {
                keywords.push(lib.keyword[name]);
                name = '<span class="keyword">' + name + '</span>';
            }
            else if (!isNaN(name as any)) {
                name = toCN(name);
            }
            sections[i] = name + content;
        }
    }
    node.innerHTML = sections.join('');

    // render keywords
    const spans = node.querySelectorAll<HTMLElement>('span.keyword');
    for (let i = 0; i < keywords.length; i++) {
        const info = keywords[i];
        if (info[1]) {
            spans[i].dataset.color = info[1];
        }
        if (info[2]) {
            spans[i].innerHTML = info[2];
        }
        if (info[0]) {
            bindClick(spans[i], e => app.intro(e, info[0]));
        }
    }
}

/** Count active childNodes. */
export function countActive(node?: HTMLElement) {
    if (!node) {
        return 0;
    }
    let n = 0;
    for (const child of Array.from(node.childNodes) as HTMLElement[]) {
        if (!child.classList.contains('removing') &&
            !child.classList.contains('blurred') &&
            !child.classList.contains('defer')) {
            n++;
        }
    }
    return n;
}

/** Set text color. */
export function setColor(node: HTMLElement, name: string) {
    if (app.css.color[name]) {
        node.dataset.color = name;
    }
    else {
        node.style.color = name;    
    }
}