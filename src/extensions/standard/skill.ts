import type { SkillCollection } from '../sgs/sgs';

export const skill = <SkillCollection>{
    hujia: {
        name: '护驾',
        intro: '@(主公技) 魏势力角色可以替你打出@(standard.shan)'
    },
    jianxiong: {
        name: '奸雄',
        intro: '当你受到伤害时，你可以摸一张牌，并且获得造成此伤害的牌。'
    },
    fankui: {
        name: '反馈',
        intro: '当你受到1点伤害后，你可以获得伤害来源的一张牌。'
    },
    guicai: {
        name: '鬼才',
        intro: '当一名角色的判定牌生效前，你可以打出一张牌代替之。'
    },
    ganglie: {
        name: '刚烈',
        intro: '当你受到1点伤害后，你可以判定，若结果为：红色，对伤害来源造成1点伤害；黑色，你弃置其一张牌。'
    },
    qingjian: {
        name: '清俭',
        intro: '每回合限一次，当你在摸牌阶段外获得牌后，你可以展示任意张牌并交给一名其他角色，你给出的牌每有一种类别，当前回合角色本回合手牌上限+1。'
    },
    tuxi: {
        name: '突袭',
        intro: '摸牌阶段，你可以少摸任意张牌并获得等量的其他角色各一张手牌。'
    },
    luoyi: {
        name: '裸衣',
        intro: '摸牌阶段开始时，你亮出牌堆顶三张牌，然后你可以获得其中的基本牌、武器牌或@(standard.juedou)。若如此做，你放弃摸牌，且你为伤害来源的@(standard.sha)或@(standard.juedou)造成的伤害+1直到你的下回合开始。'
    },
    tiandu: {
        name: '天妒',
        intro: '当你的判定牌生效后，你可以获得此牌。'
    },
    yiji: {
        name: '遗计',
        intro: '当你受到1点伤害后，你可以摸两张牌，然后你可以将至多两张手牌交给一至两名其他角色。'
    },
    luoshen: {
        name: '洛神',
        intro: '准备阶段开始时，你可以进行判定，当黑色判定牌生效后，你获得之。若结果为黑色，你可以重复此流程。以此法获得的牌本回合不计入手牌上限。'
    },
    qingguo: {
        name: '倾国',
        intro: '你可以将一张黑色手牌当@(standard.shan)使用或打出。'
    },
    rende: {
        name: '仁德',
        intro: '出牌阶段每名角色限一次，你可以将任意张手牌交给一名其他角色。当你给出第二张\'仁德\'牌时，你可以视为使用一张基本牌。'
    },
    jijiang: {
        name: '激将',
        intro: '@(主公技) 其他蜀势力角色可以在你需要时代替你使用或打出@(standard.sha)。'
    },
    wusheng: {
        name: '武圣',
        intro: '你可以将一张红色牌当@(standard.sha)使用或打出；你使用的方块@(standard.sha)不受攻击范围限制。'
    },
    yijue: {
        name: '义绝',
        intro: '出牌阶段限一次，你可以弃置一张牌，然后令一名其他角色展示一张手牌。若此牌为黑色，则其本回合非锁定技失效且不能使用或打出手牌，你对其使用的红桃@(standard.sha)伤害+1；若此牌为红色，则你获得之，然后你可令该角色回复1点体力。'
    },
    paoxiao: {
        name: '咆哮',
        intro: '@(锁定技) 你使用@(standard.sha)无次数限制。你的出牌阶段，若你于当前阶段内使用过@(standard.sha)，你于此阶段使用@(standard.sha)无距离限制。'
    },
    tishen: {
        name: '替身',
        intro: '出牌阶段结束时，你可以弃置所有锦囊牌和坐骑牌，然后直到你的下回合开始，获得所有以你为目标且未对你造成伤害的@(standard.sha)。'
    },
    longdan: {
        name: '龙胆',
        intro: '你可以将一张@(standard.sha)当@(standard.shan)、@(standard.shan)当@(standard.sha)使用或打出。'
    },
    yajiao: {
        name: '涯角',
        intro: '当你于回合外使用或打出手牌时，你可以展示牌堆顶一张牌并将其交给任意一名角色。若这两张牌类别不同，你弃置一张牌。'
    },
    mashu: {
        name: '马术',
        intro: '@(锁定技) 你计算与其他角色的距离-1。'
    },
    tieji: {
        name: '铁骑',
        intro: '当你使用@(standard.sha)指定目标后，你可令其本回合非锁定技失效，然后你进行判定，除非其弃置与结果花色相同的一张牌，否则不能使用@(standard.shan)。'
    },
    jizhi: {
        name: '集智',
        intro: '当你使用一张锦囊牌时，你可以摸一张牌。若此牌是基本牌，你可以弃置此牌然后本回合手牌上限+1。'
    },
    qicai: {
        name: '奇才',
        intro: '@(锁定技) 你使用锦囊牌无距离限制；其他角色不能弃置你装备区里的防具和宝物牌。'
    },
    guanxing: {
        name: '观星',
        intro: '准备阶段，你可以观看牌堆顶的五张牌（存活人数小于四时改为三张），然后以任意顺序放回牌堆顶或牌堆底。若你将这些牌均放至牌堆底，则结束阶段你可以再进行一次“观星”。'
    },
    kongcheng: {
        name: '空城',
        intro: '@(锁定技) 若你没有手牌，你不能成为@(standard.sha)或@(standard.juedou)的目标。'
    },
    zhiheng: {
        name: '制衡',
        intro: '出牌阶段限一次，你可以弃置任意张牌，然后摸等量的牌。若你以此法弃置了所有的手牌，则额外摸一张牌'
    },
    jiuyuan: {
        name: '救援',
        intro: '@(主公技) 其他吴势力角色对其自己使用@(standard.tao)时，若其体力值大于你，则该角色可以改为令你回复1点体力，然后其摸一张牌。'
    },
    qixi: {
        name: '奇袭',
        intro: '你可以将一张黑色牌当@(standard.guohe)使用。'
    },
    fenwei: {
        name: '奋威',
        intro: '@(限定技) 当一张锦囊牌指定多个目标后，你可令此牌对其中任意个目标无效。'
    },
    qianxun: {
        name: '谦逊',
        intro: '当其他角色使用的锦囊牌对你生效时，若你是唯一目标，则你可以将所有手牌移出游戏直到回合结束。'
    },
    lianying: {
        name: '连营',
        intro: '当你失去最后手牌后，你可以令至多X名角色各摸一张牌（X为你失去的手牌数）。'
    },
    jieyin: {
        name: '结姻',
        intro: '出牌阶段限一次，选择一名男性角色，弃置一张手牌或将一张装备牌置入其装备区：你与其体力值较高的角色摸一张牌，体力值较低的角色回复1点体力'
    },
    xiaoji: {
        name: '枭姬',
        intro: '当你失去装备区里的一张牌后，你可以摸两张牌。'
    },
    qinxue: {
        name: '勤学',
        intro: '@(觉醒技) 准备阶段，若你的手牌数比你的体力值多3或更多（若游戏人数不小于7则改为2），你减1点体力上限，然后获得@(standard.gongxin)。'
    },
    keji: {
        name: '克己',
        intro: '若你未于出牌阶段内使用或打出过@(standard.sha)，则你可以跳过弃牌阶段。'
    },
    gongxin: {
        name: '攻心',
        intro: '出牌阶段限一次，你可以观看一名其他角色的手牌，然后你可以展示其中一张红桃牌，选择一项：1.弃置此牌；2.将此牌置于牌堆顶。'
    },
    guose: {
        name: '国色',
        intro: '出牌阶段限一次，你选择一项，然后摸一张牌：1.将一张方块牌当@(standard.lebu)使用；2.弃置一张方块牌并弃置场上的一张@(standard.lebu)'
    },
    liuli: {
        name: '流离',
        intro: '当你成为@(standard.sha)的目标时，你可以弃置一张牌并选择你攻击范围内的一名其他角色(不能是此@(standard.sha)的使用者) 然后将此@(standard.sha)转移给该角色。'
    },
    kurou: {
        name: '苦肉',
        intro: '出牌阶段限一次，你可以弃置一张牌，然后失去1点体力。'
    },
    zhaxiang: {
        name: '诈降',
        intro: '@(锁定技) 当你失去1点体力后，你摸三张牌。若此时是你的出牌阶段，则你使用红色@(standard.sha)无距离限制且不能被@(standard.shan)响应，且你可以多使用一张@(standard.sha)。'
    },
    yingzi: {
        name: '英姿',
        intro: '@(锁定技) 摸牌阶段，你多摸一张牌；你的手牌上限等于X（X为你的体力上限）。'
    },
    fanjian: {
        name: '反间',
        intro: '出牌阶段限一次，你可以展示一张手牌并交给一名其他角色，其选择一项：1.展示所有手牌，弃置与此牌同花色的牌；2.失去1点体力。'
    },
    qingnang: {
        name: '青囊',
        intro: '出牌阶段限一次，你可以弃置一张手牌并令一名角色回复1点体力。若你弃置的牌为红色，则可以再次发动此技能，但不能选择本回合选择过的角色'
    },
    jijiu: {
        name: '急救',
        intro: '你的回合外，你可以将一张红色牌当@(standard.tao)使用。'
    },
    wushuang: {
        name: '无双',
        intro: '@(锁定技) 当你使用@(standard.sha)指定一个目标后，该角色需依次使用两张@(standard.shan)才能抵消此@(standard.sha)；当你使用@(standard.juedou)指定一个目标后，或成为一名角色使用@(standard.juedou)的目标后，该角色每次响应此@(standard.juedou)需依次打出两张@(standard.sha)。'
    },
    liyu: {
        name: '利驭',
        intro: '当你使用@(standard.sha)对一名其他角色造成伤害后，你可获得其区域里的一张牌。然后若获得的牌不是装备牌，其摸一张牌；若获得的牌是装备牌，则视为你对由其指定的另一名角色使用一张@(standard.juedou)。'
    },
    lijian: {
        name: '离间',
        intro: '出牌阶段限一次，你可以弃置一张牌并选择两名男性角色，然后令其中一名男性角色视为对另一名男性角色使用一张@(standard.juedou)。'
    },
    biyue: {
        name: '闭月',
        intro: '结束阶段，你可以摸一张牌。若你没有手牌，则改为摸两张牌。'
    },
    yaowu: {
        name: '耀武',
        intro: '@(锁定技) 当你受到@(standard.sha)造成的伤害时，若此@(standard.sha)为红色，伤害来源回复1点体力或摸一张牌；若此@(standard.sha)不为红色，则你摸一张牌'
    }
};