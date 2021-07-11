import type { Stage, StageLocation } from './stage';

export class StageAccessor {
    /** Original Stage object. */
    #stage: Stage;

    get game() {
        return this.#stage.game.accessor;
    }

    get id() {
        return this.#stage.id;
    }

    get content() {
        return this.#stage.content;
    }
    
    get parent(): StageAccessor | null {
        return this.#stage.location ? this.#stage.location[0].accessor : null;
    }

    get current(): StageLocation | null {
        if ([0, 1].includes(this.#stage.step)) {
            return 'before';
        }
        if ([2, 3, 4].includes(this.#stage.step)) {
            return 'main';
        }
        if ([5, 6].includes(this.#stage.step)) {
            return 'after';
        }
        return null;
    }

    get skipped() {
        return this.#stage.mode === 1;
    }

    get cancelled() {
        return this.#stage.mode === 2;
    }

    get done() {
        return this.#stage.step === 7;
    }

    /** Get all siblings. */
    get siblings() {
        const siblings = [];
        for (const stage of this.#stage.location![0].getChildren(this.#stage.location![1])!) {
            siblings.push(stage.accessor);
        }
        return siblings;
    }

    get results() {
        return this.#stage.results;
    }

    constructor(stage: Stage) {
        this.#stage = stage;
    }

    /** Skip stage (may trigger skip event). */
    skip() {
        if (this.#stage.step <=2 ) {
            this.#stage.step = 5;
            this.#stage.mode = 1;
            return true;
        }
        return false;
    }

    /** Force stage to finish (without triggering any additional event). */
    cancel() {
        if (this.#stage.step === 0) {
            this.#stage.step = 7;
            this.#stage.mode = 2;
            return true;
        }
        return false;
    }

    /** Get the first sibling stage with name.
     * @param {string} name - Sibling name.
     */
    getSibling(select: string | number): StageAccessor | null {
        if (this.parent) {
            const siblings = this.#stage.location![0].getChildren(this.#stage.location![1])!;
            for (let i = 0; i < siblings.length; i++) {
                if (Object.is(siblings[i].accessor, this)) {
                    if (typeof select === 'number') {
                        return siblings[i + select]?.accessor ?? null;
                    }
                }
                else if (siblings[i].content === select || siblings[i].content.endsWith('.' + select)) {
                    return siblings[i].accessor;
                }
            }
        }
        return null;
    }

    /** Add a child stage. */
    add(content: string) {
        if (!this.current) {
            throw('stage has no location yet');
        }
        const stage = this.#stage.game.createStage(this.#stage.getContent(content), [this.#stage, this.current]);
        this.#stage.getChildren()!.push(stage);
        return stage.accessor;
    }

    /** Add a sibling next to this. */
    addSibling(content: string) {
        const stage = this.#stage.game.createStage(this.#stage.getContent(content), this.#stage.location!);
        const siblings = this.#stage.location![0].getChildren(this.#stage.location![1])!;

        for (let i = 0; i < siblings.length; i++) {
            if (Object.is(siblings[i].accessor, this)) {
                siblings.splice(i + 1, 0, stage);
                return stage.accessor;
            }
        }
        throw('failed to add sibling');
    }

    /** Get function based on this.content. */
    getRule(content?: string | null, content2?: string | null, content3?: string | null) {
        if (typeof content2 === 'string') {
            content = (content ?? '') + ':' + content2;
        }
        if (typeof content3 === 'string') {
            content = (content ?? '') + '/' + content3
        }
        return this.#stage.game.getRule(this.#stage.getContent(content));
    }

    /** Create a new element. */
    create(tag: string) {
        return this.#stage.game.create(tag);
    }

    [key: string]: any;
}
