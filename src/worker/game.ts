import { Stage } from './stage';
import { Link } from './link';
import { apply, freeze, access, split } from '../utils';
import type { StageCallback } from './stage';
import type { Worker, ClientMessage, UITick } from './worker';
import type { Extension } from './extension';

/** One section of a UITick. */
export type TickItem = string | null | {[key: string]: any} | [string, any];

/** Stage ID, component ID and UITick section. */
type TickEntry = [number | null, number, TickItem];

export class Game {
    /** Root game stage. */
    #rootStage!: Stage;

    /** Current game stage. */
    #active: [Stage, StageCallback] | null = null;

    /** Links to components. */
    #links = new Map<number, Link>();

    /** Game mode. */
    #mode: string;

    /** Game configuration. */
    #config: {[key: string]: any};

    /** Game data. */
    #data: {[key: string]: any} = {};

    /** Hero packages. */
    #packs: Set<string>;

    /** Banned packages. */
    #banned = {
        heropacks: new Set<string>(),
        cardpacks: new Set<string>(),
        heros: new Set<string>(),
        cards: new Set<string>(),
    };

    /** All created stages. */
    #stages = new Map<number, Stage>();

    /** Loaded extensions. */
    #extensions = new Map<string, Extension>();

    /** Worker reference. */
    #worker: Worker;

    /** Arena link. */
    #arena!: Link;

    /** Array of packages that define ruleset (priority: high -> low). */
    #ruleset = <{[key: string]: any}>{};

    /** Game state.
     * 0: waiting
     * 1: gaming
     * 2: over
    */
    #state = 0;

    /** Ticked history items with timestamp. */
    #history = <[number, TickItem][]>[];

    /** Entries to be ticked. */
    #ticks = <TickEntry[]>[];

    /** Number of links created. */
    #linkCount = 0;

    /** Number of stages created. */
    #stageCount = 0;

    get arena() {
        return this.#arena;
    }

    get mode() {
        return this.#mode;
    }

    get config() {
        return this.#config;
    }

    get packs() {
        return this.#packs;
    }

    get banned() {
        return this.#banned;
    }

    get rootStage() {
        return this.#rootStage;
    }

    get activeStage() {
        return this.#active ? this.#active[0] : null;
    }

    get links() {
        return this.#links;
    }

    get uid() {
        return this.#worker.uid;
    }

    get state() {
        return this.#state;
    }

    /** Connected clients. */
    get peers() {
        if (this.#worker.peers) {
            return Array.from(this.#worker.peers.values());
        }
        return null;
    }

    /** Connected players. */
    get peerPlayers() {
        return this.#worker.getPeers({playing: true});
    }

    /** Connected spectators. */
    get peerSpectators() {
        return this.#worker.getPeers({playing: false});
    }

    /** Game data accessor. */
    get data() {
        return this.#data;
    }

    constructor(content: [string, string[], string[], string[], {[key: string]: any}, [string, string]], worker: Worker) {
        this.#worker = worker;
        this.#mode = content[0];
        this.#packs = new Set(content[1]);
        this.#banned.heropacks = new Set(content[2]);
        this.#banned.cardpacks = new Set(content[3]);
        this.#config = content[4];
        this.#worker.info = content[5];

        // load extensions
        const load = async (pack: string) => {
            const ext = (await import(`../extensions/${pack}/main.js`)).default;
            this.#extensions.set(pack, ext);
        };

        Promise.all(content[1].map(load)).then(async () => {
            // included rulesets
            const inc: string[] = [];
            let mode = this.#mode;
            while (mode) {
                if (inc.includes(mode)) {
                    break;
                }
                if (!this.#extensions.has(mode)) {
                    await load(mode);
                }
                inc.unshift(mode);
                mode = this.#extensions.get(mode)?.inherit as string;
            }

            // add ruleset based on reference order
            for (const name of inc) {
                apply(this.#extensions.get(name)!.ruleset ?? {}, this.#ruleset);
            }

            // start game
            this.#rootStage = this.createStage(`${this.mode}:mode/`);
            this.#arena = this.create('arena');
        });

        // handle return message from client
        self.onmessage = ({data}: {data: ClientMessage}) => this.#dispatch(data);
    }

    create(tag: string) {
        const id = ++this.#linkCount;
        const link = new Link(id, tag, this, this.#tick);
        this.links.set(id, link);
        return link;
    }

    createStage(name: string, data?: {[key: string]: any}) {
        const id = ++this.#stageCount;
        const stage = new Stage(id, name, data ?? {}, this, this.#worker, this.#focus);
        this.#stages.set(id, stage);
        return stage;
    }

    /** Get the function based on string. Format:
     * #<path>/<section>: from this.ruleset
     * <extname>:<path>/<section>: from an extension
     */
    getRule(path: string): any {
        let target: any;
        if (path[0] === '#') {
            // get ruleset
            target = this.#ruleset;
            path = path.slice(1);
        }
        else {
            // get the content of an extension
            let name;
            [name, path] = split(path);
            target = this.#extensions.get(name);
        }

        // access rule
        const [keys, section] = path.split('/');
        const rule = access(target, keys);
        if (section === '') {
            return rule?.content ?? null;
        }
        else if (typeof section === 'string') {
            return rule?.contents[section] ?? null;
        }
        else {
            return rule ?? null;
        }
    }

    /** Update room info for idle clients. */
    updateRoom(push=true) {
        const room = JSON.stringify([
            // mode name
            this.getRule(this.mode + ':mode').name,
            // joined players
            this.#worker.getPeers({playing: true})?.length ?? 1,
            // number of players in a game
            this.config.np,
            // nickname and avatar of owner
            this.#worker.info,
            // game state
            this.state
        ]);
        if (push) {
            this.#worker.connection?.send('edit:' + room);
        }
        return room;
    }

    /** Backup game progress. */
    backup() {
        //////
        return new Promise<void>(resolve => {
            resolve();
        });
    }

    /** Get a UITick of all links. */
    pack(): UITick {
        const tags = <{[key: string]: string}>{};
        const props = <{[key: string]: {[key: string]: any}}>{};
        for (const [uid, link] of this.links.entries()) {
            [tags[uid], props[uid]] = link.flatten();
        }
        return [this.activeStage?.id || 0, tags, props, {}];
    }

    /** Mark game as started and disallow changing configuration. */
    start() {
        freeze(this.#config);
        freeze(this.#packs);
        freeze(this.#banned);
        this.#state = 1;
        this.updateRoom();
    }

    /** Connect to remote hub. */
    connect(url: string) {
        this.#worker.connect(url);
    }

    /** Disconnect from remote hub. */
    disconnect() {
        this.#worker.disconnect();
    }

    /** Add component update (called by Link). */
    #tick(id: number, item: TickItem) {
        if (this.#ticks.length === 0) {
            // schedule a UITick if no pending UITick exists
            setTimeout(() => this.#update());
        }
        this.#ticks.push([this.activeStage?.id ?? null, id, item]);
    }

    /** Set active stage (called by Stage). */
    #focus(content?: [Stage, StageCallback]) {
        this.#active = content ?? null;
    }

    /** Create a UITick from this.#history. */
    #update() {
        let stageID: number | null = -1;
        let tagChanges: {[key: string]: string | null} = {};
        let propChanges: {[key: string]: {[key: string]: any}} = {};
        let calls: {[key: string]: [string, any][]} = {};

        // save current timestamp in this.#history
        const now = Date.now();

        for (const entry of this.#ticks) {
            const [sid, id, item] = entry;

            // split UITick by stage change
            if (sid !== stageID) {
                if (stageID !== -1) {
                    this.#worker.broadcast([stageID, tagChanges, propChanges, calls]);
                    tagChanges = {}
                    propChanges = {};
                    calls = {};
                }
                stageID = sid;
            }

            // merge history entries into a single UITick
            if (Array.isArray(item)) {
                calls[id] ??= [];
                calls[id].push(item);
            }
            else if (item && typeof item === 'object') {
                propChanges[id] ??= {};
                Object.assign(propChanges[id], item);
            }
            else {
                tagChanges[id] = item;
            }

            this.#history.push([now, entry]);
        }

        this.#worker.broadcast([stageID, tagChanges, propChanges, calls]);
        this.#ticks.length = 0;
    }

    /** Dispatch message from client. */
    async #dispatch(data: ClientMessage) {
        try {
            const [uid, sid, id, result, done] = data;
            if (id < 0) {
                // reload UI upon error
                this.#worker.send(uid, this.pack());
            }
            else if (this.#active && sid === this.#active[0].id && this.links.get(id)?.owner === uid) {
                // send result to listener
                this.#active[1].apply(this.#active[0], [id, result, done]);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}