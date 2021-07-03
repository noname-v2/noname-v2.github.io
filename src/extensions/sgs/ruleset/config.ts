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
            [15, '15秒'],
            [30, '30秒'],
            [60, '1分钟'],
            [120, '2分钟']
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