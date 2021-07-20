import type { Collection } from '../extension';

export const skill = <Collection>{
    jushou: {
        name: '据守',
        intro: '结束阶段开始时，你可以翻面，若如此做，你摸四张牌，然后选择一项：1.弃置一张不为装备牌的牌；2.使用一张装备牌。'
    },
    jiewei: {
        name: '解围',
        intro: '你可以将装备区里的牌当@(standard.wuxie)使用；当你从背面翻至正面时，你可以弃置一张牌，然后移动场上的一张牌。'
    },
    shensu: {
        name: '神速',
        intro: '你可以选择至多三项：1.跳过判定阶段和摸牌阶段；2.跳过出牌阶段并弃置一张装备牌；3.跳过弃牌阶段并翻面。你每选择一项，视为你使用一张无距离限制的@(standard.sha)。'
    },
    liegong: {
        name: '烈弓',
        intro: '你使用@(standard.sha)可以选择距离不大于此@(standard.sha)点数的角色为目标；当你使用@(standard.sha)指定一个目标后，你可以根据下列条件执行相应的效果：1.其手牌数不大于你的手牌数，此@(standard.sha)不可被@(standard.shan)响应.2.其体力值不小于你的体力值，此@(standard.sha)伤害+1。'
    },
    kuanggu: {
        name: '狂骨',
        intro: '当你对距离1以内的一名角色造成1点伤害后，你可以回复1点体力或摸一张牌。'
    },
    qimou: {
        name: '奇谋',
        intro: '@(限定技) 出牌阶段，你可以失去任意点体力，然后直到回合结束，你计算与其他角色的距离-X，且你可以多使用X张@(standard.sha)（X为你失去的体力值）。'
    },
    tianxiang: {
        name: '天香',
        intro: '当你受到伤害时，你可以弃置一张红桃手牌,防止此次伤害并选择一名其他角色，你选择一项：令其受到1点伤害，然后摸X张牌（X为其已损失体力值且至多为5）；令其失去1点体力，然后其获得你弃置的牌。'
    },
    hongyan: {
        name: '红颜',
        intro: '@(锁定技) 你的黑桃牌视为红桃牌。'
    },
    buqu: {
        name: '不屈',
        intro: '@(锁定技) 当你处于濒死状态时，你将牌堆顶的一张牌置于你的武将牌上，称为\'创\'，若此牌的点数与你武将牌上已有的\'创\'点数均不同，则你将体力回复至1点。若出现相同点数则将此牌置入弃牌堆。若你的武将牌上有\'创\'，则你的手牌上限与\'创\'的数量相等。'
    },
    fenji: {
        name: '奋激',
        intro: '当一名角色因另一名角色的弃置或获得而失去手牌后，你可以失去1点体力。若如此做，失去手牌的角色摸两张牌。'
    },
    leiji: {
        name: '雷击',
        intro: '每当你使用或打出@(standard.shan)时，你可以令一名其他角色进行判定，若结果为：黑桃，你对该角色造成2点雷电伤害；梅花，你回复1点体力，然后对该角色造成1点雷电伤害'
    },
    guidao: {
        name: '鬼道',
        intro: '当一名角色的判定牌生效前，你可以打出一张黑色牌替换之。'
    },
    huangtian: {
        name: '黄天',
        intro: '@(主公技) 其他群势力角色的出牌阶段限一次，该角色可以将一张@(standard.shan)或@(standard.shandian)交给你。'
    },
    guhuo: {
        name: '蛊惑',
        intro: '每名角色的回合限一次，你可以扣置一张手牌当任意一张牌使用或打出。其他角色可质疑并翻开此牌：若为假则此牌作废，若为真则质疑者获得@(myth.chanyuan)。'
    },
    chanyuan: {
        name: '缠怨',
        intro: '@(锁定技) 你不能质疑于吉，只要你的体力值为1，你失去所有其他技能'
    },
    quhu: {
        name: '驱虎',
        intro: '出牌阶段限一次，你可以与体力值大于你的一名角色拼点：若你赢，你令该角色对其攻击范围内的另一名角色造成1点伤害；若你没赢，其对你造成1点伤害。'
    },
    jieming: {
        name: '节命',
        intro: '当你受到1点伤害后，你可以令一名角色将手牌摸至X张（X为其体力上限且最多为5）。'
    },
    qiangxi: {
        name: '强袭',
        intro: ' 出牌阶段各限一次，你可以失去1点体力或弃置一张武器牌，然后对你攻击范围内一名本阶段未以此法指定过的其他角色造成1点伤害。'
    },
    huoji: {
        name: '火计',
        intro: '你可以将一张红色手牌当@(maneuver.huogong)使用。'
    },
    bazhen: {
        name: '八阵',
        intro: '@(锁定技) 若你的装备区里没有防具牌，你视为装备着@(standard.bagua)。'
    },
    kanpo: {
        name: '看破',
        intro: '你可以将一张黑色手牌当@(standard.wuxie)使用。'
    },
    lianhuan: {
        name: '连环',
        intro: '你可以将一张手牌当@(maneuver.tiesuo)使用或重铸；你使用@(maneuver.tiesuo)可以额外指定一名角色为目标。'
    },
    niepan: {
        name: '涅槃',
        intro: '@(限定技) 出牌阶段或当你处于濒死状态时，你可以弃置你区域里的所有牌，摸三张牌且回复体力至3点，然后复原你的武将牌。'
    },
    tianyi: {
        name: '天义',
        intro: '出牌阶段限一次，你可以与一名角色拼点：若你赢，本回合你可以多使用一张@(standard.sha)、使用@(standard.sha)无距离限制且可以多选择一个目标；若你没赢，本回合你不能使用@(standard.sha)。'
    },
    jianchu: {
        name: '鞬出',
        intro: '当你使用@(standard.sha)指定一个目标后，你可以弃置其一张牌，若弃置的牌：是装备牌，该角色不能使用@(standard.shan)；不是装备牌，该角色获得此@(standard.sha)。'
    },
    luanji: {
        name: '乱击',
        intro: '你可以将两张花色相同的手牌当@(standard.wanjian)使用。'
    },
    xueyi: {
        name: '血裔',
        intro: '@(主公技) @(锁定技) 你的手牌上限+X（X等于其他群雄角色数量的2倍）。'
    },
    shuangxiong: {
        name: '双雄',
        intro: '摸牌阶段摸牌时，你可以改为亮出牌堆顶的两张牌，你获得其中一张牌且本回合可以将与另一张牌不同颜色的手牌当@(standard.juedou)使用；当你因@(standard.juedou)受到伤害后，你获得此@(standard.juedou)中其他角色打出的@(standard.sha)。'
    },
    duanliang: {
        name: '断粮',
        intro: '你可以将一张黑色的基本牌或装备牌当@(maneuver.bingliang)使用；你对手牌数大于等于你的角色使用@(maneuver.bingliang)无距离限制。'
    },
    jiezi: {
        name: '截辎',
        intro: '@(锁定技) 一名其他角色跳过摸牌阶段后，你摸一张牌。'
    },
    xingshang: {
        name: '行殇',
        intro: '当其他角色死亡时，你可以获得其所有牌或回复1点体力。'
    },
    fangzhu: {
        name: '放逐',
        intro: '当你受到伤害后，你可令一名其他角色选择一项：将其武将牌翻面，然后摸X张牌；或将手牌弃至X张（X为你已损失的体力值），且本回合不能对其以外的角色使用牌。'
    },
    songwei: {
        name: '颂威',
        intro: '@(主公技) 当其他魏势力角色的黑色判定牌生效后，其可以令你摸一张牌。'
    },
    yinghun: {
        name: '英魂',
        intro: '准备阶段，若你已受伤，你可以选择一名其他角色并选择一项：1.令其摸X张牌，然后弃置一张牌；2.令其摸一张牌，然后弃置X张牌。（X为你已损失的体力值）'
    },
    jiuchi: {
        name: '酒池',
        intro: '你可以将一张黑桃手牌当@(maneuver.jiu)使用。'
    },
    roulin: {
        name: '肉林',
        intro: '@(锁定技) 你对女性角色使用的@(standard.sha)和女性角色对你使用的@(standard.sha)均需使用两张@(standard.shan)才能抵消。'
    },
    benghuai: {
        name: '崩坏',
        intro: '@(锁定技) 结束阶段，若你不是体力值最小的角色，你失去1点体力或减1点体力上限。'
    },
    juxiang: {
        name: '巨象',
        intro: '@(锁定技) @(standard.nanman)对你无效；当其他角色使用的@(standard.nanman)结算结束后，你获得之。'
    },
    lieren: {
        name: '烈刃',
        intro: '当你使用@(standard.sha)指定目标后，你可以与其拼点，若你：赢，你获得其一张牌；没赢，你与其交换拼点的牌。'
    },
    huoshou: {
        name: '祸首',
        intro: '@(锁定技) @(standard.nanman)对你无效；当其他角色使用@(standard.nanman)指定目标后，你成为此牌造成伤害的来源。'
    },
    zaiqi: {
        name: '再起',
        intro: '弃牌阶段结束时，你可令至多X名角色各选择一项（X为本回合置入弃牌堆的红色牌数）：摸一张牌，或令你回复1点体力。'
    },
    wansha: {
        name: '完杀',
        intro: '@(锁定技) 你的回合内，只有你和处于濒死状态的角色才能使用@(standard.tao)。'
    },
    luanwu: {
        name: '乱武',
        intro: '@(限定技) 出牌阶段，你可以令所有其他角色除非对各自距离最小的另一名角色使用一张@(standard.sha)，否则失去1点体力。'
    },
    weimu: {
        name: '幄幕',
        intro: '@(锁定技) 你不能成为黑色锦囊牌的目标。'
    },
    haoshi: {
        name: '好施',
        intro: '摸牌阶段，你可以多摸两张牌，然后若你的手牌数大于5，则你将一半的手牌交给手牌最少的一名其他角色。'
    },
    dimeng: {
        name: '缔盟',
        intro: '出牌阶段限一次，你可以选择两名其他角色并弃置X张牌（X为这两名角色手牌数的差），然后令这两名角色交换手牌。'
    },
    qiaobian: {
        name: '巧变',
        intro: '你可以弃置一张手牌并跳过一个阶段：若跳过摸牌阶段，你可以获得至多两名角色的各一张手牌；若跳过出牌阶段，你可以移动场上的一张牌。'
    },
    tuntian: {
        name: '屯田',
        intro: '当你于回合外失去牌后，你可以进行判定，若结果不为红桃，将判定牌置于你的武将牌上，称为\'田\'；你计算与其他角色的距离-X（X为\'田\'的数量）。'
    },
    zaoxian: {
        name: '凿险',
        intro: '@(觉醒技) 准备阶段，若\'田\'的数量大于等于3，你减1点体力上限，然后获得@(myth.jixi)。'
    },
    jixi: {
        name: '急袭',
        intro: '你可以将一张\'田\'当@(standard.shunshou)使用。'
    },
    tiaoxin: {
        name: '挑衅',
        intro: '出牌阶段限一次，你可以选择一名攻击范围内含有你的角色，然后除非该角色对你使用一张@(standard.sha)，否则你弃置其一张牌。'
    },
    zhiji: {
        name: '志继',
        intro: '@(觉醒技) 准备阶段，若你没有手牌，你回复1点体力或摸两张牌，然后减1点体力上限，获得@(standard.guanxing)。'
    },
    xiangle: {
        name: '享乐',
        intro: '@(锁定技) 当你成为一名角色使用@(standard.sha)的目标后，除非该角色弃置一张基本牌，否则此@(standard.sha)对你无效。'
    },
    fangquan: {
        name: '放权',
        intro: '你可以跳过出牌阶段，然后此回合结束时，你可以弃置一张手牌并令一名其他角色获得一个额外的回合。'
    },
    ruoyu: {
        name: '若愚',
        intro: '@(主公技) @(觉醒技) 准备阶段，若你是体力值最小的角色，你加1点体力上限，回复1点体力，然后获得@(standard.jijiang)。'
    },
    jiang: {
        name: '激昂',
        intro: '当你使用@(standard.juedou)或红色@(standard.sha)指定目标后，或成为@(standard.juedou)或红色@(standard.sha)的目标后，你可以摸一张牌。'
    },
    hunzi: {
        name: '魂姿',
        intro: '@(觉醒技) 准备阶段，若你的体力值为1，你减1点体力上限，然后获得@(standard.yingzi)和@(myth.yinghun)。'
    },
    zhiba: {
        name: '制霸',
        intro: '@(主公技) 其他吴势力角色的出牌阶段限一次，其可以与你拼点，若其没赢，你可以获得拼点的两张牌。'
    },
    zhijian: {
        name: '直谏',
        intro: '出牌阶段，你可以将手牌中的一张装备牌置于其他角色的装备区里，然后摸一张牌。'
    },
    guzheng: {
        name: '固政',
        intro: '其他角色的弃牌阶段结束时，你可以将此阶段中的一张弃牌返还给该角色，然后你获得其余的弃牌。'
    },
    huashen: {
        name: '化身',
        intro: '游戏开始时，你随机获得两张武将牌作为\'化身\'牌，然后亮出其中一张，获得该\'化身\'牌的一个技能。回合开始时或结束后，你可以更改亮出的\'化身\'牌。'
    },
    xinsheng: {
        name: '新生',
        intro: '当你受到1点伤害后，你可以获得一张新的\'化身\'牌。'
    },
    beige: {
        name: '悲歌',
        intro: '当一名角色受到@(standard.sha)造成的伤害后，你可以弃置一张牌，然后令其进行判定，若结果为：（1）红桃，回复1点体力。（2）方块，摸2张牌。（3）黑桃，伤害来源翻面。（4）梅花，伤害来源弃置2张牌。'
    },
    duanchang: {
        name: '断肠',
        intro: '@(锁定技) 当你死亡时，杀死你的角色失去所有武将技能。'
    },
    jianxiang: {
        name: '荐降',
        intro: '当你成为其他角色使用牌的目标时，你可令手牌数最少的一名角色摸一张牌。'
    },
    shenshi: {
        name: '审时',
        intro: '@(转换技) ① 出牌阶段限一次，你可以将一张牌交给一名手牌数最多的角色，然后对其造成一点伤害，若该角色因此死亡，则你可以令一名角色将手牌摸至四张。② 其他角色对你造成伤害后，你可以观看该角色的手牌，然后交给其一张牌，当前角色回合结束时，若该角色未失去此牌，你将手牌摸至四张。'
    },
    qizhi: {
        name: '奇制',
        intro: '当你于回合内使用基本牌或锦囊牌指定目标后，你可以弃置不是此牌目标的一名角色的一张牌。若如此做，其摸一张牌。'
    },
    jinqu: {
        name: '进趋',
        intro: '结束阶段开始时，你可以摸两张牌，若如此做，你将手牌弃置至X张（X为你于此回合发动过@(myth.qizhi)的次数）。'
    },
    juzhan: {
        name: '拒战',
        intro: '@(转换技) ① 当你成为其他角色@(standard.sha)的目标后，你可以与其各摸一张牌，然后其本回合内不能再对你使用牌。② 当你使用@(standard.sha)指定一名角色为目标后，你可以获得其一张牌，然后你本回合内不能再对其使用牌。'
    },
    feijun: {
        name: '飞军',
        intro: '出牌阶段限一次，你可以弃置一张牌，然后选择一项：令一名手牌数大于你的角色交给你一张牌；或令一名装备区里牌数大于你的角色弃置一张装备牌。'
    },
    binglve: {
        name: '兵略',
        intro: '@(锁定技) 当你发动@(myth.feijun)时，若目标与你之前指定的目标均不相同，则你摸两张牌。'
    },
    huaiju: {
        name: '怀橘',
        intro: '@(锁定技) 游戏开始时，你获得3个“橘”标记。（有“橘”的角色受到伤害时，防止此伤害，然后移去一个“橘”；有“橘”的角色摸牌阶段额外摸一张牌）。'
    },
    yili: {
        name: '遗礼',
        intro: '出牌阶段开始时，你可以失去一点体力或移去一个“橘”，然后令一名其他角色获得一个“橘”。'
    },
    zhenglun: {
        name: '整论',
        intro: '若你没有“橘”，你可以跳过摸牌阶段然后获得一个“橘”。'
    },
    kuizhu: {
        name: '溃诛',
        intro: '弃牌阶段结束后，你可以选择一项：令至多X名角色各摸一张牌，或对任意名体力值之和为X的角色造成一点伤害，若不少于2名角色，你须受到一点伤害。（X为你此阶段弃置的牌数）。'
    },
    zhizheng: {
        name: '掣政',
        intro: '@(锁定技) 你的出牌阶段内，攻击范围内不包含你的角色不能成为你使用牌的目标。出牌阶段结束时，若你本阶段内使用的牌数小于这些角色数，你可以弃置其中一名角色一张牌。'
    },
    lijun: {
        name: '立军',
        intro: '@(主公技) 其他吴势力角色于其回合内使用的@(standard.sha)结算后，其可以将此@(standard.sha)交给你，然后你可以令其摸一张牌。'
    },
    mingren: {
        name: '明任',
        intro: '游戏开始时，你摸一张牌，然后将你的一张手牌至于你的武将牌上，称为“任”。结束阶段，你可以用手牌替换“任”。'
    },
    zhenliang: {
        name: '贞良',
        intro: '@(转换技) ① 出牌阶段限一次，你可以选择一名攻击范围内的其他角色，然后弃置X张与“任”颜色相同的牌并对其造成一点伤害（X为你与其的体力差且至少为1）。② 你的回合外，当你使用或打出牌进入弃牌堆时，若此牌与“任”类型相同，则你可以令一名角色摸一张牌。'
    },
    chenglve: {
        name: '成略',
        intro: '@(转换技) 出牌阶段限一次，① 你可以摸一张牌，然后弃置两张手牌。② 你可以摸两张牌，然后弃置一张手牌。若如此做，直到本回合结束，你使用与弃置牌花色相同的牌无距离和次数限制。'
    },
    shicai: {
        name: '恃才',
        intro: '当你使用一张牌结算后，若此牌与你本回合使用的牌类型均不同（包括装备牌），你可以将此牌置于牌堆顶，然后摸一张牌。'
    },
    cunmu: {
        name: '寸目',
        intro: '@(锁定技) 当你摸牌时，改为从牌堆底摸牌。'
    },
    zhenrong: {
        name: '徵荣',
        intro: '当你对其他角色造成伤害后，若其手牌比你多，你可以将其一张牌置于你的武将牌上，称为“荣”。'
    },
    hongju: {
        name: '鸿举',
        intro: '@(觉醒技) 准备阶段，若“荣”的数量大于或等于3且场上有角色死亡，则你可以用任意张手牌替换等量的“荣”，然后扣减一点体力上限并获得技能@(myth.qingce)。'
    },
    qingce: {
        name: '清侧',
        intro: '出牌阶段，你可以移去一张“荣”，然后弃置场上的一张牌。'
    },
    zhenggu: {
        name: '镇骨',
        intro: '结束阶段，你可以选择一名其他角色，你的回合结束后和该角色的下个回合结束时，其将手牌摸至或弃至与你手牌数相同。'
    },
    wanglie: {
        name: '往烈',
        intro: '出牌阶段，你使用的第一张牌无距离限制，你可以令此牌不能被响应，若如此做，本回合内你不能再使用牌。'
    },
    zuilun: {
        name: '罪论',
        intro: '结束阶段，你可以观看牌堆顶三张牌，你每满足以下一项便保留一张，然后以任意顺序放回其余的牌：1.你于此回合内造成过伤害；2.你于此回合内未弃置过牌；3.手牌数为全场最少。若均不满足，你与一名其他角色失去一点体力。'
    },
    fuyin: {
        name: '父荫',
        intro: '@(锁定技) 你每回合第一次成为@(standard.sha)或@(standard.juedou)的目标后，若你的手牌数小于等于该角色，此牌对你无效。'
    },
    qianjie: {
        name: '谦节',
        intro: '@(锁定技) 你不能被横置，且不能成为延时类锦囊的目标。你不能成为其他角色拼点的目标。'
    },
    jueyan: {
        name: '决堰',
        intro: '出牌阶段限一次，你可以废除一个装备栏，然后执行对应一项：武器栏，本回合内你可以多使用三张@(standard.sha)；防具栏，摸三张牌，本回合手牌上限+3；2个坐骑栏，本回合你使用的牌无距离限制；宝物栏，本回合获得技能集智。'
    },
    poshi: {
        name: '破势',
        intro: '@(觉醒技) 准备阶段开始时，若你的装备栏均已被废除或体力值为1，则你扣减一点体力上限，失去技能“决堰”并获得技能@(myth.huairou)。'
    },
    huairou: {
        name: '怀柔',
        intro: '出牌阶段，你可以重铸装备牌。'
    },
    liangyin: {
        name: '良姻',
        intro: '当有牌移至游戏外时，你可以令手牌数大于你的一名角色摸一张牌；当有牌从游戏外加入任意角色的手牌时，你可以令手牌数小于你的一名角色弃置一张牌。'
    },
    kongsheng: {
        name: '箜声',
        intro: '准备阶段，你可以将任意张牌置于你的武将牌上；结束阶段，你使用武将牌上的装备牌，并获得武将牌上的其他牌。'
    },
    yongsi: {
        name: '庸肆',
        intro: '@(锁定技) 摸牌阶段，你改为摸X张牌（X为存活势力数）；弃牌阶段，若你本回合：1.没有造成伤害，将手牌摸至当前体力值；2.造成的伤害超过1点，本回合手牌上限改为已损失体力值。'
    },
    weidi: {
        name: '伪帝',
        intro: '@(主公技) 你于弃牌阶段弃置的牌可以以任意方式交给其他群雄角色。'
    },
    xiongluan: {
        name: '雄乱',
        intro: '@(限定技) 出牌阶段，你可以废除你的判定区和装备区，然后指定一名其他角色。直到回合结束，你对其使用牌无距离和次数限制，其不能使用和打出手牌。'
    },
    congjian: {
        name: '从谏',
        intro: '当你成为锦囊牌的目标时，若此牌的目标数大于1，则你可以交给其中一名其他目标角色一张牌，然后摸一张牌，若你给出的是装备牌，改为摸两张牌。'
    }
};