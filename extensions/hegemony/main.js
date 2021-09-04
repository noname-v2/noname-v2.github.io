const mode = {
    name: '国战',
    np: [2, 3, 4, 5, 6, 7, 8],
    tasks: {
        main(T) {
            return class Identity extends T {
                /** Number of hero choices. */
                nheros = 10;
                main() {
                    this.addTask('lobby');
                    this.addTask('setup');
                    this.add('sleep', 0.5);
                    this.add('chooseHero');
                }
                chooseHero() {
                    const choices = this.game.getHeros();
                    const heros = new Map();
                    for (const id of this.game.players.keys()) {
                        heros.set(id, {
                            items: Array.from(this.game.utils.rgets(choices, this.nheros, true)),
                            filter: 'hegemony:mode.choose',
                            num: 2
                        });
                    }
                    this.addTask('chooseHero', {
                        heros, forced: true, pick: this.game.config.pick
                    });
                    this.addTask('loop');
                }
                filter(name, selected) {
                    console.log(name, selected);
                    return true;
                }
            };
        }
    },
    choose(name) {
        const faction = this.getHero(name).faction;
        if (this.selected.length) {
            return faction === this.getHero(this.selected[0]).faction;
        }
        else {
            for (const hero of this.all) {
                if (hero !== name && faction === this.getHero(hero).faction) {
                    return true;
                }
            }
            return false;
        }
    },
    inherit: 'sgs'
};

