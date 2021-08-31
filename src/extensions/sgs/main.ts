import type { SGS } from './types';
import { tasks } from './tasks/index';
import { classes } from './classes/index';
import { components } from './components/index';

export default {
    mode: { 
        tasks, classes, components,
        config: {
            online: {
                name: '联机模式',
                intro: '允许其他玩家通过主页的联机键加入游戏。',
                init: false
            },
            online_join: {
                name: '允许中途加入',
                intro: '允许旁观玩家在游戏过程中加入游戏。',
                init: true,
                requires: 'online'
            },
            online_timeout: {
                name: '出牌时限',
                init: 30,
                options: [
                    [15, '<span class="mono">15</span>秒'],
                    [30, '<span class="mono">30</span>秒'],
                    [60, '<span class="mono">1</span>分钟'],
                    [120, '<span class="mono">2</span>分钟']
                ],
                requires: 'online'
            },
            online_mulligan: {
                name: '手气卡',
                intro: '游戏开始时玩家可以更换一至两次手牌。',
                init: 0,
                options: [
                    [0, '禁用'],
                    [1, '一次'],
                    [2, '两次']
                ],
                requires: 'online'
            },
            mulligan: {
                name: '手气卡',
                intro: '游戏开始时玩家可以更换任意次手牌。',
                init: false,
                requires: '!online'
            },
            online_choose: {
                name: '点将',
                intro: '允许玩家自由选择武将。',
                init: false,
                requires: 'online'
            },
            choose: {
                name: '点将',
                intro: '允许玩家自由选择武将。',
                init: true,
                requires: '!online'
            },
            game_speed: {
                name: '游戏速度',
                intro: '控制游戏阶事件间的间隔时间。',
                init: 0.3,
                options: [
                    [0.5, '较慢'],
                    [0.3, '正常'],
                    [0.15, '较快']
                ]
            }
        }
    },
    lib: {
        faction: {
            'wei': ['魏', 'blue'],
            'shu': ['蜀', 'brown'],
            'wu': ['吴', 'green'],
            'qun': ['群', 'yellow']
        },
        keyword: {
            '主公技': ['只有身份为主公时才可以发动', 'orange'],
            '锁定技': ['技能于其发动时机若能发动则必须发动', 'blue'],
            '限定技': ['技能于一局游戏内只能发动一次', 'purple'],
            '觉醒技': ['① 技能于其发动时机若能发动则必须发动；② 技能于一局游戏内只能发动一次', 'green']
        },
        type: {
            'basic': '基本',
            'trick': '锦囊',
            'equip': '装备'
        },
        subtype: {
            'equip.weapon': '武器',
            'equip.armor': '防具',
            'equip.mount': '坐骑',
            'trick.instant': '普通锦囊',
            'trick.delayed': '延时锦囊'
        }
    }
} as SGS;