const skill = {
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

var main = {
    cardpack: '标准',
    heropack: '标准',
    skill,
    hero: {
        caocao: {
            name: '曹操',
            intro: '魏武帝曹操，字孟德，小名阿瞒、吉利，沛国谯人。精兵法，善诗歌，乃治世之能臣，乱世之奸雄也。',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['hujia', 'jianxiong']
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
            skills: ['ganglie', 'qingjian']
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
            skills: ['tiandu', 'yiji']
        },
        zhenji: {
            name: '甄姬',
            intro: '中山无极人，别称甄洛或甄宓，庙号文昭甄皇后。魏文帝曹丕的正室。懂诗文，有倾国倾城之貌，《洛神赋》即是曹植为她所作。',
            gender: 'female',
            faction: 'wei',
            hp: 3,
            skills: ['luoshen', 'qingguo']
        },
        liubei: {
            name: '刘备',
            intro: '先主姓刘，讳备，字玄德，涿郡涿县人，汉景帝子中山靖王胜之后也。以仁德治天下。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['rende', 'jijiang']
        },
        guanyu: {
            name: '关羽',
            intro: '字云长，本字长生，并州河东解州人。五虎上将之首，爵至汉寿亭侯，谥曰“壮缪侯”。被奉为“关圣帝君”，崇为“武圣”。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['wusheng', 'yijue']
        },
        zhangfei: {
            name: '张飞',
            intro: '字翼德，涿郡人，燕颔虎须，豹头环眼。有诗云：“长坂坡头杀气生，横枪立马眼圆睁。一声好似轰雷震，独退曹家百万兵”。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['paoxiao', 'tishen']
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
            skills: ['longdan', 'yajiao']
        },
        machao: {
            name: '马超',
            intro: '字孟起，扶风茂陵人。面如冠玉，目如流星，虎体猿臂，彪腹狼腰，声雄力猛。因衣着讲究，举止非凡，故人称“锦马超”。麾铁骑，捻金枪。',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['mashu', 'tieji']
        },
        huangyueying: {
            name: '黄月英',
            intro: '荆州沔南白水人，沔阳名士黄承彦之女，诸葛亮之妻，诸葛瞻之母。容貌甚丑，而有奇才：上通天文，下察地理，韬略近于诸书无所不晓，诸葛亮在南阳闻其贤而迎娶。',
            gender: 'male',
            faction: 'shu',
            hp: 3,
            skills: ['jizhi', 'qicai']
        },
        sunquan: {
            name: '孙权',
            intro: '吴大帝，字仲谋，吴郡富春县人。统领吴与蜀魏三足鼎立，制衡天下。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['zhiheng', 'jiuyuan']
        },
        ganning: {
            name: '甘宁',
            intro: '字兴霸，巴郡临江人，祖籍荆州南阳郡。为人勇猛刚强，忠心耿耿，勇往无前。曾带兵百人于二更奇袭曹营，大挫其锐气。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['qixi', 'fenwei']
        },
        lvmeng: {
            name: '吕蒙',
            intro: '字子明，汝南富陂人。陈寿评曰：“吕蒙勇而有谋断，识军计，谲郝普，擒关羽，最其妙者。初虽轻果妄杀，终于克己，有国士之量，岂徒武将而已乎！”',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['keji', 'qinxue']
        },
        huanggai: {
            name: '黄盖',
            intro: '字公覆，零陵郡泉陵县人。官至偏将军、武陵太守。以苦肉计骗曹孟德，亲往诈降，火烧战船，重创敌军。',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['kurou', 'zhaxiang']
        },
        zhouyu: {
            name: '周瑜',
            intro: '字公瑾，庐江舒县人，任东吴三军大都督，雄姿英发，人称“美周郎”。赤壁之战前，巧用反间计杀了精通水战的叛将蔡瑁、张允。',
            gender: 'male',
            faction: 'wu',
            hp: 3,
            skills: ['yingzi', 'fanjian']
        },
        daqiao: {
            name: '大乔',
            intro: '庐江皖县人，为乔公长女，孙策之妻，小乔之姊。与小乔并称为“江东二乔”，容貌国色流离。',
            gender: 'female',
            faction: 'wu',
            hp: 3,
            skills: ['guose', 'liuli']
        },
        luxun: {
            name: '陆逊',
            intro: '本名陆议，字伯言，吴郡吴县人。历任东吴大都督、丞相。吴大帝孙权兄孙策之婿，世代为江东大族。以谦逊之书麻痹关羽，夺取荆州，又有火烧连营大破蜀军。',
            gender: 'male',
            faction: 'wu',
            hp: 3,
            skills: ['qianxun', 'lianying']
        },
        sunshangxiang: {
            name: '孙尚香',
            intro: '孙夫人，乃孙权之妹。刘备定荆州，孙权进妹与其结姻，重固盟好。孙夫人才捷刚猛，有诸兄之风。后人为其立庙，号曰“枭姬庙”。',
            gender: 'female',
            faction: 'wu',
            hp: 3,
            skills: ['jieyin', 'xiaoji']
        },
        huatuo: {
            name: '华佗',
            intro: '字元化，一名旉，沛国谯人，“建安三神医”之一。集平生之所得著《青囊经》，现已失传。',
            gender: 'male',
            faction: 'qun',
            hp: 3,
            skills: ['qingnang', 'jijiu']
        },
        lvbu: {
            name: '吕布',
            intro: '字奉先，五原郡九原县人。三国第一猛将，曾独力战刘关张三人，其武力世之无双。时人语曰：“人中有吕布，马中有赤兔。”',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['wushuang', 'liyu']
        },
        diaochan: {
            name: '貂蝉',
            intro: '中国古代四大美女之一，有闭月羞花之貌。司徒王允之义女，由王允授意施行连环计，离间董卓、吕布，借布手除卓。后貂蝉成为吕布的妾。',
            gender: 'female',
            faction: 'qun',
            hp: 3,
            skills: ['lijian', 'biyue']
        },
        huaxiong: {
            name: '华雄',
            intro: '董卓旗下名将，自荐抵抗山东地区反对董卓的诸侯联军于汜水关前，他先后斩杀济北相鲍信之弟鲍忠和孙坚部将祖茂、以及袁术部将俞涉和韩馥手下潘凤等人，最后关东联军派出关羽与之一对一决斗而被杀。',
            gender: 'male',
            faction: 'qun',
            hp: 6,
            skills: ['yaowu']
        }
    },
    card: {
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
    },
    pile: {
        sha: {
            spade: [7, 9, 9, 0, 0, 10, 10]
        }
    }
};

export default main;
