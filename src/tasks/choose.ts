import { Task } from './task';
import type { Player, Select, Link, ClientSelect, SelectData } from '../types-worker';

export class Choose extends Task {
    /** Has time limit. */
    timeout: number | null = null;

    /** Allow not choosing. */
    forced: boolean = false;

    /** Selection configurations. */
    selects!: Set<Select>;

    /** Created links for selection. */
    links!: Map<Select, number>;

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
            const [cs, link] = this.parseSelect(select);
            this.links.set(select, link.id);
            link.data.select = cs;
            link.monitor('checkUpdate');
            link.await(cs.timer ? cs.timer[0] : null);
        }
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

        // filter available items
        if (!cs.simple) {
            this.filterSelect(select, cs);
        }
        else if (select.filter) {
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
        if (this.arena.connected) {
            const timeout =  this.timeout ?? this.arena.config.timeout;
            if (timeout) {
                cs.timer = [timeout, Date.now()];
            }
        }

        return [cs, typeof select.target === 'string' ? task[select.target](select) : select.target];
    }

    /** Update selectable items. */
    filterSelect(select: Select, cs: ClientSelect) {
        const task = select.task as any;
        const update: ClientSelectUpdate = {}

        // update select.num
        if (typeof select.num === 'string') {
            const num = task[select.num](select, cs);
            if (cs.num[1] !== num[0] || cs.num[1] !== num[1]) {
                update.num = num;
            }
            cs.num = num;
        }

        // check whether items are selectable (only if filter function takes cs as argument)
        if (select.filter && this.arena.countArgs(select.filter) >= 3) {
            const selected: (string | number)[] = [];

            for (const )
            for (const id of select.items) {
                const items = typeof id === 'number' ? cs.items : cs.bindItems;
                if (items[id] !== 1) {
                    const stat = this.arena.callTask(select.filter, id, select, cs) ? 0 : -1;
                    if (stat !== items[id]) {
                        items[id] = stat;
                        if (typeof id === 'number') {
                            update.items ??= {};
                            update.items[id] = stat;
                        }
                        else {
                            update.bindItems ??= {};
                            update.bindItems[id] = stat;
                        }
                    }
                }
            }
        }

        return [update, bindingUpdate];
    }

    /** Handle update from client.
     * @param {number} level - Level of selection.
     * @param {string} selected - Stringified IDs of selected items, null if no selection change.
     * @param {boolean?} progress - Finish current level of selection.
     * @param {Player} player - Player link.
     */
    checkUpdate([level, selected, progress]: [number, string[] | null | 0, boolean?], player: Player) {
        let cs: ClientSelect = player.data.select!;
        let csu: ClientSelectUpdate = {};
        let select: Select = this.selects.get(player.id)!;
        const update = csu;

        if (!select || !cs) {
            // illegal selection from client
            this.initSelect(player);
            return;
        }

        // go to current level of selection
        for (let i = 0; i < level; i++) {
            if (!select.next || !cs.next) {
                this.initSelect(player);
                return;
            }
            
            select = select.next;
            cs = cs.next;
            csu = csu.next = {};
        }

        if (selected) {
            // items that changed selection state
            csu.items = {};

            // make sure selected items are legal
            for (const sid of selected) {
                if (cs.items[sid] !== 0 && cs.items[sid] !== 1) {
                    // illegal selection from client
                    this.initSelect(player);
                    return;
                }
            }
    
            // update selected items
            for (const sid in cs.items) {
                if (cs.items[sid] !== -1) {
                    const stat = selected.includes(sid) ? 1 : 0;
                    if (stat !== cs.items[sid]) {
                        cs.items[sid] = csu.items[sid] = stat;
                    }
                }
            }
    
            // update selectable items
            if (Object.keys(csu.items).length) {
                const update = this.filterSelect(select, cs);
                if (Object.keys(update).length) {
                    for (const key in update) {
                        // @ts-ignore
                        csu[key] = update[key];
                    }
                }
            }
            else {
                delete csu.items;
            }
        }

        // update sent by created component
        if (selected === 0) {
            this.arena.callTask(select.create!.monitor!, select, cs, progress);
            return;
        }

        // progress to next level or finish selection
        if (progress) {
            if (select.progress) {
                // update select.next
                select.next = this.arena.callTask(select.progress, select, cs);
            }
            
            if (select.next) {
                // progress to next level of selection
                select.next.id = player.id;
                select.next.previous = select;
                cs.next = csu.next = this.parseSelect(select.next!);
            }
            else {
                // selection done
                player.respond();
                return;
            }
        }

        // send updates to client
        if (Object.keys(csu).length) {
            player.patch('select', update);
        }
    }

    /** Clear all selections. */
    clear() {
        for (const id of this.selects.keys()) {
            this.clearPlayer(id);
        }
    }

    /** Clear the selection of target player. */
    clearPlayer(id: number) {
        for (const select of this.tile(this.selects.get(id)!)) {
            // remove dynamically created components
            if (select.bind && select.create) {
                this.arena.getLink(select.bind).unlink();
                delete select.bind;
            }
        }

        // clear selections
        this.arena.getPlayer(id)!.data.select = null;
    }

    /** Convert select with property next to list of selects. */
    tile(select?: Select) {
        const selects: Select[] = [];
        
        while (select) {
            selects.unshift(select);
            select = select.next;
        }

        return selects;
    }
}