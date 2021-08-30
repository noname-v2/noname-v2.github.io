import type { SGS } from '../sgs/types';
import { hero } from './hero';
import { card } from './card';
import { skill } from './skill';
import { pile } from './pile';

export default {
    cardpack: '标准',
    heropack: '标准',
	faction: {
		'wei': ['魏', 'blue'],
		'shu': ['蜀', 'brown'],
		'wu': ['吴', 'green'],
		'qun': ['群', 'yellow']
	},
	keyword: {
		'主公技': ['只有身份为主公时才可以发动', 'orange'],
		'锁定技': ['技能于其发动时机若能发动则必须发动', 'blue'],
		'限定技': ['技能于一局游戏内只能发动一次', 'purple'],
		'觉醒技': ['① 技能于其发动时机若能发动则必须发动；② 技能于一局游戏内只能发动一次', 'green']
	},
	type: {
		'basic': '基本',
		'trick': '锦囊',
		'equip': '装备'
	},
	subtype: {
		'equip.weapon': '武器',
		'equip.armor': '防具',
		'equip.mount': '坐骑',
		'trick.instant': '普通锦囊',
		'trick.delayed': '延时锦囊'
	},
    hero, card, skill, pile
} as SGS;