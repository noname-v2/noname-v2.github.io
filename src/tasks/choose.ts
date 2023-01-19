import { Task } from './task';
import type { Select, Link, ClientSelect, SelectData } from '../types-worker';

export class Choose extends Task {
    /** Has time limit. */
    timeout: number | null = null;

    /** Allow not choosing. */
    forced: boolean = false;

    /** Selection configurations. */
    selects!: Set<Select>;

    /** Map: Select -> Link. */
    #links = new Map<Select, Link<SelectData>> ();

    /** Map: Link -> Select. */
    #selects = new Map<Link<SelectData>, Select>();

    main() {
        // await selection from player
        this.add('choose');

        // clean up selection
        this.add('clear');
    }

    /** Update player data. */
    choose() {
        for (const select of this.selects) {
            // initialize selection and timer
            const [cs, link] = this.initSelect(select);
            link.await(cs.timer ? cs.timer[0] : null, 'checkUpdate');
        }
    }

    /** Initialize selection. */
    initSelect(select: Select): [ClientSelect, Link<SelectData>] {
        const [cs, link] = this.parseSelect(select);
        this.#links.set(select, link);
        this.#selects.set(link, select);
        link.data.select = cs;
        return [cs, link];
    }

    /** Create ClientSelect from Select. */
    parseSelect(select: Select): [ClientSelect, Link<SelectData>] {
        // skip type checking for task methods
        const task = select.task as any;

        // min and max number of selected items
        let num: [number, number];

        if (typeof select.num === 'number') {
            num = [select.num, select.num];
        }
        else if (Array.isArray(select.num)) {
            if (typeof select.num[0] !== 'number' || typeof select.num[1] !== 'number') {
                throw('invalid selection number ' + select.num);
            }
            num = [select.num[0], select.num[1]];
        }
        else if (typeof select.num === 'string') {
            // will be determined later by this.filterSelect()
            num = [0, 0]
        }
        else {
            num = [1, 1]
        }

        // initialize ClientSelect
        const cs: ClientSelect = {links: {}, items: {}, num};

        if (typeof select.num !== 'string' && (!select.filter || task[select.filter].length < 3)) {
            // selection does not require update from worker, requires:
            // 1. select.num is independent of selected items
            // 2. select.filter is independent of selected items
            cs.simple = true;
        }

        if (select.forced) {
            cs.forced = true;
        }
        
        // copy item entries from Select to ClientSelect
        for (const item of select.items) {
            if (typeof item === 'string') {
                cs.items[item] = 0;
            }
            else {
                cs.links[item.id] = 0;
            }
        }

        // determine select.num and filter available items (for complex selection only)
        this.filterSelect(select, cs);
        
        if (select.filter && task[select.filter].length < 3) {
            // one-timer filter for simple selection
            for (const item of select.items) {
                if (!task[select.filter](item, select)) {
                    if (typeof item === 'string') {
                        cs.items[item] = -1;
                    }
                    else {
                        cs.links[item.id] = -1;
                    }
                }
            }
        }

        // time limit of the selection
        if (select.previous) {
            // inherit timer of  previous selection
            const timer = this.#links.get(select.previous)!.data.select?.timer;
            if (timer) {
                cs.timer = timer;
            }
        }
        else if (this.arena.connected) {
            // set timer based on local or global timeout
            const timeout =  this.timeout ?? this.arena.config.timeout;
            if (timeout) {
                cs.timer = [timeout, Date.now()];
            }
        }

        return [cs, typeof select.target === 'string' ? task[select.target](select) : select.target];
    }

    /** Update selectable items for complex selections. */
    filterSelect(select: Select, cs: ClientSelect): Partial<ClientSelect> {
        const task = select.task as any;
        const csu: Partial<ClientSelect> = {}

        // update select.num
        if (typeof select.num === 'string') {
            const num = task[select.num](select, cs);
            if (cs.num[1] !== num[0] || cs.num[1] !== num[1]) {
                csu.num = num;
                cs.num = num;
            }
        }

        // check whether items are selectable (only if filter function takes cs as argument)
        if (select.filter && task[select.filter].length >= 3) {
            for (const item of select.items) {
                const section = typeof item === 'string' ? 'items' : 'links';
                const sid = typeof item === 'string' ? item : item.id.toString();

                if (cs[section][sid] !== 1) {
                    // item is not selected
                    const stat = task[select.filter](sid, select, cs) ? 0 : -1;
                    if (stat !== cs[section][sid]) {
                        cs[section][sid] = stat;
                        csu[section] ??= {};
                        csu[section]![sid] = stat;
                    }
                }
            }
        }

        return csu;
    }

