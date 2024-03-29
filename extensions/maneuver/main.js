const skill = {};

var main = {
    cardpack: '军争',
    skill,
    card: {
        huosha: {
            name: '火杀',
            caption: ['殺', 'darkred'],
            intro: '出牌阶段，对攻击范围内的一名角色使用，令其使用一张@(standard:card.shan)或受到一点火属性伤害。',
            type: 'basic',
            decoration: 'fire',
            originated: 'standard:sha',
            label: 'fire'
        },
        leisha: {
            name: '雷杀',
            caption: ['殺', 'darkblue'],
            intro: '出牌阶段，对攻击范围内的一名角色使用，令其使用一张@(standard:card.shan)或受到一点雷属性伤害。',
            type: 'basic',
            decoration: 'thunder',
            originated: 'standard:sha',
            label: 'thunder'
        },
        jiu: {
            name: '酒',
            intro: '出牌阶段，对自己使用，令自己的下一张使用的@(standard:card.sha)造成的伤害+1（每回合限使用1次）；濒死阶段，对自己使用，回复1点体力',
            caption: '酒',
            type: 'basic'
        },
        huogong: {
            name: '火攻',
            intro: '目标角色展示一张手牌，然后若你能弃掉一张与所展示牌相同花色的手牌，则火攻对该角色造成1点火焰伤害。',
            type: 'trick',
            subtype: 'instant'
        },
        tiesuo: {
            name: '铁锁连环',
            intro: '出牌阶段使用，选择1至2个角色，分别横置或重置这些角色。可重铸。',
            type: 'trick',
            subtype: 'instant'
        },
        bingliang: {
            name: '兵粮寸断',
            intro: '目标角色判定阶段进行判定：若判定结果不为梅花，则跳过该角色的摸牌阶段。',
            type: 'trick',
            subtype: 'delayed'
        },
        hualiu: {
            name: '骅骝',
            intro: '其他角色计算与你的距离+1。',
            type: 'equip',
            subtype: 'horse',
            distance: 1
        },
        zhuque: {
            name: '朱雀羽扇',
            intro: '你可以将一张普通@(standard:card.sha)当@(maneuver:card.huosha)使用。',
            type: 'equip',
            subtype: 'weapon',
            range: 4
        },
        guding: {
            name: '古锭刀',
            intro: '@(锁定技) 当你使用@(standard:card.sha)对目标角色造成伤害时，若其没有手牌，此伤害+1。',
            type: 'equip',
            subtype: 'weapon',
            range: 2
        },
        tengjia: {
            name: '藤甲',
            intro: '@(锁定技) @(standard:card.nanman)、@(standard:card.wanjian)和普通@(standard:card.sha)对你无效。你每次受到火焰伤害时，该伤害+1。',
            type: 'equip',
            subtype: 'armor'
        },
        baiyin: {
            name: '白银狮子',
            intro: '@(锁定技) 你每次受到伤害时，最多承受1点伤害（防止多余的伤害）；当你失去装备区里的@(maneuver:card.baiyin)时，你回复1点体力。',
            type: 'equip',
            subtype: 'armor'
        },
        muniu: {
            name: '木牛流马',
            intro: '出牌阶段限一次，你可以将一张手牌扣置于你装备区里的@(maneuver:card.muniu)下，若如此做，你可以将此装备移动到一名其他角色的装备区里；你可以将此装备牌下的牌如手牌般使用或打出。',
            type: 'equip',
            subtype: 'treasure'
        }
    },
    lib: {
        subtype: {
            'equip.treasure': '宝物'
        },
        label: {
            fire: ['火'],
            thunder: ['雷']
        }
    },
    pile: {
        huosha: {
            heart: [4, 7, 10],
            diamond: [4, 5]
        },
        leisha: {
            spade: [4, 5, 6, 7, 8],
            club: [5, 6, 7, 8]
        },
        'standard:shan': {
            heart: [8, 9, 11, 12],
            diamond: [6, 7, 8, 10, 11]
        },
        'standard:tao': {
            heart: [5, 6],
            diamond: [2, 3]
        },
        jiu: {
            diamond: [9],
            spade: [3, 9],
            club: [3, 9]
        },
        hualiu: { diamond: [13] },
        baiyin: { club: [1] },
        tengjia: { spade: [2], club: [2] },
        guding: { spade: [1] },
        zhuque: { diamond: [1] },
        huogong: { heart: [2, 3], diamond: [12] },
        tiesuo: { spade: [11, 12], club: [10, 11, 12, 13] },
        'standard:wuxie': {
            heart: [1, 13],
            spade: [13]
        },
        bingliang: { spade: [10], club: [4] },
        muniu: { diamond: [5] }
    }
};

export { main as default };
