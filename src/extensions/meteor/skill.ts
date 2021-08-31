export const skill = {
    kangkai: {
        name: '慷忾',
        intro: '当一名角色成为@(standard.sha)的目标后，若你与其距离1以内，则你可以摸一张牌，然后交给其一张牌并展示之。若此牌为装备牌，该角色可以使用此牌。'
    },
    gongao: {
        name: '功獒',
        intro: '@(锁定技) 当其他角色死亡后，你加1点体力上限，然后回复1点体力。'
    },
    juyi: {
        name: '举义',
        intro: '@(觉醒技) 准备阶段，若你已受伤且体力上限大于全场角色数，你将手牌摸至等同于体力上限的张数，然后获得@(myth.benghuai)和@(meteor.weizhong)。'
    },
    weizhong: {
        name: '威重',
        intro: '@(锁定技) 当你的体力上限变化时，你摸一张牌。'
    },
    fumian: {
        name: '福绵',
        intro: '准备阶段，你可以选择一项：1.摸牌阶段多摸一张牌；2.使用红色牌可以多选择一个目标（限一次）。若与你上回合选择的选项不同，则该选项数值+1并复原此技能。'
    },
    daiyan: {
        name: '怠宴',
        intro: '结束阶段，你可以令一名其他角色从牌堆中获得一张红桃基本牌，然后若其于上回合成为过该技能目标，其失去1点体力。'
    },
    shenxian: {
        name: '甚贤',
        intro: '每名其他角色的回合限一次，当其他角色因弃置而失去基本牌后，你可以摸一张牌。'
    },
    qiangwu: {
        name: '枪舞',
        intro: '出牌阶段限一次，你可以进行判定，然后本回合你使用点数小于判定结果的@(standard.sha)无距离限制，点数大于判定结果的@(standard.sha)无次数限制。'
    },
    hongde: {
        name: '弘德',
        intro: '当你一次性获得或失去至少两张牌时，你可以令一名其他角色摸一张牌。'
    },
    dingpan: {
        name: '定叛',
        intro: '出牌阶段限X次，你可以令一名装备区有牌的角色摸一张牌并选择一项：1.你弃置其一张装备牌；2.收回装备区里的牌，你对其造成1点伤害。（X为场上反贼数）'
    },
    kuangbi: {
        name: '匡弼',
        intro: '出牌阶段限一次，你可以令一名其他角色将至多三张牌置于你的武将牌上。你的下回合开始时，你获得这些牌，然后该角色摸等量的牌。'
    },
    shouxi: {
        name: '守玺',
        intro: '当你成为@(standard.sha)的目标后，你可声明一种牌名（每种牌名限一次），然后除非使用者弃置一张你声明的牌，并获得你的一张牌，否则此@(standard.sha)无效。'
    },
    huimin: {
        name: '惠民',
        intro: '结束阶段，你可以摸X张牌（X为手牌数小于其体力值的角色数），然后展示等量的手牌，从你选择的一名角色开始依次获得其中一张。'
    },
    tianming: {
        name: '天命',
        intro: '当你成为@(standard.sha)的目标后，你可以先弃置两张牌再摸两张牌。然后全场体力值最大的其他角色也可以如此做。'
    },
    mizhao: {
        name: '密诏',
        intro: '出牌阶段限一次，你可以将所有手牌交给一名其他角色，然后令该角色与另一名其他角色拼点，拼点赢的角色视为对拼点没赢的角色使用一张@(standard.sha)。'
    },
    andong: {
        name: '安东',
        intro: '当你受到其他角色造成的伤害时，你可令伤害来源选择一项：1.防止此伤害，本回合弃牌阶段红桃牌不计入手牌上限；2.观看其手牌，若其中有红桃牌则你获得这些红桃牌。'
    },
    yingshi: {
        name: '应势',
        intro: '出牌阶段开始时，若没有武将牌旁有“酬”的角色，你可将所有红桃牌置于一名其他角色的武将牌旁，称为“酬”。若如此做，当一名角色使用@(standard.sha)对武将牌旁有“酬”的角色造成伤害后，其可以获得一张“酬”。当武将牌旁有“酬”的角色死亡时，你获得所有“酬”。'
    },
    xunxun: {
        name: '恂恂',
        intro: '摸牌阶段开始时，你可以观看牌堆顶的四张牌，然后将其中的两张牌置于牌堆顶，将其余的牌置于牌堆底。'
    },
    wangxi: {
        name: '忘隙',
        intro: '当你造成或受到其他角色的1点伤害后，你可以与其各摸一张牌。'
    },
    junbing: {
        name: '郡兵',
        intro: '一名角色的结束阶段，若其手牌数小于等于1，其可以摸一张牌并将所有手牌交给你，然后你将等量的牌交给该角色。'
    },
    quji: {
        name: '去疾',
        intro: '出牌阶段限一次，你可以弃置X张牌，令最多X名（X为你已损失的体力值）角色各回复1点体力。若你弃置过黑色牌，你失去1点体力。'
    },
    bingzheng: {
        name: '秉正',
        intro: '出牌阶段结束时，你可以令手牌数不等于体力值的一名角色弃置一张手牌或摸一张牌。然后若其手牌数等于体力值，你摸一张牌，且可以交给该角色一张牌。'
    },
    sheyan: {
        name: '宴舍',
        intro: '当你成为一张普通锦囊牌的目标时，你可以为此牌增加一个目标或减少一个目标。（目标数至少为一）'
    },
    guanchao: {
        name: '观潮',
        intro: '出牌阶段开始时，你可以选择一项直到回合结束：1.当你使用牌时，若你此阶段使用过的所有牌的点数为严格递增，你摸一张牌；2. 当你使用牌时，若你此阶段使用过的所有牌的点数为严格递减，你摸一张牌。'
    },
    xunxian: {
        name: '逊贤',
        intro: '每名其他角色的回合限一次，你使用或打出的牌置入弃牌堆时，你可以将之交给一名手牌比你多的角色。'
    },
    huanshi: {
        name: '缓释',
        intro: '当一名角色的判定牌生效前，你可以令其观看你的手牌并选择你的一张牌，然后你打出此牌代替判定牌。'
    },
    hongyuan: {
        name: '弘援',
        intro: '摸牌阶段，你可以少摸一张牌，然后令至多两名其他角色各摸一张牌。'
    },
    mingzhe: {
        name: '明哲',
        intro: '当你于回合外因使用、打出或弃置而失去一张红色牌时，你可以摸一张牌。'
    },
    tushe: {
        name: '图射',
        intro: '当你使用非装备牌指定目标后，若你没有基本牌，则你可以摸X张牌（X为此牌指定的目标数）。'
    },
    limu: {
        name: '立牧',
        intro: '出牌阶段，你可以将一张方块牌当@(standard.lebu)自己使用，然后回复1点体力；你的判定区有牌时，你对攻击范围内的其他角色使用牌没有次数和距离限制。'
    },
    yishe: {
        name: '义舍',
        intro: '结束阶段，若你没有“米”，你可以摸两张牌，然后将两张牌置于武将牌上，称为“米”；当你移去最后一张“米”时，你回复1点体力。 '
    },
    bushi: {
        name: '布施',
        intro: '当你受到1点伤害后，你可以获得一张“米”；当你对其他角色造成伤害后，其可以获得一张“米”。'
    },
    midao: {
        name: '米道',
        intro: '当一张判定牌生效前，你可以打出一张“米”代替之。'
    },
    jiaozhao: {
        name: '矫诏',
        intro: '出牌阶段限一次，你可以展示一张手牌，然后令你距离最近的角色声明一种基本牌，你可将此牌当声明的牌使用（不能对自己使用）。修改1：出牌阶段限一次，你可以展示一张手牌，然后令你距离最近的角色声明一种基本牌或普通锦囊牌，你可将此牌当声明的牌使用（不能对自己使用）。修改2：出牌阶段限一次，你可以将一张手牌当任意一种基本牌或普通锦囊牌用（不能对自己使用）。'
    },
    danxin: {
        name: '殚心',
        intro: '当你受到伤害后，你可以摸一张牌，或修改@(meteor.jiaozhao)。'
    },
    xianfu: {
        name: '先辅',
        intro: '@(锁定技) 游戏开始时，你选择一名其他角色，当其受到伤害后，你受到等量的伤害；当其回复体力后，你回复等量的体力。'
    },
    chouce: {
        name: '筹策',
        intro: '当你受到1点伤害后，你可以判定，若结果为：黑色，你弃置一名角色区域里的一张牌；红色，你令一名角色摸一张牌（先辅的角色摸两张）。'
    },
    jianzheng: {
        name: '谏征',
        intro: '其他角色使用@(standard.sha)指定除你外的角色时，若你在其攻击范围内，你可以将一张手牌置于牌堆顶，取消所有目标，然后若此@(standard.sha)不为黑色，你成为目标。'
    },
    zhuandui: {
        name: '专对',
        intro: '当你使用@(standard.sha)指定目标后，你可以与其拼点，若你赢，其不能响应此@(standard.sha)；当你成为@(standard.sha)的目标后，你可以与其拼点，若你赢，此@(standard.sha)对你无效。'
    },
    tianbian: {
        name: '天辩',
        intro: '你可以用牌堆顶牌进行拼点；若你拼点的牌花色为红桃，则点数视为K。'
    },
    qianya: {
        name: '谦雅',
        intro: '当你成为锦囊牌的目标后，你可以将任意张手牌交给一名其他角色。'
    },
    shuimeng: {
        name: '说盟',
        intro: '出牌阶段结束时，你可以与一名角色拼点：若你赢，视为你使用@(standard.wuzhong)；若你没赢，视为拼点角色对你使用@(standard.guohe)。'
    },
    guanwei: {
        name: '观微',
        intro: '每名角色的回合限一次，出牌阶段结束时，若其于此回合内使用过至少两张牌且这些牌花色均相同，你可弃置一张牌。其摸两张牌，获得一个额外出牌阶段。'
    },
    gongqing: {
        name: '公清',
        intro: '@(锁定技) 当你受到伤害时，若伤害来源攻击范围小于3，则你只受到1点伤害；若伤害来源攻击范围大于3，则此伤害+1。'
    },
    funan: {
        name: '复难',
        intro: '其他角色响应你使用的牌时，你可令其获得你使用的牌，然后你获得其使用或打出的牌。修改：其他角色响应你使用的牌时，你可获得其使用或打出的牌。'
    },
    jiexun: {
        name: '诫训',
        intro: '结束阶段，你令一名其他角色摸场上方块牌数张牌，然后弃置X张牌（X为此技能发动次数）。若其因此弃置了所有牌，则你失去@(meteor.jiexun)，修改@(meteor.funan)。'
    },
    bizhuan: {
        name: '辟撰',
        intro: '当你使用黑桃牌后，或你成为其他角色使用黑桃牌的目标后，你可以将牌堆顶的一张牌置于武将牌上，称为“书”；你至多拥有四张“书”，你每有一张“书” ，手牌上限+1。'
    },
    tongbo: {
        name: '通博',
        intro: '摸牌阶段结束后，你可以用任意张牌替换等量的“书”，然后若你的“书”包含四种花色，你将所有“书”交给任意名其他角色。'
    },
    sanwen: {
        name: '散文',
        intro: '当你获得牌时，若你手中有与这些牌牌名相同的牌，你可以展示之，并弃置获得的同名牌，然后摸弃牌数两倍数量的牌。每回合限一次。'
    },
    qiai: {
        name: '七哀',
        intro: '@(限定技) 当你进入濒死状态时，你可令其他每名角色交给你一张牌。'
    },
    denglou: {
        name: '登楼',
        intro: '@(限定技) 结束阶段开始时，若你没有手牌，你可以观看牌堆顶的四张牌，然后获得其中的非基本牌，并使用其中的基本牌（不能使用则弃置）。'
    },
    chenqing: {
        name: '陈情',
        intro: '每轮限一次，当一名角色进入濒死状态时，你可以令另一名其他角色摸四张牌，然后弃置四张牌，若花色各不相同，则其视为对处于濒死状态的角色使用一张@(standard.tao)。'
    },
    mozhi: {
        name: '默识',
        intro: '结束阶段，你可以将一张手牌当你出牌阶段内使用过的第一张基本牌或普通锦囊牌使用，然后你可以将一张手牌当你出牌阶段使用过的第二张基本牌或普通锦囊牌使用。'
    },
    kunfen: {
        name: '困奋',
        intro: '@(锁定技) 结束阶段，你失去1点体力，然后摸两张牌。修改：改为非锁定技'
    },
    fengliang: {
        name: '逢亮',
        intro: '@(觉醒技) 当你进入濒死状态时，你减1点体力上限并将体力回复至2点，然后获得@(myth.tiaoxin)，并修改@(meteor.kunfen)。'
    },
    juesi: {
        name: '决死',
        intro: '出牌阶段，你可以弃置一张@(standard.sha)并选择你攻击范围内的一名其他角色，然后该角色弃置一张牌。若其弃置的不是@(standard.sha)且你的体力值小于等于该角色，则视为你对其使用@(standard.juedou)。'
    },
    liangzhu: {
        name: '良助',
        intro: '当一名角色于其出牌阶段内回复体力后，你可以选择一项：1.摸一张牌；2.令其摸两张牌。'
    },
    fanxiang: {
        name: '返乡',
        intro: '@(觉醒技) 准备阶段，若有至少一名已受伤且你发动过@(meteor.liangzhu)令其摸牌的角色，则你加1点体力上限，然后回复1点体力，失去@(meteor.liangzhu)并获得@(standard.xiaoji)。'
    },
    wuyan: {
        name: '无言',
        intro: '@(锁定技) 防止你使用和你受到的锦囊牌造成的伤害。'
    },
    jujian: {
        name: '举荐',
        intro: '结束阶段，你可以弃置一张非基本牌并令一名其他角色选择一项：1.摸两张牌；2.回复1点体力；3.复原武将牌。'
    },
    guolun: {
        name: '过论',
        intro: '出牌阶段限一次，你可展示一名其他角色的一张手牌。然后你可选择你的一张牌。若其选择的牌点数小，你与其交换这两张牌，其摸一张牌；若你选择的牌点数小，你与其交换这两张牌，你摸一张牌。'
    },
    songsang: {
        name: '送丧',
        intro: '@(限定技) 当其他角色死亡时，若你已受伤，你可回复1点体力；若你未受伤，你可加1点体力上限。若如此做，你获得@(meteor.zhanji)。'
    },
    zhanji: {
        name: '展骥',
        intro: '@(锁定技) 当你于出牌阶段内因摸牌且并非因发动此技能而得到牌时，你摸一张牌。'
    },
    jiqiao: {
        name: '机巧',
        intro: '出牌阶段开始时，你可以弃置任意张装备牌，然后你亮出牌堆顶两倍数量的牌，获得其中的锦囊牌。'
    },
    linglong: {
        name: '玲珑',
        intro: '@(锁定技) 若你的装备区里没有防具牌，你视为装备着@(standard.bagua)；若你的装备区里没有坐骑牌，你的手牌上限+1；若你的装备区里没有宝物牌，你视为拥有@(standard.qicai)。'
    },
    jixu: {
        name: '击虚',
        intro: '出牌阶段限一次，你可令体力值相同的至少一名其他角色各猜测你的手牌区里是否有@(standard.sha)。系统公布这些角色各自的选择和猜测结果。若你的手牌区里：有@(standard.sha)，当你于此阶段内使用@(standard.sha)选择目标后，你令所有选择“否”的角色也成为此@(standard.sha)的目标；没有@(standard.sha)，你弃置所有选择“是”的角色的各一张牌。你摸X张牌（X为猜错的角色数）。若没有猜错的角色，你结束此阶段。'
    },
    zhenwei: {
        name: '镇卫',
        intro: '当其他角色成为@(standard.sha)或黑色锦囊牌的唯一目标时，若其体力值小于你，你可以弃置一张牌并选择一项：1.摸一张牌，然后将目标转移给你；2.令此牌无效，回合结束后归还使用者。'
    },
    duliang: {
        name: '督粮',
        intro: '出牌阶段限一次，你可以获得一名其他角色的一张手牌，并选择一项：1.令其观看牌堆顶的两张牌，获得其中的基本牌；2.令其于其下个回合摸牌阶段多摸一张牌。'
    },
    fulin: {
        name: '腹鳞',
        intro: '@(锁定技) 弃牌阶段内，你于此回合内获得的牌不计入你的手牌数。'
    },
    fuman: {
        name: '抚蛮',
        intro: '出牌阶段每名角色限一次，你可以将一张@(standard.sha)交给一名其他角色，然后其使用\'抚蛮\'牌时，你摸一张牌。'
    },
    ziyuan: {
        name: '资援',
        intro: '出牌阶段限一次，你可以将任意张点数之和为13的手牌交给一名其他角色，然后该角色回复1点体力。'
    },
    jugu: {
        name: '巨贾',
        intro: '@(锁定技) 你的手牌上限+X；游戏开始时，你多摸X张牌。（X为你的体力上限数）'
    },
    youdi: {
        name: '诱敌',
        intro: '结束阶段，你可以令一名其他角色弃置你一张手牌，若弃置的牌不是@(standard.sha)，则你获得其一张牌；若弃置的牌不是黑色，则你摸一张牌。'
    },
    duanfa: {
        name: '断发',
        intro: '出牌阶段，你可以弃置任意张黑色牌，然后摸等量的牌（你每阶段以此法弃置的牌数总和不能大于体力上限）。'
    },
    qizhou: {
        name: '绮胄',
        intro: '@(锁定技) 你根据装备区里牌的花色数获得以下技能：1种或以上-@(standard.mashu)；2种或以上-@(standard.yingzi)；3种或以上-@(meteor.duanbing)；4种-@(standard.fenwei)。'
    },
    duanbing: {
        name: '短兵',
        intro: '你使用@(standard.sha)可以多选择一名距离为1的角色为目标'
    },
    shanxi: {
        name: '闪袭',
        intro: '出牌阶段限一次，你可以弃置一张红色基本牌，然后弃置攻击范围内的一名角色的一张牌，若弃置的牌是@(standard.shan)，你观看其手牌，若弃置的不是@(standard.shan)，其观看你的手牌。 '
    },
    qinguo: {
        name: '勤国',
        intro: '当你于回合内使用装备牌结算结束后，你可视为使用一张@(standard.sha)。当你的装备区里的牌移动后，或装备牌移至你的装备区后，若你装备区里的牌数与你的体力值相等且与此次移动之前你装备区里的牌数不等，你回复1点体力。'
    },
    kannan: {
        name: '戡难',
        intro: '出牌阶段，若你于此阶段内发动过此技能的次数小于X（X为你的体力值），你可与你于此阶段内未以此法拼点过的一名角色拼点。若：你赢，你使用的下一张@(standard.sha)的伤害值基数+1且你于此阶段内不能发动此技能；其赢，其使用的下一张@(standard.sha)的伤害值基数+1。'
    },
    weilu: {
        name: '威虏',
        intro: '@(锁定技) 当你受到其他角色造成的伤害后，伤害来源在你的下回合出牌阶段开始时失去体力值直到仅剩1点体力，然后回合结束时回复以此法失去的体力值。'	
    },
    zengdao: {
        name: '赠刀',
        intro: '@(限定技) 出牌阶段，你可以将装备区内任意数量的牌置于一名其他角色的武将牌旁。该角色每次造成伤害时，移去一张“赠刀”牌  ，然后此伤害+1。'	
    },
    xuehen: {
        name: '雪恨',
        intro: '出牌阶段限一次，你可以弃置一张红色牌，然后横置至多X名角色，并对其中一名角色造成1点火焰伤害（X为你已损失的体力值数）。'	
    },
    huxiao: {
        name: '虎啸',
        intro: '@(锁定技) 当你造成火焰伤害后，受伤的角色摸一张牌，然后本回合你对其使用牌没有次数限制。'	
    },
    wuji: {
        name: '武继',
        intro: '@(觉醒技) 结束阶段，若你本回合造成了3点或更多伤害，你加1点体力上限并回复1点体力，失去“虎啸”，然后获得@(standard.qinglong)。'	
    },
    fengpo: {
        name: '凤魄',
        intro: '你在回合内使用第一张@(standard.sha)或@(standard.juedou)指定一个目标后，你可以选择一项：1.摸X张牌；2.此牌造成的伤害+X。（X为其方块手牌数）'	
    },
    wengua: {
        name: '问卦',
        intro: '所有角色出牌阶段限一次，其可以交给你一张牌，然后你可以将此牌置于牌堆顶或牌堆底，你与其从另一端摸一张牌。'	
    },
    fuzhu: {
        name: '伏诛',
        intro: '一名男性角色的结束阶段内，若牌堆剩余牌数小于等于你体力值的十倍，则你可以依次对其使用牌堆中所有的@(standard.sha)。'	
    },
    yinbing: {
        name: '引兵',
        intro: '结束阶段，你可以将任意张非基本牌置于你的武将牌上；当你受到@(standard.sha)或@(standard.juedou)造成的伤害后，你移去一张\'引兵\'牌。'	
    },
    juedi: {
        name: '绝地',
        intro: '@(锁定技) 准备阶段，你选择一项：1.移去\'引兵\'牌，然后将手牌摸至体力上限；2.令体力值小于等于你的一名其他角色获得\'引兵\'牌，然后回复1点体力并摸等量的牌。'	
    },
    yicong: {
        name: '义从',
        intro: '@(锁定技) 若你的体力值大于2，你计算与其他角色的距离-1；若你的体力值不大于2，其他角色计算与你的距离+1。'	
    },
    qiaomeng: {
        name: '趫猛',
        intro: '当你使用的黑色@(standard.sha)对一名角色造成伤害后，你可弃置其装备区里的一张牌。若此牌为坐骑牌，你获得之。'	
    },
    luanzhan: {
        name: '乱战',
        intro: '你使用@(standard.sha)或黑色普通锦囊牌可以多选择X名角色为目标；当你使用@(standard.sha)或黑色普通锦囊牌指定目标后，若此牌的目标角色数小于X，则X减至0。（X为你于本局游戏内造成过伤害的次数）'	
    },
    jijun: {
        name: '集军',
        intro: '当武器牌或不为装备牌的牌于你的出牌阶段内指定第一个目标后，若此牌的使用者为你且你是此牌的目标之一，你可判定。当此次判定的判定牌移至弃牌堆后，你可将此判定牌置于武将牌上（称为“方”）。'	
    },
    fangtong: {
        name: '方统',
        intro: '结束阶段开始时，若有“方”，你可弃置一张牌，若如此做，你将至少一张“方”置入弃牌堆。若此牌与你以此法置入弃牌堆的所有“方”的点数之和为36，你对一名其他角色造成3点雷电伤害。'	
    }
};