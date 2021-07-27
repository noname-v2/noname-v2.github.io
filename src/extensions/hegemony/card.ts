import type { CardCollection } from '../sgs/sgs';

export const card = {
    guowuxie: {
        name: '无懈可击·国',
        caption: '无懈可击',
        intro: '一张锦囊牌生效前，对此牌使用。抵消此牌对一名角色及其相同势力产生的效果，或抵消另一张@(standard.wuxie)产生的效果。',
        type: 'trick',
        subtype: 'instant',
        originated: 'standard:wuxie',
        label: ['國']
    },
    yiyi: {
        name: '以逸待劳',
        intro: '出牌阶段对与自己势力相同的所有角色使用，摸两张牌然后弃置两张牌',
        type: 'trick',
        subtype: 'instant'
    },
    yuanjiao: {
        name: '远交近攻',
        intro: '出牌阶段对一名不同势力的角色使用，对方摸一张牌，然后你摸3张牌',
        type: 'trick',
        subtype: 'instant'
    },
    zhiji: {
        name: '知己知彼',
        intro: '出牌阶段对一名其他角色使用，观看其手牌或武将牌',
        type: 'trick',
        subtype: 'instant'
    },
    sanjian: {
        name: '三尖两刃刀',
        intro: '当你使用杀造成伤害后，可以弃置1张手牌对一名距离受伤害角色1以内的其他角色造成1点伤害',
        type: 'equip',
        subtype: 'weapon',
        range: 3
    },
    wuliu: {
        name: '吴六剑',
        intro: '其他与装备者势力相同的角色攻击范围+1',
        type: 'equip',
        subtype: 'weapon',
        range: 2
    }
} as CardCollection;