import type { CardCollection } from '../sgs/sgs';

export const card = {
    chiling: {
        name: '敕令',
        intro: '出牌阶段，对所有没有势力的角色使用。目标角色选择一项：1、明置一张武将牌，然后摸一张牌；2、弃置一张装备牌；3、失去1点体力。当@(conqueror.chiling)因判定或弃置而置入弃牌堆时，系统将之移出游戏，然后系统于当前回合结束后视为对所有没有势力的角色使用@(conqueror.chiling)。',
        type: 'trick',
        subtype: 'instant',
        subpack: '势备篇'
    },
    diaohu: {
        name: '调虎离山',
        intro: '出牌阶段，对至多两名其他角色使用。目标角色于此回合结束之前不计入距离的计算且不能使用牌且不是牌的合法目标。此牌结算结束时，你摸一张牌',
        type: 'trick',
        subtype: 'instant',
        subpack: '势备篇'
    },
    huoshao: {
        name: '火烧连营',
        intro: '出牌阶段，对你的下家和与其处于同一队列的角色使用，每名角色受到一点火焰伤害。',
        type: 'trick',
        subtype: 'instant',
        subpack: '势备篇'
    },
    lianjun: {
        name: '联军盛宴',
        intro: '出牌阶段，对你和你选择的除你的势力外的一个势力的所有角色。若目标角色：为你，你摸X张牌（X为该势力的角色数）；不为你，其选择一项：1、回复1点体力；2、摸一张牌，然后重置。',
        type: 'trick',
        subtype: 'instant',
        subpack: '势备篇'
    },
    luli: {
        name: '勠力同心',
        intro: '出牌阶段，对所有大势力角色或所有小势力角色使用。若目标角色：不处于“连环状态”，其横置；处于“连环状态”，其摸一张牌。',
        type: 'trick',
        subtype: 'instant',
        subpack: '势备篇'
    },
    shuiyan: {
        name: '水淹七军',
        intro: '出牌阶段，对一名装备区里有牌的其他角色使用。目标角色选择一项：1、弃置装备区里的所有牌；2、受到你造成的1点雷电伤害。',
        type: 'trick',
        subtype: 'instant',
        subpack: '势备篇'
    },
    xietian: {
        name: '挟天子以令诸侯',
        caption: '挟天子以<br>令诸侯',
        abbr: '挟令',
        intro: '出牌阶段，对为大势力角色的你使用。你结束出牌阶段，若如此做，此回合结束时，你可以弃置一张牌，获得一个额外的回合。',
        type: 'trick',
        subtype: 'instant',
        subpack: '势备篇'
    },
    qinglong: {
        name: '青龙偃月刀',
        intro: '你使用@(standard.sha)指定一名角色为目标后，该角色不能明置武将牌，直到此@(standard.sha)结算完毕。',
        type: 'equip',
        subtype: 'weapon',
        range: 3,
        subpack: '势备篇'
    },
    fangtian: {
        name: '方天画戟',
        intro: '你使用的@(standard.sha)可以指定任意名势力各不相同的角色及未确定势力的角色为目标。当此@(standard.sha)被一名目标角色使用@(standard.shan)抵消时，此@(standard.sha)对其他目标角色无效。',
        type: 'equip',
        subtype: 'weapon',
        range: 4,
        subpack: '势备篇'
    },
    huxin: {
        name: '护心镜',
        intro: '当你受到伤害时，若伤害值大于或等于你的体力值，则你可以将@(conqueror.huxin)置入弃牌堆，然后防止此伤害。',
        type: 'equip',
        subtype: 'armor',
        subpack: '势备篇'
    },
    mingguang: {
        name: '明光铠',
        intro: '@(锁定技) 当你成为@(conqueror.huoshao)、@(maneuver.huogong)或火@(standard.sha)的目标时，取消之；若你是小势力角色，你不会被横置。',
        type: 'equip',
        subtype: 'armor',
        subpack: '势备篇'
    },
    jingfan: {
        name: '惊帆',
        intro: '你计算与其他角色的距离-1。',
        type: 'equip',
        subtype: 'horse',
        distance: -1,
        subpack: '势备篇'
    },
    yuxi: {
        name: '玉玺',
        intro: '@(锁定技) 若你有明置的武将牌，你的势力视为唯一的大势力；锁定技，摸牌阶段，若你有明置的武将牌，你多摸一张牌；锁定技，出牌阶段开始时，若你有明置的武将牌，你视为使用@(standard_hege.zhiji)。',
        type: 'equip',
        subtype: 'treasure',
        subpack: '势备篇'
    },
    dinglan: {
        name: '定澜夜明珠',
        intro: '@(锁定技) 你视为拥有技能@(standard_hege.zhiheng)，若你已经有@(standard_hege.zhiheng)，则改为取消弃置牌数的限制。',
        type: 'equip',
        subtype: 'treasure',
        subpack: '君主专属'
    },
    feilong: {
        name: '飞龙夺凤',
        intro: '当你使用@(standard.sha)指定一名角色为目标后，你可令该角色弃置一张牌。你使用@(standard.sha)杀死一名角色后，若你所属的势力是全场最少的（或之一），你可令该角色的使用者选择是否从未使用的武将牌中选择一张与你势力相同的武将牌重新加入游戏。',
        type: 'equip',
        subtype: 'weapon',
        subpack: '君主专属'
    },
    taiping: {
        name: '太平要术',
        intro: '@(锁定技) 防止你受到的所有属性伤害；全场每有一名与你势力相同的角色存活，所有此势力角色的手牌上限便+1；当你失去装备区里的@(conqueror.taiping)时，你失去1点体力，然后摸两张牌。',
        type: 'equip',
        subtype: 'treasure',
        subpack: '君主专属'
    },
    liulong: {
        name: '六龙骖驾',
        intro: '@(锁定技) 当你计算与与你势力不同的角色的距离时，始终-1；当与你势力不同的角色计算与你的距离时，始终+1。@(锁定技) 当此牌进入你的装备区时，弃置你装备区里其他坐骑牌。只要此牌在你的装备区里，你的装备区便不能置入其他坐骑牌。',
        type: 'equip',
        subtype: 'horse',
        distance: [1, -1],
        subpack: '君主专属'
    }
} as CardCollection;