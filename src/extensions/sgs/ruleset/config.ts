export const config = {
    online: {
        name: '联机模式',
        intro: '允许其他玩家通过主页的联机键加入游戏。',
        init: false
    },
    online_join: {
        name: '允许中途加入',
        intro: '允许旁观玩家在游戏过程中加入游戏。',
        init: true
    },
    online_timeout: {
        name: '出牌时限',
        init: 30,
        options: [
            [15, '<span class="mono">15</span>秒'],
            [30, '<span class="mono">30</span>秒'],
            [60, '<span class="mono">1</span>分钟'],
            [120, '<span class="mono">2</span>分钟']
        ]
    },
    specify_hero: {
        name: '点将',
        intro: '允许玩家自由选择武将。',
        init: false
    },
    allow_mulligan: {
        name: '手气卡',
        intro: '游戏开始时玩家可以更换一次手牌。',
        init: true
    }
}