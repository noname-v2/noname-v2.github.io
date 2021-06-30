export const config = {
    online: {
        name: '联机模式',
        intro: '允许其他玩家通过主页的联机键加入游戏。',
        init: 'off',
        options: [
            ['off', '关闭'],
            ['private', '私密'],
            ['public', '公开']
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