const skill = {
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
        intro: '摸牌阶段，你可以少摸一张牌，然后本回合你使用@(standard.sha)或@(standard.juedou)造成的伤害+1。'
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
        intro: '你可以做出如下选择：1.跳过判定阶段和摸牌阶段。2.跳过出牌阶段并弃置一张装备牌。你每选择一项，便视为你使用一张无距离限制的@(standard.sha)。'
    },
    duanliang: {
        name: '断粮',
        intro: '出牌阶段，你可以明置此武将牌；你可以将一张黑色基本牌或黑色装备牌当@(maneuver.bingliang)使用；你可以对距离为2的角色使用@(maneuver.bingliang)。'
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
        intro: '你可以将一张红色牌当@(standard.sha)使用或打出。'
    },
    paoxiao: {
        name: '咆哮',
        intro: '① @(锁定技) 你使用@(standard.sha)无次数限制。② @(锁定技) 当你于当前回合使用第二张@(standard.sha)时，你摸一张牌。'
    },
    guanxing: {
        name: '观星',
        intro: '准备阶段，你可以观看牌堆顶的X张牌（X为存活角色数且最多为5），然后以任意顺序放回牌堆顶或牌堆底。'
    },
    kongcheng: {
        name: '空城',
        intro: '@(锁定技) 若你没有手牌，当你成为@(standard.sha)或@(standard.juedou)的目标时，取消之。你的回合外，其他角色交给你的牌置于你的武将牌上。摸牌阶段开始时，你获得你武将牌上的牌。'
    },
    longdan: {
        name: '龙胆',
        intro: '你可以将@(standard.sha)当@(standard.shan)、@(standard.shan)当@(standard.sha)使用或打出。当你通过发动@(standard_hege.longdan)使用的@(standard.sha)被一名角色使用的@(standard.shan)抵消时，你可以对另一名角色造成1点普通伤害。当一名角色使用的@(standard.sha)被你通过发动@(standard_hege.longdan)使用的@(standard.shan)抵消时，你可以令另一名其他角色回复1点体力。'
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
        intro: '当你于出牌阶段内使用@(standard.sha)指定一个目标后，若该角色的手牌数不小于你的体力值或不大于你的攻击范围，则你可以令其不能使用@(standard.shan)响应此@(standard.sha)。'
    },
    kuanggu: {
        name: '狂骨',
        intro: '@(锁定技) 当你对距离1以内的一名角色造成1点伤害后，若你已受伤，则你回复1点体力。'
    },
    lianhuan: {
        name: '连环',
        intro: '你可以将一张梅花手牌当@(maneuver.tiesuo)使用或重铸。'
    },
    niepan: {
        name: '涅槃',
        intro: '@(限定技) 当你处于濒死状态时，你可以弃置所有牌，然后复原你的武将牌，摸三张牌，将体力回复至3点。'
    },
    bazhen: {
        name: '八阵',
        intro: '@(锁定技) 若你的装备区里没有防具牌，你视为装备着@(standard.bagua)；出牌阶段，你可以明置此武将牌。'
    },
    zaiqi: {
        name: '再起',
        intro: '摸牌阶段，你可以改为亮出牌堆顶的X张牌（X为你已损失的体力值），然后回复等同于其中红桃牌数量的体力，并获得其余的牌。'
    },
    lieren: {
        name: '烈刃',
        intro: '当你使用@(standard.sha)对目标角色造成伤害后，你可以与其拼点，若你赢，你获得其一张牌。'
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
        intro: '出牌阶段限一次，你可以弃一张牌。若如此做，你失去1点体力，然后摸三张牌，最后此阶段你使用@(standard.sha)的次数上限+1。'
    },
    guose: {
        name: '国色',
        intro: '你可以将一张方块牌当@(standard.lebu)使用。'
    },
    duoshi: {
        name: '度势',
        intro: '出牌阶段限四次，你可以将一张红色手牌当@(standard_hege.yiyi)使用。'
    },
    qianxun: {
        name: '谦逊',
        intro: '@(锁定技) 当你成为@(standard.shunshou)或@(standard.lebu)的目标时，则取消之。'
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
        intro: '出牌阶段，你可以将两张手牌当@(standard.wanjian)使用（不能使用本回合发动此技能时已用过的花色） 。若如此做，当与你势力相同的角色因响应此@(standard.wanjian)而打出的@(standard.shan)结算结束时，其可以摸一张牌。'
    },
    shuangxiong: {
        name: '双雄',
        intro: '摸牌阶段，你可以改为进行判定，你获得生效后的判定牌，然后本回合你可以将与判定结果颜色不同的一张手牌当@(standard.juedou)使用。'
    },
    weimu: {
        name: '帷幕',
        intro: '@(锁定技) 当你成为黑色锦囊牌的目标时，则取消之。'
    },
    leiji: {
        name: '雷击',
        intro: '当你使用或打出@(standard.shan)时，你可以令一名其他角色进行判定，若结果为黑桃，你对该角色造成2点雷电伤害。'
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
        intro: '出牌阶段开始时，你可以与一名角色拼点。若你赢，你视为对其或与其势力相同的另一名角色使用一张@(standard.sha)（此@(standard.sha)不计入限制的次数）；若你没赢，你结束出牌阶段。'
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
        intro: '当你使用@(standard.sha)对目标角色造成伤害后，你可以将其装备区里的一张牌置入你的装备区或弃置之。'
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

var main = {
    mode,
    heropack: '国战标准',
    cardpack: '国战标准',
    requires: ['standard', 'maneuver'],
    tags: ['guess-side', 'hero-hidden!', 'double-hero!'],
    skill,
    hero: {
        caocao: {
            name: '曹操',
            intro: '魏武帝曹操，字孟德，小名阿瞒、吉利，沛国谯人。精兵法，善诗歌，乃治世之能臣，乱世之奸雄也。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['jianxiong']
        },
        simayi: {
            name: '司马懿',
            intro: '晋宣帝，字仲达，河内温人。曾任职过曹魏的大都督，太尉，太傅。少有奇节，聪明多大略，博学洽闻，伏膺儒教，世之鬼才也。',
            gender: 'male',
            faction: 'wei',
            hp: 3,
            skills: ['fankui', 'guicai']
        },
        xiahoudun: {
            name: '夏侯惇',
            intro: '字元让，沛国谯人。有拔矢啖睛之勇，性格勇猛刚烈。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['ganglie']
        },
        zhangliao: {
            name: '张辽',
            intro: '字文远，魏雁门马邑人。官至前将军、征东将军、晋阳侯。武功高强，又谋略过人，多次建立奇功，以800人突袭孙权十万大军，皆望风披靡。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['tuxi']
        },
        xuchu: {
            name: '许褚',
            intro: '字仲康，谯国谯县人。和典韦一同统率着曹操的亲卫队“虎卫军”。因为他十分勇猛，所以有“虎痴”的绰号。曾有裸衣斗马超之举。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['luoyi']
        },
        guojia: {
            name: '郭嘉',
            intro: '字奉孝，颍川阳翟人，官至军师祭酒。惜天妒英才，英年早逝。有诗云：“良计环环不遗策，每临制变满座惊”。',
            gender: 'male',
            faction: 'wei',
            hp: 3,
            skills: ['standard.tiandu', 'yiji']
        },
        zhenji: {
            name: '甄姬',
            intro: '中山无极人，别称甄洛或甄宓，庙号文昭甄皇后。魏文帝曹丕的正室。懂诗文，有倾国倾城之貌，《洛神赋》即是曹植为她所作。',
            gender: 'female',
            faction: 'wei',
            hp: 3,
            skills: ['luoshen', 'standard.qingguo']
        },
        xiahouyuan: {
            name: '夏侯渊',
            intro: '字妙才，沛国谯人。东汉末年曹操部下名将，夏侯惇之族弟，八虎骑之一。群雄征讨董卓时随曹操一同起兵，后征战四方，屡立功勋。在平定马超叛乱后负责西北防线的镇守。公元219年刘备攻打汉中，被刘备部将黄忠所杀。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['shensu']
        },
        zhanghe: {
            name: '张郃',
            intro: '字儁乂，河间鄚人。三国时期魏国名将。官渡之战时，本为袁绍部将的张郃投降了曹操，并在曹操帐下多立功勋，于曹魏建立后加封为征西车骑将军。诸葛亮六出祁山之间，张郃多次抵御蜀军的进攻，于公元231年在木门道被诸葛亮设伏射死。后谥曰壮侯。为曹魏“五子良将”之一。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['myth.qiaobian']
        },
        xuhuang: {
            name: '徐晃',
            intro: '字公明，河东杨人。三国时期曹魏名将，本为杨奉帐下骑都尉，杨奉被曹操击败后转投曹操，在曹操手下多立功勋，参与官渡、赤壁、关中征伐、汉中征伐等几次重大战役。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['duanliang']
        },
        caoren: {
            name: '曹仁',
            intro: '字子孝，沛国谯人，曹操的从弟。三国时期曹魏名将，官至大司马。谥曰忠侯。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['jushou']
        },
        dianwei: {
            name: '典韦',
            intro: '己吾城村人。东汉末年曹魏猛将。擅使大双戟，为人壮猛任侠，曾为乡人刘氏报仇，杀人出市，人莫敢近。相貌魁梧，膂力过人。建安二年（197），张绣背叛曹操，典韦为保护曹操而独挡叛军，击杀多人，但最终因寡不敌众而战死。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['qiangxi']
        },
        xunyu: {
            name: '荀彧',
            intro: '字文若，颍川颍阴（今河南许昌）人。东汉末年曹操帐下首席谋臣，杰出的战略家。自小被世人称作“王佐之才”。',
            gender: 'male',
            faction: 'wei',
            hp: 3,
            skills: ['myth.quhu', 'myth.jieming']
        },
        caopi: {
            name: '曹丕',
            intro: '字子桓，三国时期著名的政治家、文学家，曹魏的开国皇帝，公元220－226年在位。沛国谯人，魏武帝曹操与武宣卞皇后的长子。去世后庙号高祖，谥为文皇帝，葬于首阳陵。',
            gender: 'male',
            faction: 'wei',
            hp: 3,
            skills: ['xingshang', 'fangzhu']
        },
        yuejin: {
            name: '乐进',
            intro: '字文谦，魏“五子良将”之一。容貌短小，以胆烈跟从曹操，南征北讨，战功无数。从击袁绍于官渡，奋勇力战，斩袁绍部将淳于琼。又从击袁绍子谭、尚于黎阳，斩其大将严敬。从平荆州，留屯襄阳，进击关羽、苏非等人，击退其众，南郡诸郡的山谷蛮夷都前往乐进处投降。后来从曹操征孙权，假进节。曹操回师后，留乐进与张辽、李典屯于合肥。又以乐进数有军功，迁右将军。建安二十三年逝世，谥曰威侯。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['xiaoguo']
        },
        liubei: {
            name: '刘备',
            intro: '先主姓刘，讳备，字玄德，涿郡涿县人，汉景帝子中山靖王胜之后也。以仁德治天下。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['rende']
        },
        guanyu: {
            name: '关羽',
            intro: '字云长，本字长生，并州河东解州人。五虎上将之首，爵至汉寿亭侯，谥曰“壮缪侯”。被奉为“关圣帝君”，崇为“武圣”。',
            gender: 'male',
            faction: 'shu',
            hp: 5,
            skills: ['wusheng']
        },
        zhangfei: {
            name: '张飞',
            intro: '字翼德，涿郡人，燕颔虎须，豹头环眼。有诗云：“长坂坡头杀气生，横枪立马眼圆睁。一声好似轰雷震，独退曹家百万兵”。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['paoxiao']
        },
        zhugeliang: {
            name: '诸葛亮',
            intro: '字孔明，号卧龙，琅琊阳都人，蜀汉丞相。在世时被封为武乡侯，谥曰忠武侯。著有《出师表》、《诫子书》等。怀不世之才，以空城戏司马，能观星象而通鬼神。',
            gender: 'male',
            faction: 'shu',
            hp: 3,
            skills: ['guanxing', 'kongcheng']
        },
        zhaoyun: {
            name: '赵云',
            intro: '字子龙，常山真定人。身长八尺，姿颜雄伟。长坂坡单骑救阿斗，先主云：“子龙一身都是胆也。”',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['longdan']
        },
        machao: {
            name: '马超',
            intro: '字孟起，扶风茂陵人。面如冠玉，目如流星，虎体猿臂，彪腹狼腰，声雄力猛。因衣着讲究，举止非凡，故人称“锦马超”。麾铁骑，捻金枪。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['standard.mashu', 'tieji']
        },
        huangyueying: {
            name: '黄月英',
            intro: '荆州沔南白水人，沔阳名士黄承彦之女，诸葛亮之妻，诸葛瞻之母。容貌甚丑，而有奇才：上通天文，下察地理，韬略近于诸书无所不晓，诸葛亮在南阳闻其贤而迎娶。',
            gender: 'male',
            faction: 'shu',
            hp: 3,
            skills: ['jizhi', 'qicai']
        },
        huangzhong: {
            name: '黄忠',
            intro: '字汉升，今河南南阳人。汉末三国时期蜀汉名将。本为刘表部下中郎将，后归刘备，并助刘备攻益州刘璋，在定军山一战中阵斩曹操部下名将夏侯渊。备称汉中王后改封后将军，赐关内侯。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['liegong']
        },
        weiyan: {
            name: '魏延',
            intro: '字文长，义阳人。三国时期蜀汉名将，诸葛亮死后，魏延因被陷害谋反而遭杨仪一党所杀。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['kuanggu']
        },
        pangtong: {
            name: '庞统',
            intro: '字士元，襄阳（治今湖北襄阳）人。三国时刘备帐下谋士，官拜军师中郎将。才智与诸葛亮齐名，人称“凤雏”。在进围雒县时，统率众攻城，不幸被流矢击中去世，时年三十六岁。追赐统为关内侯，谥曰靖侯。庞统死后，葬于落凤庞统墓坡。',
            gender: 'male',
            faction: 'shu',
            hp: 3,
            skills: ['lianhuan', 'niepan']
        },
        wolongzhuge: {
            name: '卧龙诸葛',
            intro: '字孔明，号卧龙居士，琅琊阳都人。刘备曾“三顾茅庐”得见卧龙。卧龙以一篇《隆中对》分析天下形势，提出先取荆州，再取益州成鼎足之势的说法。《三国演义》中的诸葛亮善用“火攻”，曾用火攻战术赢得多场战役，如“火烧赤壁”、“火烧博望坡”、“火烧藤甲兵”等。',
            gender: 'male',
            faction: 'shu',
            hp: 3,
            skills: ['bazhen', 'myth.huoji', 'myth.kanpo']
        },
        liushan: {
            name: '刘禅',
            intro: '蜀汉后主，字公嗣。小名阿斗。刘备之子，母亲是昭烈皇后甘氏。三国时期蜀汉第二位皇帝，公元223－263年在位。公元263年蜀汉被曹魏所灭，刘禅投降曹魏，被封为安乐公。',
            gender: 'male',
            faction: 'shu',
            hp: 3,
            skills: ['myth.xiangle', 'myth.fangquan']
        },
        menghuo: {
            name: '孟获',
            intro: '中国三国时期南中少数族首领。系东汉末益州建宁郡( 今云南晋宁东 )大姓，身材肥硕。生卒年不详。官至御史中丞。曾被诸葛亮七擒七纵，传为佳话。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['myth.huoshou', 'zaiqi']
        },
        zhurong: {
            name: '祝融',
            intro: '据传为火神祝融氏后裔，南蛮王孟获之妻。武艺超群，善使飞刀，是《三国演义》中写到的唯一真正上过战场的女性。曾与孟获一起抵抗蜀军，在诸葛亮七擒七纵孟获之后，随孟获投降蜀汉。',
            gender: 'female',
            faction: 'shu',
            hp: 4,
            skills: ['myth.juxiang', 'lieren']
        },
        ganfuren: {
            name: '甘夫人',
            intro: '中国三国时期南中少数族首领。系东汉末益州建宁郡( 今云南晋宁东 )大姓，身材肥硕。生卒年不详。官至御史中丞。曾被诸葛亮七擒七纵，传为佳话。',
            gender: 'female',
            faction: 'shu',
            hp: 3,
            skills: ['shushen', 'shenzhi']
        },
        sunquan: {
            name: '孙权',
            intro: '吴大帝，字仲谋，吴郡富春县人。统领吴与蜀魏三足鼎立，制衡天下。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['zhiheng']
        },
        ganning: {
            name: '甘宁',
            intro: '字兴霸，巴郡临江人，祖籍荆州南阳郡。为人勇猛刚强，忠心耿耿，勇往无前。曾带兵百人于二更奇袭曹营，大挫其锐气。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['standard.qixi']
        },
        lvmeng: {
            name: '吕蒙',
            intro: '字子明，汝南富陂人。陈寿评曰：“吕蒙勇而有谋断，识军计，谲郝普，擒关羽，最其妙者。初虽轻果妄杀，终于克己，有国士之量，岂徒武将而已乎！”',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['keji', 'mouduan']
        },
        huanggai: {
            name: '黄盖',
            intro: '字公覆，零陵郡泉陵县人。官至偏将军、武陵太守。以苦肉计骗曹孟德，亲往诈降，火烧战船，重创敌军。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['kurou']
        },
        zhouyu: {
            name: '周瑜',
            intro: '字公瑾，庐江舒县人，任东吴三军大都督，雄姿英发，人称“美周郎”。赤壁之战前，巧用反间计杀了精通水战的叛将蔡瑁、张允。',
            gender: 'male',
            faction: 'wu',
            hp: 3,
            skills: ['standard.yingzi', 'standard.fanjian']
        },
        daqiao: {
            name: '大乔',
            intro: '庐江皖县人，为乔公长女，孙策之妻，小乔之姊。与小乔并称为“江东二乔”，容貌国色流离。',
            gender: 'female',
            faction: 'wu',
            hp: 3,
            skills: ['guose', 'standard.liuli']
        },
        luxun: {
            name: '陆逊',
            intro: '本名陆议，字伯言，吴郡吴县人。历任东吴大都督、丞相。吴大帝孙权兄孙策之婿，世代为江东大族。以谦逊之书麻痹关羽，夺取荆州，又有火烧连营大破蜀军。',
            gender: 'male',
            faction: 'wu',
            hp: 3,
            skills: ['duoshi', 'qianxun']
        },
        sunshangxiang: {
            name: '孙尚香',
            intro: '孙夫人，乃孙权之妹。刘备定荆州，孙权进妹与其结姻，重固盟好。孙夫人才捷刚猛，有诸兄之风。后人为其立庙，号曰“枭姬庙”。',
            gender: 'female',
            faction: 'wu',
            hp: 3,
            skills: ['jieyin', 'xiaoji']
        },
        sunjian: {
            name: '孙坚',
            intro: '字文台，吴郡富春人。东汉末期地方军阀，著名将领。史书说他“容貌不凡，性阔达，好奇节”，是大军事家孙武的后裔。汉末群雄之一，三国中吴国的奠基人。孙权建国后，追谥孙坚为武烈皇帝。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['myth.yinghun']
        },
        xiaoqiao: {
            name: '小乔',
            intro: '庐江皖县人也。父桥国老德尊于时。小乔国色流离，资貌绝伦。建安三年，周瑜协策攻皖，拔之。娶小乔为妻。后人谓英雄美女，天作之合。',
            gender: 'female',
            faction: 'wu',
            hp: 3,
            skills: ['myth.tianxiang', 'hongyan']
        },
        taishici: {
            name: '太史慈',
            intro: '字子义，东莱黄县（今山东龙口东黄城集）人。东汉末年武将，守言应诺，恪遵信义，始终如一，弭息诽论。官至建昌都尉。弓马熟练，箭法精良。原为刘繇部下，后被孙策收降，于赤壁之战前病逝，死时才四十一岁。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['myth.tianyi']
        },
        zhoutai: {
            name: '周泰',
            intro: '字幼平，九江下蔡人，三国时期吴国武将。早年与蒋钦随孙策左右，立过数次战功。孙策讨伐六县山贼时，周泰胆气绝伦，保卫孙权，勇战退敌，身受十二处伤。有诗云：三番救主出重围，忠勇如公世所稀。遍体疮痍犹痛饮，血痕残酒满征衣。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['buqu', 'fenji']
        },
        lusu: {
            name: '鲁肃',
            intro: '字子敬，临淮东城人，中国东汉末年东吴的著名军事统帅。他曾为孙权提出鼎足江东的战略规划，因此得到孙权的赏识，于周瑜死后代替周瑜领兵，守陆口。曾单刀赴会关羽于荆州。',
            gender: 'male',
            faction: 'wu',
            hp: 3,
            skills: ['myth.haoshi', 'myth.dimeng']
        },
        zhangzhaozhanghong: {
            name: '张昭张紘',
            intro: '张昭，字子布，彭城人，三国时期吴国重臣，善丹青。拜辅吴将军，班亚三司，改封娄侯。年八十一卒，谥曰文侯。张纮，字子纲，广陵人。东吴谋士，和张昭一起合称“二张”。孙策平定江东时亲自登门邀请，张纮遂出仕为官。张纮后来建议孙权迁都秣陵，孙权正在准备时张纮病逝，其年六十岁。孙权为之流涕。',
            gender: 'male',
            faction: 'wu',
            hp: 3,
            skills: ['myth.zhijian', 'myth.guzheng']
        },
        dingfeng: {
            name: '丁奉',
            intro: '吴国将领。年少时以骁勇为小将，经常奋勇杀敌，屡立功勋，此后又于东兴之战中“雪中奋短兵”，大破侵犯东吴的魏军。吴景帝孙休在位时，丁奉设计除掉了东吴的权臣孙綝，被拜为大将军，后为右大司马、左军师。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['meteor:duanbing', 'fenxun']
        },
        huatuo: {
            name: '华佗',
            intro: '字元化，一名旉，沛国谯人，“建安三神医”之一。集平生之所得著《青囊经》，现已失传。',
            gender: 'male',
            faction: 'qun',
            hp: 3,
            skills: ['chuli', 'standard.jijiu']
        },
        lvbu: {
            name: '吕布',
            intro: '字奉先，五原郡九原县人。三国第一猛将，曾独力战刘关张三人，其武力世之无双。时人语曰：“人中有吕布，马中有赤兔。”',
            gender: 'male',
            faction: 'qun',
            hp: 5,
            skills: ['standard.wushuang']
        },
        diaochan: {
            name: '貂蝉',
            intro: '中国古代四大美女之一，有闭月羞花之貌。司徒王允之义女，由王允授意施行连环计，离间董卓、吕布，借布手除卓。后貂蝉成为吕布的妾。',
            gender: 'female',
            faction: 'qun',
            hp: 3,
            skills: ['standard.lijian', 'biyue']
        },
        yuanshao: {
            name: '袁绍',
            intro: '字本初，汝南汝阳人，出身名门望族，自曾祖父起四代有五人位居三公，自己也居三公之上，其家族也因此有“四世三公”之称。曾于初平元年被推举为反董卓联合军的盟主，联军瓦解后，在汉末群雄割据的过程中，袁绍先占据冀州，又先后夺青、并二州，并于建安四年击败了割据幽州的军阀公孙瓒，势力达到顶点；但在建安五年的官渡之战中败于曹操。在平定冀州叛乱之后，于建安七年病死。',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['luanji']
        },
        yanliangwenchou: {
            name: '颜良文丑',
            intro: '东汉末年河北袁绍部下武将，素有威名。颜良与文丑一起作为袁绍军队的勇将而闻名。建安四年（199），袁绍以颜良、文丑为将，率精卒十万，准备攻许都；次年，兵进黎阳，遣颜良攻白马。终均亡于关羽刀下。',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['shuangxiong']
        },
        jiaxu: {
            name: '贾诩',
            intro: '字文和，武威姑臧人。三国时期魏国著名谋士。曾先后担任三国军阀李傕、张绣、曹操的谋士。官至魏国太尉，谥曰肃侯。',
            gender: 'male',
            faction: 'qun',
            hp: 3,
            skills: ['myth.wansha', 'weimu', 'myth.luanwu']
        },
        pangde: {
            name: '庞德',
            intro: '字令明，东汉末年雍州南安郡狟道县（今甘肃天水市武山县四门镇）人。曹操部下重要将领。官至立义将军，拜关门亭侯。谥曰壮侯。有一子庞会。',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['standard.mashu', 'myth.jianchu']
        },
        zhangjiao: {
            name: '张角',
            intro: '乱世的开始，黄巾起义军首领，太平道创始人。张角早年信奉黄老学说，对在汉代十分流行的谶纬之学也深有研究，对民间医术 、巫术也很熟悉。',
            gender: 'male',
            faction: 'qun',
            hp: 3,
            skills: ['leiji', 'myth.guidao']
        },
        caiwenji: {
            name: '蔡文姬',
            intro: '名琰，原字昭姬，晋时避司马昭讳，改字文姬，东汉末年陈留圉（今河南开封杞县）人，东汉大文学家蔡邕的女儿，是中国历史上著名的才女和文学家，精于天文数理，既博学能文，又善诗赋，兼长辩才与音律。代表作有《胡笳十八拍》、《悲愤诗》等。',
            gender: 'female',
            faction: 'qun',
            hp: 3,
            skills: ['myth.beige', 'myth.duanchang']
        },
        mateng: {
            name: '马腾',
            intro: '字寿成，扶风茂陵人，东汉末年征西将军，割据西凉一带的军阀，伏波将军马援的后代，官至卫尉，封爵槐里乡侯。因其子马超谋反，而被杀，夷灭三族。',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['xiongyi']
        },
        kongrong: {
            name: '孔融',
            intro: '字文举，鲁国人，东汉文学家，“建安七子”之首。献帝即位后任北军中侯、虎贲中郎将、北海相，时称孔北海后因触怒曹操，为曹操所杀。能诗善文。',
            gender: 'male',
            faction: 'qun',
            hp: 3,
            skills: ['mingshi', 'lirang']
        },
        jiling: {
            name: '纪灵',
            intro: '东汉末年袁术帐下将领，勇猛非常，曾奉命率军攻打小沛的刘备，在吕布辕门射戟的调停下撤兵。',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['shuangren']
        },
        tianfeng: {
            name: '田丰',
            intro: '字元皓。东汉末年大军阀袁绍部下重要谋士。为人刚直不阿，曾多次向袁绍进言而不被采纳。后因谏阻袁绍征伐曹操而被袁绍下令监禁，并于官渡之战后，被袁绍杀害。',
            gender: 'male',
            faction: 'qun',
            hp: 3,
            skills: ['sijian', 'suishi']
        },
        panfeng: {
            name: '潘凤',
            intro: '冀州牧韩馥部下的上将。当十八路诸侯讨伐董卓之时，他奉韩馥之命前往汜水关前挑战董卓部下大将华雄，不敌被斩。',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['kuangfu']
        },
        zoushi: {
            name: '邹氏',
            intro: '军阀张济之妻，张绣之婶。张绣降曹后，邹氏遂被曹操霸占。贾诩献计趁机诛杀曹操，险些得手。曹操在损失爱将典韦、侄子曹安民和长子曹昂后方才逃出生天。',
            gender: 'female',
            faction: 'qun',
            hp: 3,
            skills: ['huoshui', 'qingcheng']
        }
    },
    card: {
        guowuxie: {
            name: '无懈可击·国',
            caption: '无懈可击',
            intro: '一张锦囊牌生效前，对此牌使用。抵消此牌对一名角色及其相同势力产生的效果，或抵消另一张@(standard.wuxie)产生的效果。',
            type: 'trick',
            subtype: 'instant',
            originated: 'standard:wuxie',
            label: 'hege'
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
    },
    lib: {
        label: {
            hege: ['國']
        }
    },
    pile: {
        'standard:sha': {
            spade: [5, 7, 8, 8, 9, 10, 11],
            club: [2, 3, 4, 5, 8, 9, 10, 11, 11],
            heart: [10, 12],
            diamond: [10, 11, 12]
        },
        'maneuver:huosha': {
            heart: [4],
            diamond: [4, 5]
        },
        'maneuver:leisha': {
            club: [6, 7, 8],
            spade: [6, 7]
        },
        'standard:shan': {
            heart: [2, 11, 13],
            diamond: [2, 3, 6, 7, 7, 8, 8, 9, 10, 11, 13]
        },
        'standard:tao': {
            heart: [4, 6, 7, 8, 9, 10, 12],
            diamond: [2]
        },
        'maneuver:jiu': {
            diamond: [9],
            spade: [9],
            club: [9]
        },
        'maneuver:baiyin': { club: [1] },
        'standard:bagua': { spade: [2] },
        'standard:renwang': { club: [2] },
        'maneuver:tengjia': { club: [2] },
        'standard:jueying': { spade: [5] },
        'standard:dilu': { club: [5] },
        'standard:zhuahuang': { heart: [13] },
        'standard:chitu': { heart: [5] },
        'standard:dawan': { spade: [13] },
        'standard:zixin': { diamond: [13] },
        'standard:zhuge': { diamond: [1] },
        'standard:cixiong': { spade: [2] },
        'standard:qinggang': { spade: [6] },
        'wuliu': { diamond: [6] },
        'standard:zhangba': { spade: [12] },
        'standard:guanshi': { diamond: [5] },
        'sanjian': { diamond: [12] },
        'standard:hanbing': { spade: [2] },
        'maneuver:zhuque': { diamond: [1] },
        'standard:qilin': { heart: [5] },
        'standard:wanjian': { heart: [1] },
        'standard:taoyuan': { heart: [1] },
        'standard:shandian': { spade: [1] },
        'standard:wugu': { heart: [3] },
        'yuanjiao': { heart: [9] },
        'standard:wuxie': { spade: [11] },
        'standard:jiedao': { club: [12] },
        'standard:juedou': { spade: [1], club: [1] },
        'maneuver:huogong': { heart: [2, 3] },
        'zhiji': { club: [3, 4] },
        'yiyi': { diamond: [4], heart: [11] },
        'standard:lebu': { club: [6], heart: [6] },
        'standard:wuzhong': { heart: [7, 8] },
        'standard:nanman': { spade: [13], club: [7] },
        'maneuver:bingliang': { spade: [10], club: [10] },
        'guowuxie': { diamond: [12], club: [13] },
        'standard:shunshou': { diamond: [3], spade: [3, 4] },
        'standard:guohe': { heart: [12], spade: [3, 4] },
        'maneuver:tiesuo': { spade: [12], club: [12, 13] }
    }
};

export default main;
