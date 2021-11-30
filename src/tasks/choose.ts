import { Task } from './task';
import { Player } from '../links/link';
import type { Select, ClientSelect, ClientSelectUpdate } from '../types';

export class Choose extends Task {
    /** Has time limit. */
    timeout: number | null = null;

    /** Allow not choosing. */
    forced: boolean = false;

    /** Selection configurations. */
    selects!: Map<number, Select>;

    main() {
        // fill IDs in Select
        for (const [id, select] of this.selects) {
            select.id = id;
        }

        // await selection from player
        this.add('choose');

        // clean up selection
        this.add('clear');
    }

    /** Update player data. */
    choose() {
        for (const id of this.selects.keys()) {
            // initialize selection and timer
            const player = this.arena.getPlayer(id);
            const cs = this.initSelect(player);

            player.monitor('checkUpdate');
            player.await(cs.timer ? cs.timer[0] : null);
        }
    }

    /** Handle update from client.
     * @param {number} level - Level of selection.
     * @param {string} selected - Stringified IDs of selected items, null if no selection change.
     * @param {boolean?} progress - Finish current level of selection.
     * @param {Player} player - Player link.
     */
    checkUpdate([level, selected, progress]: [number, string[] | null, boolean?], player: Player) {
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
                if (typeof cs.items[sid] !== 'number') {
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

    /** Create ClientSelect from Select. */
    parseSelect(select: Select): ClientSelect {
        // min and max number of selected items
        let num: [number, number];
        let simple = true;

        if (typeof select.num === 'number') {
            num = [select.num, select.num];
        }
        else if (Array.isArray(select.num) && typeof select.num[1] === 'number') {
            num = select.num.slice(0) as [number, number];
        }
        else {
            if (Array.isArray(select.num)) {
                // leave [number, string] for this.updateSelect()
                simple = false;
            }
            num = [1, 1]
        }

        if (select.filter && this.arena.countArgs(select.filter) > 2) {
            simple = false;
        }

        const cs: ClientSelect = { items: {}, num };

        if (simple) {
            cs.simple = true;
        }
        
        // filter items if filter is not dependent on selected items
        for (const id of select.items) {
            const sid = typeof id === 'number' ? `#${id}` : id;

            if (simple && !this.arena.callTask(select.filter!, id, select)) {
                cs.items[sid] = -1;
            }
            else {
                cs.items[sid] = 0;
            }
        }
        
        // time limit for the selection (create for the first selection only)
        if (!select.previous && this.arena.connected) {
            const timeout =  this.timeout ?? this.arena.config.timeout;
            if (timeout) {
                cs.timer = [timeout, Date.now()];
            }
        }

        // client-side auxiliary data
        if (select.hasOwnProperty('create')) {
            cs.create = select.create;
        }

        if (select.hasOwnProperty('options')) {
            cs.options = select.options;
        }

        // filter available items
        if (!cs.simple) {
            this.filterSelect(select, cs);
        }

        return cs;
    }

    /** Update selectable items. */
    filterSelect(select: Select, cs: ClientSelect) {
        const update: ClientSelectUpdate = {}

        // update select.num
        if (Array.isArray(select.num) && typeof select.num[1] === 'string') {
            const num = this.arena.callTask(select.num as [number, string], select);
            if (cs.num[1] !== num[0] || cs.num[1] !== num[1]) {
                update.num = num;
            }
            cs.num = num;
        }

        // check whether items are selectable (only if filter function takes cs as argument)
        if (select.filter && this.arena.countArgs(select.filter) === 3) {
            for (const id of select.items) {
                const sid = typeof id === 'number' ? `#${id}` : id;
                if (cs.items[sid] !== 1) {
                    const stat = this.arena.callTask(select.filter, id, select, cs) ? 0 : -1;
                    if (stat !== cs.items[sid]) {
                        cs.items[sid] = stat;
                        update.items ??= {};
                        update.items[sid] = stat;
                    }
                }
            }
        }

        return update;
    }

    /** Set initial selection state. */
    initSelect(player: Player) {
        const select = this.selects.get(player.id)!
        const cs = this.parseSelect(select);
        player.data.select = cs;
        return cs;
    }

    /** Clear all selections. */
    clear() {
        for (const id of this.selects.keys()) {
            this.arena.getPlayer(id)!.data.select = null;
        }
    }
}