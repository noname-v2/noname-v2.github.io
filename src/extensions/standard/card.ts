import type { CardDict } from '../sgs/types';

export const card = {
    sha: {
        name: '杀',
        caption: '殺',
        intro: '出牌阶段，对攻击范围内的一名角色使用，令其使用一张@(standard.shan)或受到一点伤害。',
        type: 'basic'
    },
    shan: {
        name: '闪',
        caption: '閃',
        intro: '成为@(standard.sha)的目标时使用，抵消此杀的效果。',
        type: 'basic'
    },
    tao: {
        name: '桃',
        caption: '桃',
        intro: '出牌阶段对自己使用，或对濒死角色使用，回复一点体力。',
        type: 'basic'
    },
    guohe: {
        name: '过河拆桥',
        intro: '出牌阶段，对区域里有牌的一名其他角色使用。你弃置其区域里的一张牌。',
        type: 'trick',
        subtype: 'instant'
    },
    jiedao: {
        name: '借刀杀人',
        intro: '出牌阶段，对装备区里有武器牌且有使用@(standard.sha)的目标的一名其他角色使用。令其对你指定的一名角色使用一张@(standard.sha)，否则将其装备区里的武器牌交给你。',
        type: 'trick',
        subtype: 'instant'
    },
    juedou: {
        name: '决斗',
        intro: '出牌阶段，对一名其他角色使用。由其开始，其与你轮流打出一张@(standard.sha)，直到其中一方未打出@(standard.sha)为止。未打出@(standard.sha)的一方受到另一方对其造成的1点伤害。',
        type: 'trick',
        subtype: 'instant'
    },
    nanman: {
        name: '南蛮入侵',
        intro: '出牌阶段，对所有其他角色使用。每名目标角色需打出一张@(standard.sha)，否则受到1点伤害。',
        type: 'trick',
        subtype: 'instant'
    },
    shunshou: {
        name: '顺手牵羊',
        intro: '出牌阶段，对距离为1且区域里有牌的一名其他角色使用。你获得其区域里的一张牌。',
        type: 'trick',
        subtype: 'instant'
    },
    taoyuan: {
        name: '桃园结义',
        intro: '出牌阶段，对所有角色使用。每名目标角色回复1点体力。',
        type: 'trick',
        subtype: 'instant'
    },
    wanjian: {
        name: '万箭齐发',
        intro: '出牌阶段，对所有其他角色使用。每名目标角色需打出一张@(standard.shan)，否则受到1点伤害。',
        type: 'trick',
        subtype: 'instant'
    },
    wugu: {
        name: '五谷丰登',
        intro: '出牌阶段，对所有角色使用。（选择目标后）你从牌堆顶亮出等同于目标数量的牌，每名目标角色获得这些牌中（剩余的）的任意一张。',
        type: 'trick',
        subtype: 'instant'
    },
    wuxie: {
        name: '无懈可击',
        intro: '一张锦囊牌生效前，对此牌使用。抵消此牌对一名角色产生的效果，或抵消另一张@(standard.wuxie)产生的效果。',
        type: 'trick',
        subtype: 'instant'
    },
    wuzhong: {
        name: '无中生有',
        intro: '出牌阶段，对你使用。你摸两张牌。',
        type: 'trick',
        subtype: 'instant'
    },
    lebu: {
        name: '乐不思蜀',
        intro: '出牌阶段，对一名其他角色使用。若判定结果不为红桃，跳过其出牌阶段。',
        type: 'trick',
        subtype: 'delayed'
    },
    shandian: {
        name: '闪电',
        intro: '出牌阶段，对自己使用。若判定结果为黑桃2~9，则目标角色受到3点雷电伤害。若判定不为黑桃2~9，将之移动到下家的判定区里。',
        type: 'trick',
        subtype: 'delayed'
    },
    cixiong: {
        name: '雌雄双股剑',
        intro: '每当你使用@(standard.sha)指定一名异性的目标角色后，你可以令其选择一项：1.弃置一张手牌；2.令你摸一张牌。',
        type: 'equip',
        subtype: 'weapon',
        range: 2
    },
    qinggang: {
        name: '青釭剑',
        intro: '@(锁定技) 当你使用@(standard.sha)指定一名角色为目标后，无视其防具。',
        type: 'equip',
        subtype: 'weapon',
        range: 2
    },
    qilin: {
        name: '麒麟弓',
        intro: '当你使用@(standard.sha)对目标角色造成伤害时，你可以弃置其装备区里的一张坐骑牌。',
        type: 'equip',
        subtype: 'weapon',
        range: 5
    },
    hanbing: {
        name: '寒冰剑',
        intro: '每当你使用杀命中目标后，你可以防止伤害，改为弃置目标两张牌。',
        type: 'equip',
        subtype: 'weapon',
        range: 2
    },
    fangtian: {
        name: '方天画戟',
        intro: '你使用的@(standard.sha)若是你最后的手牌，你可以额外选择至多两个目标。',
        type: 'equip',
        subtype: 'weapon',
        range: 4
    },
    guanshi: {
        name: '贯石斧',
        intro: '每当你使用的@(standard.sha)被目标角色使用的@(standard.shan)抵消时，你可以弃置两张牌，令此@(standard.sha)依然对其造成伤害。',
        type: 'equip',
        subtype: 'weapon',
        range: 3
    },
    qinglong: {
        name: '青龙偃月刀',
        intro: '每当你使用的@(standard.sha)被目标角色使用的@(standard.shan)抵消时，你可以对其使用一张@(standard.sha)（无距离限制）。',
        type: 'equip',
        subtype: 'weapon',
        range: 3
    },
    zhangba: {
        name: '丈八蛇矛',
        intro: '你可以将两张手牌当@(standard.sha)使用或打出。',
        type: 'equip',
        subtype: 'weapon',
        range: 3
    },
    zhuge: {
        name: '诸葛连弩',
        intro: '你于出牌阶段内使用@(standard.sha)无次数限制。',
        type: 'equip',
        subtype: 'weapon',
        range: 1
    },
    bagua: {
        name: '八卦阵',
        intro: '出牌阶段，对自己使用。若判定结果为黑桃2~9，则目标角色受到3点雷电伤害。若判定不为黑桃2~9，将之移动到下家的判定区里。',
        type: 'equip',
        subtype: 'armor'
    },
    renwang: {
        name: '仁王盾',
        intro: '@(锁定技) 黑色的@(standard.sha)对你无效。',
        type: 'equip',
        subtype: 'armor'
    },
    dilu: {
        name: '的卢',
        intro: '其他角色计算与你的距离+1。',
        type: 'equip',
        subtype: 'horse',
        distance: 1
    },
    jueying: {
        name: '绝影',
        intro: '其他角色计算与你的距离+1。',
        type: 'equip',
        subtype: 'horse',
        distance: 1
    },
    zhuahuang: {
        name: '爪黄飞电',
        intro: '其他角色计算与你的距离+1。',
        type: 'equip',
        subtype: 'horse',
        distance: 1
    },
    chitu: {
        name: '赤兔',
        intro: '你计算与其他角色的距离-1。',
        type: 'equip',
        subtype: 'horse',
        distance: -1
    },
    dawan: {
        name: '大宛',
        intro: '你计算与其他角色的距离-1。',
        type: 'equip',
        subtype: 'horse',
        distance: -1
    },
    zixin: {
        name: '紫骍',
        intro: '你计算与其他角色的距离-1。',
        type: 'equip',
        subtype: 'horse',
        distance: -1
    }
} as CardDict;