const skill = {
    zijiang: {
        name: '资粮',
        intro: '@(副将技) 当与你势力相同的一名角色受到伤害后，你可以将一张“田”交给该角色。'
    },
    jixi: {
        name: '急袭',
        intro: '@(主将技) 此武将牌减少半个阴阳鱼；你可以将一张“田”当@(standard:card.shunshou)使用。'
    },
    huyuan: {
        name: '护援',
        intro: '结束阶段，你可以将一张装备牌置入一名角色的装备区，然后你可以弃置该角色距离为1的一名角色的一张牌。'
    },
    heyi: {
        name: '鹤翼',
        intro: '@(阵法技) 与你处于同一队列的其他角色拥有@(conqueror:skill.feiying)。'
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
        intro: '@(副将技) 此武将牌上单独的阴阳鱼个数-1。若你的主将拥有技能@(hegemony:skill.guanxing)，则将其描述中的X改为5；若你的主将没有技能@(hegemony:skill.guanxing)，则你拥有技能@(hegemony:skill.guanxing)。'
    },
    tianfu: {
        name: '天覆',
        intro: '@(主将技) @(阵法技) 若当前回合角色与你处于同一队列，你拥有技能@(myth:skill.kanpo)。'
    },
    yicheng: {
        name: '疑城',
        intro: '当与你势力相同的一名角色成为@(standard:card.sha)的目标后，你可以令该角色摸一张牌然后弃置一张牌。'
    },
    shangyi: {
        name: '尚义',
        intro: '出牌阶段限一次，你可以令一名其他角色观看你的手牌。若如此做，你选择一项：1.观看其手牌并可以弃置其中的一张黑色牌；2.观看其所有暗置的武将牌。'
    },
    niaoxiang: {
        name: '鸟翔',
        intro: '@(阵法技) 在同一个围攻关系中，若你是围攻角色，则你或另一名围攻角色使用@(standard:card.sha)指定被围攻角色为目标后，你令该角色需依次使用两张@(standard:card.shan)才能抵消。'
    },
    zhendu: {
        name: '鸠毒',
        intro: '其他角色的出牌阶段开始时，你可以弃置一张手牌，然后该角色视为使用一张@(maneuver:card.jiu)，且你对其造成1点伤害。'
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
        intro: '出牌阶段，你可以移除此武将牌并选择一名角色，然后其获得技能@(conqueror:skill.yongjue)'
    },
    yongjue: {
        name: '勇决',
        intro: '若与你势力相同的一名角色于其回合内使用的第一张牌为@(standard:card.sha)，则该角色可以在此@(standard:card.sha)结算完成后获得之），若你没有获得@(conqueror:skill.yongjue)，则获得@(conqueror:skill.yongjue)的角色摸两张牌。'
    },
    yingyang: {
        name: '鹰扬',
        intro: '当你拼点的牌亮出后，你可以令此牌的点数+3或-3。'
    },
    hunshang: {
        name: '魂殇',
        intro: '@(副将技) 此武将牌减少半个阴阳鱼；准备阶段，若你的体力值不大于1，则你本回合获得@(standard:skill.yingzi)和@(myth:skill.yinghun)。'
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
        intro: '@(主将技) @(锁定技) 出牌阶段结束时，若你有副将，则你移除副将，然后加3点体力上限，回复3点体力，并获得@(myth:skill.benghuai)。'
    },
    chuanxin: {
        name: '穿心',
        intro: '可预亮,当你于出牌阶段内使用@(standard:card.sha)或@(standard:card.juedou)对目标角色造成伤害时，若其与你势力不同且有副将，你可以防止此伤害。若如此做，该角色选择一项：1.弃置装备区里的所有牌，若如此做，其失去1点体力；2.移除副将。'
    },
    fengshi: {
        name: '锋矢',
        intro: '@(阵法技) 在同一个围攻关系中，若你是围攻角色，则你或另一名围攻角色使用@(standard:card.sha)指定被围攻角色为目标后，可令该角色弃置装备区里的一张牌。'
    },
    qice: {
        name: '奇策',
        intro: '出牌阶段限一次，你可以将所有手牌当任意一张普通锦囊牌使用，你不能以此法使用目标数超过X的牌（X为你的手牌数），然后你可以@(变更副将)。'
    }
};

