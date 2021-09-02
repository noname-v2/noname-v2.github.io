import { skill } from './skill';
import type { SGS } from '../sgs/types';

export default {
    cardpack: '军争',
    skill,
    card: {
        huosha: {
            name: '火杀',
            caption: ['殺', 'darkred'],
            intro: '出牌阶段，对攻击范围内的一名角色使用，令其使用一张@(standard.shan)或受到一点火属性伤害。',
            type: 'basic',
            decoration: 'fire',
            originated: 'standard.sha',
            label: ['火', 'darkred']
        },
        leisha: {
            name: '雷杀',
            caption: ['殺', 'darkblue'],
            intro: '出牌阶段，对攻击范围内的一名角色使用，令其使用一张@(standard.shan)或受到一点雷属性伤害。',
            type: 'basic',
            decoration: 'thunder',
            originated: 'standard.sha',
            label: ['雷', 'darkblue']
        },
        jiu: {
            name: '酒',
            intro: '出牌阶段，对自己使用，令自己的下一张使用的@(standard.sha)造成的伤害+1（每回合限使用1次）；濒死阶段，对自己使用，回复1点体力',
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
            intro: '你可以将一张普通@(standard.sha)当@(maneuver.huosha)使用。',
            type: 'equip',
            subtype: 'weapon',
            range: 4
        },
        guding: {
            name: '古锭刀',
            intro: '@(锁定技) 当你使用@(standard.sha)对目标角色造成伤害时，若其没有手牌，此伤害+1。',
            type: 'equip',
            subtype: 'weapon',
            range: 2
        },
        tengjia: {
            name: '藤甲',
            intro: '@(锁定技) @(standard.nanman)、@(standard.wanjian)和普通@(standard.sha)对你无效。你每次受到火焰伤害时，该伤害+1。',
            type: 'equip',
            subtype: 'armor'
        },
        baiyin: {
            name: '白银狮子',
            intro: '@(锁定技) 你每次受到伤害时，最多承受1点伤害（防止多余的伤害）；当你失去装备区里的@(maneuver.baiyin)时，你回复1点体力。',
            type: 'equip',
            subtype: 'armor'
        },
        muniu: {
            name: '木牛流马',
            intro: '出牌阶段限一次，你可以将一张手牌扣置于你装备区里的@(maneuver.muniu)下，若如此做，你可以将此装备移动到一名其他角色的装备区里；你可以将此装备牌下的牌如手牌般使用或打出。',
            type: 'equip',
            subtype: 'treasure'
        }
    },
    lib: {
        subtype: {
            'equip.treasure': '宝物'
        }
    }
} as SGS;