    /** Handle update from client.
     * @param {Pick<ClientSelect, 'items' | 'links'>} sel - Items with selection status changed.
     * @param {boolean?} progress - 0: reselect. 1: progress to next level. 2: return to previous level (or cancel if no previous level).
     * @param {Link} link - Link the handles selection.
     */
    checkUpdate([sel, progress]: [Pick<ClientSelect, 'items' | 'links'>, (0 | 1 | -1)?], link: Link<SelectData>) {
        const select = this.#selects.get(link);
        if (!select) {
            return;
        }

        const cs = link.data.select;
        const csu: Partial<ClientSelect> = {};
        const task = select.task as any;
        const sections = <('items' | 'links')[]>['items', 'links'];

        if (progress === 0 || !select || !cs || select.next || !sel) {
            // illegal selection from client
            this.resetSelect(select);
            return;
        }

        if (progress === -1) {
            if (select.previous) {
                // go to previous level of selection
                this.resetSelect(select.previous);
            }
            else if (select.forced) {
                // reset current selection
                this.resetSelect(select);
            }
            else {
                // cancel selection
                this.clearSelect(select);
                link.respond();
            }
            return;
        }

        // has selection changes
        let patched = false;

        for (const section of sections) {
            for (const sid in sel[section]) {
                if (sel[section][sid] !== 0 && sel[section][sid] !== 1) {
                    // selection is not 0 or 1
                    this.resetSelect(select);
                    return;
                }
                
                if (cs[section][sid] !== sel[section][sid]) {
                    if (cs[section][sid] === -1) {
                        // item not selectable
                        this.resetSelect(select);
                        return;
                    }
                    
                    cs[section][sid] = sel[section][sid];
                    
                    if (!cs.simple && patched) {
                        // only 1 selection update is allowed at a time for complex selection
                        this.resetSelect(select);
                        return;
                    }

                    patched = true;
                }
            }
        }

        if (patched) {
            if (!cs.simple) {
                // update select.num and items
                this.utils.apply(csu, this.filterSelect(select, cs))
            }

            link.patch('select', csu);
        }

        // automatic progress if only 1 selection number is accepted and select.next exists
        if (!progress && cs.num[0] === cs.num[1] && select.progress) {
            select.next = task[select.progress](select, cs);
        }

        // progress to next level or finish selection
        if (progress || select.next) {
            if (select.progress && !select.next) {
                // update select.next
                select.next = task[select.progress](select, cs);
            }
            
            if (select.next) {
                // progress to next level of selection
                select.next.previous = select;
                cs.blurred = csu.blurred = true;
                this.initSelect(select.next);
            }
            else {
                // selection done
                let n = 0;

                for (const section of sections) {
                    for (const sid in cs[section]) {
                        if (cs[section][sid] === 1) {
                            n++;
                        }
                    }
                }

                if (n >= cs.num[0] && n <= cs.num[1]) {
                    const css: ClientSelect[] = [cs];
                    let root = select;

                    while (root.previous) {
                        root = root.previous;
                        css.unshift(this.#links.get(root)!.data.select!);
                    }

                    this.clearSelect(root);
                    this.#links.get(root)!.respond(css);
                    return;
                }
            }
        }

        // send updates to client
        if (Object.keys(csu).length) {
            link.patch('select', csu);
        }
    }

    /** Clear all selections. */
    clear() {
        for (const select of this.#selects.values()) {
            if (!select.previous) {
                this.clearSelect(select);
            }
        }
    }

    /** Clear a selection. */
    clearSelect(select: Select) {
        const link = this.#links.get(select);

        if (link) {
            if (typeof select.target === 'string') {
                // remove dynamically created component
                link.unlink();
            }
            else {
                // reset link selection
                link.data.select = null;
            }

            this.#selects.delete(link);
        }

        this.#links.delete(select);

        if (select.next) {
            this.clearSelect(select.next);
        }
    }

    /** Reset a selection. */
    resetSelect(select: Select) {
        this.clearSelect(select);
        this.initSelect(select);
    }
}