export const skill = {
    jianxiong: {
        name: '奸雄',
        intro: '当你受到伤害后，你可以获得造成此伤害的牌。'
    },
    fankui: {
        name: '反馈',
        intro: '当你受到伤害后，你可以获得伤害来源的一张牌。'
    },
    guicai: {
        name: '鬼才',
        intro: '当一名角色的判定牌生效前，你可以打出一张手牌代替之。'
    },
    ganglie: {
        name: '刚烈',
        intro: '当你受到伤害后，你可以进行判定，若结果不为红桃，伤害来源弃置两张手牌或受到1点伤害。'
    },
    tuxi: {
        name: '突袭',
        intro: '摸牌阶段，你可以改为获得最多两名角色的各一张手牌。'
    },
    luoyi: {
        name: '裸衣',
        intro: '摸牌阶段，你可以少摸一张牌，然后本回合你使用@(standard:card.sha)或@(standard:card.juedou)造成的伤害+1。'
    },
    yiji: {
        name: '遗计',
        intro: '当你受到1点伤害后，你可以观看牌堆顶的两张牌，然后将这些牌交给任意角色。'
    },
    luoshen: {
        name: '洛神',
        intro: '准备阶段开始时，你可以进行判定，当黑色判定牌生效后，你获得之。若结果为黑色，你可以重复此流程。'
    },
    shensu: {
        name: '神速',
        intro: '你可以做出如下选择：1.跳过判定阶段和摸牌阶段。2.跳过出牌阶段并弃置一张装备牌。你每选择一项，便视为你使用一张无距离限制的@(standard:card.sha)。'
    },
    duanliang: {
        name: '断粮',
        intro: '出牌阶段，你可以明置此武将牌；你可以将一张黑色基本牌或黑色装备牌当@(maneuver:card.bingliang)使用；你可以对距离为2的角色使用@(maneuver:card.bingliang)。'
    },
    jushou: {
        name: '据守',
        intro: '结束阶段开始时，你可以发动此技能。然后你摸X张牌，选择一项：1.弃置一张不为装备牌的手牌；2.使用一张装备牌。若X大于2，则你将武将牌翻面。（X为此时亮明势力数）'
    },
    qiangxi: {
        name: '强袭',
        intro: '出牌阶段限一次，你可以失去1点体力或弃置一张武器牌，并对你攻击范围内的一名其他角色造成1点伤害。'
    },
    xingshang: {
        name: '行殇',
        intro: '当其他角色死亡时，你可以获得其所有牌。'
    },
    fangzhu: {
        name: '放逐',
        intro: '当你受到伤害后，你可以令一名其他角色翻面，然后该角色摸X张牌（X为你已损失的体力值）。'
    },
    xiaoguo: {
        name: '骁果',
        intro: '其他角色的结束阶段，你可以弃置一张基本牌，然后除非该角色弃置一张装备牌，否则受到你造成的1点伤害。'
    },
    rende: {
        name: '仁德',
        intro: '出牌阶段每名角色限一次，你可以将任意张手牌交给一名其他角色。当你给出第二张\'仁德\'牌时，你可以视为使用一张基本牌。'
    },
    wusheng: {
        name: '武圣',
        intro: '你可以将一张红色牌当@(standard:card.sha)使用或打出。'
    },
    paoxiao: {
        name: '咆哮',
        intro: '① @(锁定技) 你使用@(standard:card.sha)无次数限制。② @(锁定技) 当你于当前回合使用第二张@(standard:card.sha)时，你摸一张牌。'
    },
    guanxing: {
        name: '观星',
        intro: '准备阶段，你可以观看牌堆顶的X张牌（X为存活角色数且最多为5），然后以任意顺序放回牌堆顶或牌堆底。'
    },
    kongcheng: {
        name: '空城',
        intro: '@(锁定技) 若你没有手牌，当你成为@(standard:card.sha)或@(standard:card.juedou)的目标时，取消之。你的回合外，其他角色交给你的牌置于你的武将牌上。摸牌阶段开始时，你获得你武将牌上的牌。'
    },
    longdan: {
        name: '龙胆',
        intro: '你可以将@(standard:card.sha)当@(standard:card.shan)、@(standard:card.shan)当@(standard:card.sha)使用或打出。当你通过发动@(hegemony:skill.longdan)使用的@(standard:card.sha)被一名角色使用的@(standard:card.shan)抵消时，你可以对另一名角色造成1点普通伤害。当一名角色使用的@(standard:card.sha)被你通过发动@(hegemony:skill.longdan)使用的@(standard:card.shan)抵消时，你可以令另一名其他角色回复1点体力。'
    },
    tieji: {
        name: '铁骑',
        intro: '出牌阶段，你可以明置此武将牌；你计算与其他角色的距离-1。'
    },
    jizhi: {
        name: '集智',
        intro: '当你使用普通锦囊牌时，你可以摸一张牌。'
    },
    qicai: {
        name: '奇才',
        intro: '@(锁定技) 你使用锦囊牌无距离限制。'
    },
    liegong: {
        name: '烈弓',
        intro: '当你于出牌阶段内使用@(standard:card.sha)指定一个目标后，若该角色的手牌数不小于你的体力值或不大于你的攻击范围，则你可以令其不能使用@(standard:card.shan)响应此@(standard:card.sha)。'
    },
    kuanggu: {
        name: '狂骨',
        intro: '@(锁定技) 当你对距离1以内的一名角色造成1点伤害后，若你已受伤，则你回复1点体力。'
    },
    lianhuan: {
        name: '连环',
        intro: '你可以将一张梅花手牌当@(maneuver:card.tiesuo)使用或重铸。'
    },
    niepan: {
        name: '涅槃',
        intro: '@(限定技) 当你处于濒死状态时，你可以弃置所有牌，然后复原你的武将牌，摸三张牌，将体力回复至3点。'
    },
    bazhen: {
        name: '八阵',
        intro: '@(锁定技) 若你的装备区里没有防具牌，你视为装备着@(standard:card.bagua)；出牌阶段，你可以明置此武将牌。'
    },
    zaiqi: {
        name: '再起',
        intro: '摸牌阶段，你可以改为亮出牌堆顶的X张牌（X为你已损失的体力值），然后回复等同于其中红桃牌数量的体力，并获得其余的牌。'
    },
    lieren: {
        name: '烈刃',
        intro: '当你使用@(standard:card.sha)对目标角色造成伤害后，你可以与其拼点，若你赢，你获得其一张牌。'
    },
    shushen: {
        name: '淑慎',
        intro: '当你回复1点体力后，你可以令一名其他角色摸一张牌。'
    },
    shenzhi: {
        name: '神智',
        intro: '准备阶段，你可以弃置所有手牌，若你以此法弃置的手牌数不小于你的体力值，你回复1点体力。'
    },
    zhiheng: {
        name: '制衡',
        intro: '出牌阶段限一次，你可以弃置至多X张牌（X为你的体力上限），然后摸等量的牌。'
    },
    keji: {
        name: '克己',
        intro: '@(锁定技) 弃牌阶段开始时，若你未于出牌阶段内使用过颜色不同的牌或出牌阶段被跳过，你的手牌上限于此回合内+4。'
    },
    mouduan: {
        name: '谋断',
        intro: '结束阶段开始时，若你于出牌阶段内使用过四种花色或三种类别的牌，则你可以移动场上的一张牌。'
    },
    kurou: {
        name: '苦肉',
        intro: '出牌阶段限一次，你可以弃一张牌。若如此做，你失去1点体力，然后摸三张牌，最后此阶段你使用@(standard:card.sha)的次数上限+1。'
    },
    guose: {
        name: '国色',
        intro: '你可以将一张方块牌当@(standard:card.lebu)使用。'
    },
    duoshi: {
        name: '度势',
        intro: '出牌阶段限四次，你可以将一张红色手牌当@(hegemony:card.yiyi)使用。'
    },
    qianxun: {
        name: '谦逊',
        intro: '@(锁定技) 当你成为@(standard:card.shunshou)或@(standard:card.lebu)的目标时，则取消之。'
    },
    jieyin: {
        name: '结姻',
        intro: '出牌阶段限一次，你可以弃置两张手牌并选择一名已受伤的男性角色，然后你与其各回复1点体力。'
    },
    xiaoji: {
        name: '枭姬',
        intro: '当你失去装备区里的牌后，你可以摸两张牌。'
    },
    hongyan: {
        name: '红颜',
        intro: '出牌阶段，你可明置此武将牌；你的黑桃牌视为红桃牌。'
    },
    buqu: {
        name: '不屈',
        intro: '@(锁定技) 当你处于濒死状态时，你将牌堆顶的一张牌置于你的武将牌上，称为\'创\'，若此牌的点数与你武将牌上已有的\'创\'点数均不同，则你将体力回复至1点。若出现相同点数则将此牌置入弃牌堆。'
    },
    fenji: {
        name: '奋激',
        intro: '一名角色的结束阶段开始时，若其没有手牌，你可令其摸两张牌。若如此做，你失去1点体力。'
    },
    fenxun: {
        name: '奋迅',
        intro: '出牌阶段限一次，你可以弃置一张牌并选择一名其他角色，然后本回合你计算与其的距离视为1。'
    },
    chuli: {
        name: '除疠',
        intro: '出牌阶段限一次，你可以选择至多三名势力各不相同或未确定势力的其他角色，然后你弃置你和这些角色的各一张牌。被弃置黑桃牌的角色各摸一张牌。'
    },
    biyue: {
        name: '闭月',
        intro: '结束阶段开始时，你可以摸一张牌。'
    },
    luanji: {
        name: '乱击',
        intro: '出牌阶段，你可以将两张手牌当@(standard:card.wanjian)使用（不能使用本回合发动此技能时已用过的花色） 。若如此做，当与你势力相同的角色因响应此@(standard:card.wanjian)而打出的@(standard:card.shan)结算结束时，其可以摸一张牌。'
    },
    shuangxiong: {
        name: '双雄',
        intro: '摸牌阶段，你可以改为进行判定，你获得生效后的判定牌，然后本回合你可以将与判定结果颜色不同的一张手牌当@(standard:card.juedou)使用。'
    },
    weimu: {
        name: '帷幕',
        intro: '@(锁定技) 当你成为黑色锦囊牌的目标时，则取消之。'
    },
    leiji: {
        name: '雷击',
        intro: '当你使用或打出@(standard:card.shan)时，你可以令一名其他角色进行判定，若结果为黑桃，你对该角色造成2点雷电伤害。'
    },
    xiongyi: {
        name: '雄异',
        intro: '@(限定技) 出牌阶段，你可以令与你势力相同的所有角色各摸三张牌，然后若你的势力是全场角色最少的势力，则你回复1点体力。'
    },
    mingshi: {
        name: '名士',
        intro: '@(锁定技) 当你受到伤害时，若伤害来源有暗置的武将牌，此伤害-1。'
    },
    lirang: {
        name: '礼让',
        intro: '当你的牌因弃置而置入弃牌堆时，你可以将其中的任意张牌交给其他角色。'
    },
    shuangren: {
        name: '双刃',
        intro: '出牌阶段开始时，你可以与一名角色拼点。若你赢，你视为对其或与其势力相同的另一名角色使用一张@(standard:card.sha)（此@(standard:card.sha)不计入限制的次数）；若你没赢，你结束出牌阶段。'
    },
    sijian: {
        name: '死谏',
        intro: '当你失去最后的手牌时，你可以弃置一名其他角色的一张牌。'
    },
    suishi: {
        name: '随势',
        intro: '@(锁定技) 当其他角色进入濒死状态时，若伤害来源与你势力相同，你摸一张牌；当其他角色死亡时，若其与你势力相同，你失去1点体力。'
    },
    kuangfu: {
        name: '狂斧',
        intro: '当你使用@(standard:card.sha)对目标角色造成伤害后，你可以将其装备区里的一张牌置入你的装备区或弃置之。'
    },
    huoshui: {
        name: '祸水',
        intro: '出牌阶段，你可以明置此武将牌；你的回合内，其他角色不能明置其武将牌。'
    },
    qingcheng: {
        name: '倾城',
        intro: '出牌阶段，你可以弃置一张黑色牌并选择一名武将牌均明置的其他角色，然后你暗置其一张武将牌。然后若你以此法弃置的牌是装备牌，则你可以再选择另一名武将牌均明置的其他角色，暗置其一张武将牌。'
    }
};