var main = {
    cardpack: '君临天下',
    heropack: '君临天下',
    tags: ['hero-hidden!', 'double-hero!'],
    // requires: ['meteor', 'contest'],
    skill,
    lib: {
        keyword: {
            '主将技': ['只有武将为主将时才可以发动', 'orange'],
            '副将技': ['只有武将为副将时才可以发动', 'peach'],
            '阵法技': ['在全场存活角色数为4或更多时锁定生效的技能。拥有阵法技的角色可在准备阶段开始时或出牌阶段发起阵法召唤：满足此阵法技条件的未确定势力角色均可按逆时针顺序依次明置其一张武将牌（响应阵法召唤），以发挥阵法技的效果。', 'aqua'],
            '变更副将': ['从未出场的武将中选择一名任务副将。', 'steel']
        },
        label: {
            'hezong': ['合纵', null, '合纵', '出牌阶段限一次，你可将至多三张带有合纵标记的手牌交给一名其他角色（不能与你势力相同）。若该角色与你势力不同，则你摸等量的牌。']
        }
    },
    hero: {
        dengai: {
            name: '邓艾',
            intro: '字士载，义阳棘阳人。三国时期魏国杰出的军事家、将领。公元263年他与钟会分别率军攻打蜀汉，最后他率先进入成都，使得蜀汉灭亡。后因遭到钟会的污蔑和陷害，被司马昭猜忌而被收押，最后与其子邓忠一起被卫瓘派遣的武将田续所杀害。',
            subpack: '阵',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['zijiang', 'jixi', 'myth:tuntian']
        },
        caohong: {
            name: '曹洪',
            intro: '字子廉，沛国谯（今安徽亳县）人，曹操从弟，曾献马并救护曹操。后多随军征伐，平兖州、征刘表、讨祝臂。曹丕即位时封曹洪为骠骑将军。曹叡即位，拜曹洪为后将军，更封乐城侯，后复拜为骠骑将军。曹洪逝世，追谥曰恭侯。',
            subpack: '阵',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['huyuan', 'heyi']
        },
        jiangwanfeiyi: {
            name: '蒋琬费祎',
            intro: '蒋琬，蜀四英之一。初随刘备入蜀，诸葛亮卒后封大将军，辅佐刘禅，主持朝政，统兵御魏。采取闭关息民政策，国力大增。官至大司马，安阳亭侯，谥号恭侯。费祎，蜀国著名政治家和武将，官至大将军。在一次回途的筵会中，被降将郭修刺杀而亡，谥号敬侯。',
            subpack: '阵',
            gender: 'male',
            faction: 'shu',
            hp: 3,
            skills: ['shengxi', 'shoucheng']
        },
        jiangwei: {
            name: '姜维',
            intro: '字伯约，天水冀人。三国时期蜀汉著名将领、军事统帅。原为曹魏天水郡的中郎将，后降蜀汉，官至凉州刺史、大将军。诸葛亮去世后继承诸葛亮的遗志，继续率领蜀汉军队北伐曹魏，与曹魏名将陈泰、郭淮、邓艾等多次交手。',
            subpack: '阵',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['yizhi', 'tianfu', 'myth:tiaoxin']
        },
        xusheng: {
            name: '徐盛',
            intro: '字文向，琅邪莒县人。三国时期吴将。徐盛最初因讨伐山贼有功而被加为中郎将，后于濡须口之战中表现出色，得到孙权的赞赏。魏文帝曹丕伐吴时，徐盛以疑城之计退去魏军。',
            subpack: '阵',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['yicheng']
        },
        jiangqing: {
            name: '蒋钦',
            intro: '擅长弓术。与周泰原为活跃于长江一带的江贼，孙策脱离袁术下江东自立门户时，和周泰一起率众投靠。孙策攻刘繇，并引出城中麾下的陈横、薛礼、张英三名将领，陈横后被蒋钦一箭射杀，后与韩当等将乘舟过江，乱箭射杀敌军。曾在赤壁之战与周泰，还有擅使长枪的韩当率领水军在三江口踏江破敌。',
            subpack: '阵',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['shangyi', 'niaoxiang']
        },
        hetaihou: {
            name: '何太后',
            intro: '大将军何进的妹妹，汉灵帝刘宏第二任皇后，汉少帝刘辩的生母。何氏出身于屠户家庭，后选入掖庭，得到汉灵帝临幸，生下皇子刘辩，并受封贵人。光和三年（180年），立为皇后。中平六年（189年），汉灵帝去世，刘辩继位，尊何氏为皇太后。董卓进京，废黜刘辩，不久毒杀刘辩及何氏。',
            subpack: '阵',
            gender: 'female',
            faction: 'qun',
            hp: 3,
            skills: ['zhendu', 'qiluan']
        },
        yuji: {
            name: '于吉',
            intro: '自号太平道人，琅琊人，在吴郡、会稽一带为百姓治病，甚得人心。孙策怒之，以惑人心为由斩之，后策常受吉咒而亡。',
            subpack: '阵',
            gender: 'male',
            faction: 'qun',
            hp: 3,
            skills: ['qianhuan']
        },
        lidian: {
            name: '李典',
            intro: '字曼成，曹操麾下将领。李典深明大义，不与人争功，崇尚学习与高贵儒雅，尊重博学之士，在军中被称为长者。李典有长者之风，官至破虏将军，三十六岁去世。魏文帝曹丕继位后追谥号为愍侯。',
            subpack: '势',
            gender: 'male',
            faction: 'wei',
            hp: 3,
            skills: ['meteor:xunxun', 'meteor:wangxi']
        },
        zangba: {
            name: '臧霸',
            intro: '其父臧戒，有二子臧艾与臧舜。年少时曾召集数人将获罪的父亲救出，此后四处流亡。后来成为陶谦麾下的骑都尉，负责募兵抵抗黄巾军。与孙观、尹礼等人拥兵驻屯于开阳，自成一股独立势力，后跟随吕布。吕布战败后，投降了曹操。后与袁绍、孙权等的战役里战功赫赫，官至镇东将军。',
            subpack: '势',
            gender: 'male',
            faction: 'wei',
            hp: 4,
            skills: ['hengjiang']
        },
        madai: {
            name: '马岱',
            intro: '名将马超的从弟。早年他曾经从曹操手中死里逃生，后跟随马超大战曹操。后在诸葛亮病逝后受杨仪派遣斩杀了蜀将魏延。曾率领军队出师北伐，被魏将牛金击败而退还。',
            subpack: '势',
            gender: 'male',
            faction: 'shu',
            hp: 4,
            skills: ['standard:mashu', 'qianxi']
        },
        mifuren: {
            name: '糜夫人',
            intro: '刘备夫人。徐州别驾糜竺之妹。长坂兵败，她怀抱年仅两岁的刘禅在乱军中走散，被赵云发现；但麋夫人因为赵云只有一匹马，不肯上马，在将阿斗托付给赵云后投井而亡。',
            subpack: '势',
            gender: 'female',
            faction: 'shu',
            hp: 3,
            skills: ['guixiu', 'cunsi']
        },
        sunce: {
            name: '孙策',
            intro: '字伯符，吴郡富春人。孙坚长子，孙权长兄。东汉末年割据江东一带的军阀，汉末群雄之一，三国时期吴国的奠基者。三国演义中绰号“小霸王”，统一江东。在一次狩猎中为刺客所伤，不久后身亡，年仅二十六岁。其弟孙权接掌孙策势力，并于称帝后，追谥孙策为长沙桓王。',
            subpack: '势',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['myth:jiang', 'yingyang', 'hunshang']
        },
        chenwudongxi: {
            name: '陈武董袭',
            intro: '陈武，东吴将领，孙策攻打刘繇，陈武前来相助，孙策非常喜爱陈武，拜为校尉，使作先锋。陈武以十数骑兵力杀敌五十余人。后于赤壁等战役屡立功勋。董袭献上严白虎的人头来降孙策。赤壁之战，董袭受周瑜命，分兵去汉阳，合肥会战时接应太史慈，逍遥津支援孙权。濡须口之战时，董袭在船上督战，船覆董袭坚守殉职。',
            subpack: '势',
            gender: 'male',
            faction: 'wu',
            hp: 4,
            skills: ['duanxie', 'fenming']
        },
        dongzhuo: {
            name: '董卓',
            intro: '字仲颖，陇西临洮人。东汉末年少帝、献帝时权臣，西凉军阀。官至太师、郿侯。其为人残忍嗜杀，倒行逆施，招致群雄联合讨伐，但联合军在董卓迁都长安不久后瓦解。后被其亲信吕布所杀。',
            subpack: '势',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['hengzheng', 'baoling']
        },
        zhangren: {
            name: '张任',
            intro: '刘璋的属下，以忠勇著称。刘备入蜀时，张任曾劝刘璋提防刘备，但刘璋没有听从。魏延舞剑想趁机除掉刘璋时，张任出面对舞，解救刘璋。后在刘备进攻时于落凤坡射死了庞统。',
            subpack: '势',
            gender: 'male',
            faction: 'qun',
            hp: 4,
            skills: ['chuanxin', 'fengshi']
        },
        xunyou: {
            name: '荀攸',
            intro: '',
            subpack: '变',
            gender: 'male',
            faction: 'wei',
            hp: 3,
            skills: ['qice', 'contest:zhiyu']
        }
    },
    card: {
        chiling: {
            name: '敕令',
            intro: '出牌阶段，对所有没有势力的角色使用。目标角色选择一项：1、明置一张武将牌，然后摸一张牌；2、弃置一张装备牌；3、失去1点体力。当@(conqueror:card.chiling)因判定或弃置而置入弃牌堆时，系统将之移出游戏，然后系统于当前回合结束后视为对所有没有势力的角色使用@(conqueror:card.chiling)。',
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
            intro: '你使用@(standard:card.sha)指定一名角色为目标后，该角色不能明置武将牌，直到此@(standard:card.sha)结算完毕。',
            type: 'equip',
            subtype: 'weapon',
            range: 3,
            subpack: '势备篇'
        },
        fangtian: {
            name: '方天画戟',
            intro: '你使用的@(standard:card.sha)可以指定任意名势力各不相同的角色及未确定势力的角色为目标。当此@(standard:card.sha)被一名目标角色使用@(standard:card.shan)抵消时，此@(standard:card.sha)对其他目标角色无效。',
            type: 'equip',
            subtype: 'weapon',
            range: 4,
            subpack: '势备篇'
        },
        huxin: {
            name: '护心镜',
            intro: '当你受到伤害时，若伤害值大于或等于你的体力值，则你可以将@(conqueror:card.huxin)置入弃牌堆，然后防止此伤害。',
            type: 'equip',
            subtype: 'armor',
            subpack: '势备篇'
        },
        mingguang: {
            name: '明光铠',
            intro: '@(锁定技) 当你成为@(conqueror:card.huoshao)、@(maneuver:card.huogong)或火@(standard:card.sha)的目标时，取消之；若你是小势力角色，你不会被横置。',
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
            intro: '@(锁定技) 若你有明置的武将牌，你的势力视为唯一的大势力；锁定技，摸牌阶段，若你有明置的武将牌，你多摸一张牌；锁定技，出牌阶段开始时，若你有明置的武将牌，你视为使用@(hegemony:skill.zhiji)。',
            type: 'equip',
            subtype: 'treasure',
            subpack: '势备篇'
        },
        dinglan: {
            name: '定澜夜明珠',
            intro: '@(锁定技) 你视为拥有技能@(hegemony:skill.zhiheng)，若你已经有@(hegemony:skill.zhiheng)，则改为取消弃置牌数的限制。',
            type: 'equip',
            subtype: 'treasure',
            subpack: '君主专属'
        },
        feilong: {
            name: '飞龙夺凤',
            intro: '当你使用@(standard:card.sha)指定一名角色为目标后，你可令该角色弃置一张牌。你使用@(standard:card.sha)杀死一名角色后，若你所属的势力是全场最少的（或之一），你可令该角色的使用者选择是否从未使用的武将牌中选择一张与你势力相同的武将牌重新加入游戏。',
            type: 'equip',
            subtype: 'weapon',
            subpack: '君主专属'
        },
        taiping: {
            name: '太平要术',
            intro: '@(锁定技) 防止你受到的所有属性伤害；全场每有一名与你势力相同的角色存活，所有此势力角色的手牌上限便+1；当你失去装备区里的@(conqueror:card.taiping)时，你失去1点体力，然后摸两张牌。',
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
    },
    pile: {
        'standard:sha': {
            spade: [4, 7, 8],
            club: [4, 6, 7, 8],
            heart: [10, 11]
        },
        'maneuver:huosha': {
            diamond: [8, 9]
        },
        'maneuver:leisha': {
            club: [[5, 'hezong']],
            spade: [9, 10, [11, 'hezong']]
        },
        'standard:shan': {
            heart: [4, 5, 6, 7],
            diamond: [6, 7, 13]
        },
        'standard:tao': {
            heart: [8, 9],
            diamond: [2, [3, 'hezong']]
        },
        'maneuver:jiu': {
            club: [9],
            spade: [[6, 'hezong']]
        },
        qinglong: { spade: [5] },
        fangtian: { diamond: [12] },
        mingguang: { spade: [2] },
        huxin: { club: [[2, 'hezong']] },
        jingfan: { heart: [[3, 'hezong']] },
        yuxi: { club: [1] },
        'maneuver:muniu': { diamond: [5] },
        lianjun: { heart: [1] },
        chiling: { club: [3] },
        'standard:wuxie': { spade: [13] },
        diaohu: { heart: [[2, 'hezong']], diamond: [[10, 'hezong']] },
        luli: { club: [10], spade: [12] },
        'hegemony:guowuxie': { diamond: [11], club: [13] },
        shuiyan: { club: [12], heart: [13] },
        xietian: { spade: [[1, 'hezong']], diamond: [[1, 'hezong'], [4, 'hezong']] },
        huoshao: { spade: [[3, 'hezong']], club: [[11, 'hezong']], heart: [[12, 'hezong']] }
    }
};

export default main;
