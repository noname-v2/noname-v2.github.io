import { Stage } from './stage';
import { Link } from './link';
import { GameAccessor } from './game-acc';
import type { StageLocation } from './stage';
import type { Worker, ClientMessage, UITick } from './worker';
import type { Extension } from './extension';

export class Game {
    /** Root game stage. */
    rootStage!: Stage;

    /** Currently active game stage. */
    activeStage: Stage | null = null;

    /** Stage of the main game loop. */
    gameStage: Stage | null = null;

    /** Links to components. */
    links = new Map<number, Link>();

    /** Game mode. */
    mode: string;

    /** Mode configuration. */
    config: {[key: string]: any};

    /** Hero packages. */
    packs: Set<string>;

    /** Disabled hero packages. */
    disabledHeropacks: Set<string>;

    /** Disabled card packages. */
    disabledCardpacks: Set<string>;

    /** Stage counter. */
    stages = new Map<number, Stage>();

    /** Loaded extensions. */
    extensions = new Map<string, Extension>();

    /** Worker reference. */
    worker: Worker;

    /** Arena link. */
    arena!: Link;

    /** Game ruleset. */
    ruleset!: {[key: string]: any};

    /** An accessor to avoid exposing unsafe properties to extensions. */
    accessor = new GameAccessor(this);

    /** Can apply UITick. */
    get tickable() {
        return [2, 3].includes(this.activeStage?.step!);
    }

    /** Main game loop has started */
    get started() {
        return this.gameStage?.step ? true : false;
    }

    constructor(content: [string, string[], string[], string[], {[key: string]: any}, [string, string]], worker: Worker) {
        self.onmessage = async ({data: [uid, sid, id, result, done]}: {data: ClientMessage}) => {
            if (id < 0) {
                //////
            }
            else if (sid === this.activeStage?.id) {
                const link = this.links.get(id);
                if (link?.owner === uid) {
                    this.activeStage.onyield(id, result, done);
                }
            }
        };

        this.mode = content[0];
        this.worker = worker;
        this.packs = new Set(content[1]);
        this.disabledHeropacks = new Set(content[2]);
        this.disabledCardpacks = new Set(content[3]);
        this.config = content[4];
        this.worker.info = content[5];

        const apply = (from: {[key: string]: any}, to: {[key: string]: any}) => {
            for (const key in from) {
                if (typeof from[key] === 'object' && typeof to[key] === 'object') {
                    if (from[key] === null) {
                        delete to[key];
                    }
                    else {
                        apply(from[key], to[key]);
                    }
                }
                else {
                    to[key] = from[key];
                }
            }
            return to;
        };

        const getRuleSet = async (name: string): Promise<any> => {
            const ext = await this.getExtension(name);
            const ruleset = ext.ruleset || {};

            if (ext.mode?.ruleset) {
                return apply(ruleset, await getRuleSet(ext.mode.ruleset));
            }
            return ruleset;
        };

        getRuleSet(this.mode).then(async ruleset => {
            this.ruleset = this.deepFreeze(ruleset);
            this.rootStage = this.createStage(`${this.mode}:mode/`);

            // load extensions
            for (const name of this.packs) {
                await this.getExtension(name);
            }

            // start game
            while (await this.rootStage.next());
            console.log('game over');
        });
    }

    async getExtension(name: string) {
        if (!this.extensions.has(name)) {
            this.extensions.set(name, (await import(`../extensions/${name}/main.js`)).default);
        }
        return this.extensions.get(name)!;
    }

    create(tag: string) {
        const id = this.links.size + 1;
        const link = new Link(id, tag, this);
        this.links.set(id, link);
        return link;
    }

    createStage(name: string, parent?: [Stage, StageLocation]) {
        const id = this.stages.size + 1;
        const stage = new Stage(id, parent ?? null, name, this);
        this.stages.set(id, stage);
        if (name === this.getRule('#gameStage')) {
            this.gameStage = stage;
        }
        return stage;
    }

    /** Get the function based on string. Format:
     * #<path>: from this.ruleset
     * <extname>:<path>?<section>: from an extension
     */
    getRule(content: string) {
        let rule: any;
        let path: string;

        // get ruleset or extension
        if (content[0] === '#') {
            rule = this.ruleset;
            path = content.slice(1);
        }
        else {
            [rule, path] = content.split(':');
            rule = this.extensions.get(rule);
        }

        // get target
        const [keys, section] = path.split('/');
        for (const key of keys.split('.')) {
            rule = rule[key];
        }

        // return section of the target
        if (section) {
            return rule.contents[section];
        }
        else if (section === '') {
            return rule.content;
        }
        else {
            return rule;
        }
    }

    /** Backup game progress. */
    async backup() {
        //////
    }

    /** Deep freeze object. */
    deepFreeze(obj: any) {
        const propNames = Object.getOwnPropertyNames(obj);

        for (const name of propNames) {
            const value = obj[name];

            if (value && typeof value === 'object') {
                this.deepFreeze(value);
            }
        }

        return Object.freeze(obj);
    }

    /** Get a UITick of all links. */
    pack(): UITick {
        const ui = <{[key: string]: {[key: string]: any}}>{};
        for (const [uid, link] of this.links.entries()) {
            ui[uid] = link.flatten();
        }
        return [this.activeStage?.id || 0, ui, {}];
    }
}