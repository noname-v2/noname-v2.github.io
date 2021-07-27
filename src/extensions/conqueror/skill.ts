import type { SkillDict } from '../sgs/sgs';

export const skill = {
    zijiang: {
        name: '资粮',
        intro: '@(副将技) 当与你势力相同的一名角色受到伤害后，你可以将一张“田”交给该角色。'
    },
    jixi: {
        name: '急袭',
        intro: '@(主将技) 此武将牌减少半个阴阳鱼；你可以将一张“田”当@(standard.shunshou)使用。'
    },
    huyuan: {
        name: '护援',
        intro: '结束阶段，你可以将一张装备牌置入一名角色的装备区，然后你可以弃置该角色距离为1的一名角色的一张牌。'
    },
    heyi: {
        name: '鹤翼',
        intro: '@(阵法技) 与你处于同一队列的其他角色拥有@(conqueror.feiying)。'
    },
    feiying: {
        name: '飞影',
        intro: '@(锁定技) 其他角色计算与你的距离+1。'
    },
    shengxi: {
        name: '生息',
        intro: '弃牌阶段开始时，若你此回合内没有造成过伤害，你可以摸两张牌。'
    },
    shoucheng: {
        name: '守成',
        intro: '当与你势力相同的一名角色于其回合外失去最后手牌时，你可以令其摸一张牌。'
    },
    yizhi: {
        name: '遗志',
        intro: '@(副将技) 此武将牌上单独的阴阳鱼个数-1。若你的主将拥有技能@(standard_hege.guanxing)，则将其描述中的X改为5；若你的主将没有技能@(standard_hege.guanxing)，则你拥有技能@(standard_hege.guanxing)。'
    },
    tianfu: {
        name: '天覆',
        intro: '@(主将技) @(阵法技) 若当前回合角色与你处于同一队列，你拥有技能@(myth.kanpo)。'
    },
    yicheng: {
        name: '疑城',
        intro: '当与你势力相同的一名角色成为@(standard.sha)的目标后，你可以令该角色摸一张牌然后弃置一张牌。'
    },
    shangyi: {
        name: '尚义',
        intro: '出牌阶段限一次，你可以令一名其他角色观看你的手牌。若如此做，你选择一项：1.观看其手牌并可以弃置其中的一张黑色牌；2.观看其所有暗置的武将牌。'
    },
    niaoxiang: {
        name: '鸟翔',
        intro: '@(阵法技) 在同一个围攻关系中，若你是围攻角色，则你或另一名围攻角色使用@(standard.sha)指定被围攻角色为目标后，你令该角色需依次使用两张@(standard.shan)才能抵消。'
    },
    zhendu: {
        name: '鸠毒',
        intro: '其他角色的出牌阶段开始时，你可以弃置一张手牌，然后该角色视为使用一张@(maneuver.jiu)，且你对其造成1点伤害。'
    },
    qiluan: {
        name: '戚乱',
        intro: '当你杀死一名角色后，你可于此回合结束后摸三张牌。'
    },
    qianhuan: {
        name: '千幻',
        intro: '当与你势力相同的一名角色受到伤害后，你可以将一张与你武将牌上花色均不同的牌置于你的武将牌上。当一名与你势力相同的角色成为基本牌或锦囊牌的唯一目标时，你可以移去一张“千幻”牌，取消之。'
    },
    hengjiang: {
        name: '横江',
        intro: '当你受到1点伤害后，你可以令当前回合角色本回合的手牌上限-1。然后若其弃牌阶段内没有弃牌，则你摸一张牌。'
    },
    qianxi: {
        name: '潜袭',
        intro: '准备阶段，你可以进行判定，然后你选择距离为1的一名角色，直到回合结束，该角色不能使用或打出与结果颜色相同的手牌。'
    },
    guixiu: {
        name: '闺秀',
        intro: '当你明置此武将牌时，你可以摸两张牌；当你移除此武将牌时，你可以回复1点体力。'
    },
    cunsi: {
        name: '存嗣',
        intro: '出牌阶段，你可以移除此武将牌并选择一名角色，然后其获得技能@(conqueror.yongjue)'
    },
    yongjue: {
        name: '勇决',
        intro: '若与你势力相同的一名角色于其回合内使用的第一张牌为@(standard.sha)，则该角色可以在此@(standard.sha)结算完成后获得之），若你没有获得@(conqueror.yongjue)，则获得@(conqueror.yongjue)的角色摸两张牌。'
    },
    yingyang: {
        name: '鹰扬',
        intro: '当你拼点的牌亮出后，你可以令此牌的点数+3或-3。'
    },
    hunshang: {
        name: '魂殇',
        intro: '@(副将技) 此武将牌减少半个阴阳鱼；准备阶段，若你的体力值不大于1，则你本回合获得@(standard.yingzi)和@(myth.yinghun)。'
    },
    duanxie: {
        name: '断绁',
        intro: '出牌阶段限一次，你可以令一名其他角色横置，然后你横置。'
    },
    fenming: {
        name: '奋命',
        intro: '结束阶段，若你处于连环状态，则你可以弃置所有处于连环状态的角色的各一张牌。'
    },
    hengzheng: {
        name: '横征',
        intro: '摸牌阶段，若你的体力值为1或你没有手牌，则你可以改为获得每名其他角色区域里的一张牌。'
    },
    baoling: {
        name: '暴凌',
        intro: '@(主将技) @(锁定技) 出牌阶段结束时，若你有副将，则你移除副将，然后加3点体力上限，回复3点体力，并获得@(myth.benghuai)。'
    },
    chuanxin: {
        name: '穿心',
        intro: '可预亮,当你于出牌阶段内使用@(standard.sha)或@(standard.juedou)对目标角色造成伤害时，若其与你势力不同且有副将，你可以防止此伤害。若如此做，该角色选择一项：1.弃置装备区里的所有牌，若如此做，其失去1点体力；2.移除副将。'
    },
    fengshi: {
        name: '锋矢',
        intro: '@(阵法技) 在同一个围攻关系中，若你是围攻角色，则你或另一名围攻角色使用@(standard.sha)指定被围攻角色为目标后，可令该角色弃置装备区里的一张牌。'
    }
} as SkillDict;