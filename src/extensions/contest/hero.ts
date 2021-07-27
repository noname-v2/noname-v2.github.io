import type { HeroDict } from '../sgs/sgs';

export const hero = {
    caozhi: {
        name: '曹植',
        intro: '字子建，沛国谯人，三国曹魏著名文学家，建安文学代表人物。魏武帝曹操之子，魏文帝曹丕之弟，生前曾为陈王，去世后谥号“思”，因此又称陈思王。南朝宋文学家谢灵运更有“天下才有一石，曹子建独占八斗”的评价。王士祯尝论汉魏以来二千年间诗家堪称“仙才”者，曹植、李白、苏轼三人耳。',
        subpack: '一',
        gender: 'male',
        faction: 'wei',
        hp: 3,
        skills: ['luoying', 'jiushi']
    },
    yujin: {
        name: '于禁',
        intro: '字文则，泰山钜平人。三国时期曹魏武将。本为鲍信部将，后属曹操，曹操称赞他可与古代名将相比。然而在建安二十四年的襄樊之战中，于禁在败给关羽后投降，致使一代名将晚节不保。',
        subpack: '一',
        gender: 'male',
        faction: 'wei',
        hp: 4,
        skills: ['zhenjun']
    },
    zhangchunhua: {
        name: '张春华',
        intro: '西晋宣穆皇后张春华（189－247），河内平皋（今河南温县）人。她是晋宣帝司马懿之妻，晋景帝司马师、晋文帝司马昭的母亲。后被追尊为皇后。',
        subpack: '一',
        gender: 'female',
        faction: 'wei',
        hp: 3,
        skills: ['jueqing', 'shangshi']
    },
    fazheng: {
        name: '法正',
        intro: '字孝直，本为刘璋部下，刘备围成都时劝说刘璋投降，而后又与刘备进取汉中，献计将曹操大将夏侯渊斩首。法正善奇谋，深受刘备信任和敬重。',
        subpack: '一',
        gender: 'male',
        faction: 'shu',
        hp: 3,
        skills: ['enyuan', 'xuanhuo']
    },
    masu: {
        name: '马谡',
        intro: '字幼常，襄阳宜城人，三国时期蜀汉大臣，侍中马良之弟。初以荆州从事跟随刘备取蜀入川，曾任绵竹、成都令、越嶲太守。诸葛亮北伐时因作战失误而失守街亭，因而被诸葛亮所斩。',
        subpack: '一',
        gender: 'male',
        faction: 'shu',
        hp: 3,
        skills: ['sanyao', 'zhiman']
    },
    xushu: {
        name: '徐庶',
        intro: '字元直，与司马徽、诸葛亮等人为友。先化名单福仕官于新野的刘备，后因曹操囚禁其母而不得不弃备投操，临行前向刘备推荐诸葛亮之才。入曹营后，一言不发，不曾为曹操进献过一计半策。后人形容徐庶“身在曹营心在汉”。',
        subpack: '一',
        gender: 'male',
        faction: 'shu',
        hp: 3,
        skills: ['zhuhai', 'qianxin']
    },
    lingtong: {
        name: '凌统',
        intro: '字公绩，吴郡馀杭人，三国时期吴国名将。凌操之子，官至偏将军。',
        subpack: '一',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['xuanfeng']
    },
    wuguotai: {
        name: '吴国太',
        intro: '吴国太，小说《三国演义》中的人物，不见于正史记载。在小说中，吴国太被描述为孙坚的次妻，孙坚正妻武烈皇后（小说中写作吴太夫人）的妹妹，孙朗、孙仁（孙尚香）的母亲。',
        subpack: '一',
        gender: 'female',
        faction: 'wu',
        hp: 3,
        skills: ['ganlu', 'buyi']
    },
    xusheng: {
        name: '徐盛',
        intro: '字文向，琅邪莒县人。三国时期吴将。徐盛最初因讨伐山贼有功而被加为中郎将，后于濡须口之战中表现出色，得到孙权的赞赏。魏文帝曹丕伐吴时，徐盛以疑城之计退去魏军。',
        subpack: '一',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['pojun']
    },
    chengong: {
        name: '陈宫',
        intro: '字公台，东汉末年吕布帐下谋士，东郡东武阳人。性情刚直，足智多谋，年少时与海内知名之士相互结交。192年，陈宫等人主张曹操接任兖州牧。但此后陈宫因曹操杀害边让而与曹操反目，并游说张邈等人背叛曹操迎吕布入兖州，辅助吕布攻打曹操。吕布战败后，随吕布等一同被曹操所擒，决意赴死。',
        subpack: '一',
        gender: 'male',
        faction: 'qun',
        hp: 3,
        skills: ['mingce', 'zhichi']
    },
    gaoshun: {
        name: '高顺',
        intro: '吕布帐下中郎将。史载高顺为人清白有威严，不好饮酒，所统率的部队精锐非常，号称“陷阵营”。屡进忠言于吕布，吕布虽知其忠而不能用。曹操击破吕布后，高顺被曹操所杀。',
        subpack: '一',
        gender: 'male',
        faction: 'qun',
        hp: 4,
        skills: ['xianzhen', 'jinjiu']
    },

    caozhang: {
        name: '曹彰',
        intro: '字子文，是曹操与武宣卞皇后所生第二子，曹丕之弟，曹植之兄，曹魏任城王。曹彰武艺过人，曹操问诸子志向时自言“好为将”，因此得到曹操的赞赏。其胡须黄色，被曹操称为“黄须儿”。',
        subpack: '二',
        gender: 'male',
        faction: 'wei',
        hp: 4,
        skills: ['jiangchi']
    },
    wangyi: {
        name: '王异',
        intro: '益州刺史赵昂之妻，赵英、赵月之母。马超作乱凉州时，王异协助丈夫守城，多有功勋，自马超攻冀城至祁山坚守，赵昂曾出奇计九条，王异皆有参与。',
        subpack: '二',
        gender: 'female',
        faction: 'wei',
        hp: 3,
        skills: ['zhenlie', 'miji']
    },
    xunyou: {
        name: '荀攸',
        intro: '字公达，颍川颍阴人。东汉末年曹操的五谋臣之一，荀彧从子，被曹操称为“谋主”。官至尚书令。正始五年被追谥为敬侯。',
        subpack: '二',
        gender: 'male',
        faction: 'wei',
        hp: 3,
        skills: ['zhiyu', 'qice']
    },
    zhonghui: {
        name: '钟会',
        intro: '字士季。魏名将，太傅钟繇之子。公元263年，他与邓艾带兵攻打蜀国，最终导致蜀国灭亡。之后钟会设计害死邓艾，联合姜维准备自立，最终因部下反叛失败，与姜维一同死于兵变。',
        subpack: '二',
        gender: 'male',
        faction: 'wei',
        hp: 4,
        skills: ['quanji', 'zili']
    },
    guanxingzhangbao: {
        name: '关兴张苞',
        intro: '关兴，名将关羽之子，继承了父亲汉寿亭侯的爵位。年少时即受诸葛亮器重，在蜀汉担任侍中、中监军之职，后在夷陵之战中报了杀父之仇。张苞，张飞的长子，使用父亲的家传蛇矛为兵器，勇猛剽悍不弱其父。',
        subpack: '二',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['fuhun']
    },
    liaohua: {
        name: '廖化',
        intro: '本名淳，字元俭，襄阳中卢（今湖北襄樊）人。三国时期蜀国后期将领，以勇敢果断著称。廖化是三国时代中经历了魏、蜀、吴整个兴衰过程极少数人中的一个，与严颜、黄忠共称为蜀汉三老将。',
        subpack: '二',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['dangxian', 'fuli']
    },
    madai: {
        name: '马岱',
        intro: '名将马超的从弟。早年他曾经从曹操手中死里逃生，后跟随马超大战曹操。后在诸葛亮病逝后受杨仪派遣斩杀了蜀将魏延。曾率领军队出师北伐，被魏将牛金击败而退还。',
        subpack: '二',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['standard:mashu', 'qianxi']
    },
    bulianshi: {
        name: '步练师',
        intro: '步夫人（？－238），讳练师，临淮淮阴人。东吴丞相步骘同族，吴大帝孙权之妃，在孙权众夫人中最受孙权的宠爱（宠冠后庭），生有二女：孙鲁班、孙鲁育。赤乌元年卒，追封为皇后，葬于蒋陵。',
        subpack: '二',
        gender: 'female',
        faction: 'wu',
        hp: 3,
        skills: ['anxu', 'zhuiyi']
    },
    chengpu: {
        name: '程普',
        intro: '字德谋，右北平土垠人。历仕孙坚、孙策、孙权三任君主。孙策死后，他与张昭等人共同辅佐孙权，并讨伐江东境内的山贼，功勋卓著。被人们尊称为“程公”。',
        subpack: '二',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['lihuo', 'chunlao']
    },
    handang: {
        name: '韩当',
        intro: '字义公，辽西令支（今河北迁安）人，吴国将领。韩当因为长于弓箭、骑术并且膂力过人而被孙坚赏识，追随他四处征伐周旋，数次冒险犯难，攻陷敌人、擒拿俘虏。对江东基业的逐渐稳固和吴国的建立有着重要影响。',
        subpack: '二',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['gongqi', 'jiefan']
    },
    liubiao: {
        name: '刘表',
        intro: '刘表，字景升，山阳郡高平（今山东微山）人。东汉末年名士，汉室宗亲，荆州牧，汉末群雄之一。',
        subpack: '二',
        gender: 'male',
        faction: 'qun',
        hp: 3,
        skills: ['zongshi_lb', 'zishou']
    },
    
    caochong: {
        name: '曹冲',
        intro: '字仓舒，曹操之子。从小聪明仁爱，与众不同，深受曹操喜爱。留有“曹冲称象”的典故。曹操几次对群臣夸耀他，有让他继嗣之意。可惜曹冲在建安十三病逝，年仅13岁。',
        subpack: '三',
        gender: 'male',
        faction: 'wei',
        hp: 3,
        skills: ['renxin', 'chengxiang']
    },
    guohuai: {
        name: '郭淮',
        intro: '魏国名将，夏侯渊战死时郭淮收集残兵，与杜袭共推张郃为主将而得以稳定局势。曹丕称帝后，赐郭淮爵关内侯，又任镇西长史。诸葛亮伐魏时，郭淮料敌准确，多立战功，而后亦曾击退姜维。',
        subpack: '三',
        gender: 'male',
        faction: 'wei',
        hp: 4,
        skills: ['jingce']
    },
    manchong: {
        name: '满庞',
        intro: '初在曹操手下任许县县令，掌管司法，以执法严格著称；转任汝南太守，开始参与军事，曾参与赤壁之战。后关羽围攻樊城，满宠协助曹仁守城，劝阻了弃城而逃的计划，成功坚持到援军到来。曹丕在位期间，满宠驻扎在新野，负责荆州侧的对吴作战。曹叡在位期间，满宠转任到扬州，接替曹休负责东侧对吴作战，屡有功劳。',
        subpack: '三',
        gender: 'male',
        faction: 'wei',
        hp: 3,
        skills: ['junxing', 'yuce']
    },
    guanping: {
        name: '关平',
        intro: '关平是关羽在战乱中所收之义子。关羽脱离曹军后，与刘备于关定家中重逢，关定欲使年仅十八岁的关平随关羽同行，刘备便主张让关羽与关平结为义父子。自此后关平随侍在关羽身边，一生东征西讨。他武勇过人，不逊乃父，曾跟随刘备出征西川，立下战功，后来又与曹魏猛将庞德大战三十回合，不分胜负。',
        subpack: '三',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['longyin']
    },
    jianyong: {
        name: '简雍',
        intro: '简雍为刘备同乡，年少时与刘备相识。黄巾之乱时，刘备加入对抗黄巾军的战争，简雍便跟随他奔走。常作为谈客，往来使命，刘备围成都时简雍作为刘备使臣成功劝说刘璋投降。简雍擅于辩论、议事。性情简单直接、不拘小节。',
        subpack: '三',
        gender: 'male',
        faction: 'shu',
        hp: 3,
        skills: ['qiaoshui', 'zongshi_jy']
    },
    liufeng: {
        name: '刘封',
        intro: '刘备义子。性格刚猛，气力过人。随赵云、张飞等扫荡西川，颇有战功，而后又统领孟达攻取上庸，深为刘备信任。但是后来关羽北伐曹魏，多次要求刘封起兵相助，刘封不从。而后又侵凌孟达，迫其降魏。孟达与魏徐晃共袭刘封，并劝刘封投降，刘封不降，又遭部下叛变，败归成都。刘备在诸葛亮的建议下赐死刘封，刘封自裁，刘备深表痛惜。',
        subpack: '三',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['xiansi']
    },
    panzhangmazhong: {
        name: '潘璋马忠',
        intro: '马忠为潘璋部将。于麦城之战中设伏擒获关羽及关平。刘备伐吴时，马忠随潘璋等往拒，突袭射伤蜀将黄忠，导致黄忠阵亡。不久，潘璋为关兴所杀，马忠领兵围击，击退张苞援军。后降将糜、傅发动兵变，刺杀了马忠，将首级献于刘备。',
        subpack: '三',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['anjian', 'duodao']
    },
    yufan: {
        name: '虞翻',
        intro: '翻初在会稽被太守王朗任命为功曹，曾劝谏王朗躲开孙策未果。后孙策占江东仍任命他为功曹。吕蒙袭取荆州时，虞翻提醒其躲过了埋伏，成功占领城池。后因为直言进谏被孙权发配到交州。',
        subpack: '三',
        gender: 'male',
        faction: 'wu',
        hp: 3,
        skills: ['zhiyan', 'zongxuan']
    },
    zhuran: {
        name: '朱然',
        intro: '吴国著名将领，吕蒙白衣渡江取荆州，朱然协助潘璋捉住了关羽。黄武元年，刘备兵伐东吴，朱然与孙桓抵抗刘备大军。后又参加夷陵之战，追击刘备，被前来接应的赵云一枪刺死。',
        subpack: '三',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['danshou']
    },
    fuhuanghou: {
        name: '伏皇后',
        intro: '执金吾伏完之女，汉献帝的皇后，后因怨恨曹操诛董承，与父伏完密谋曹操，事情泄漏，曹将伏皇后禁闭冷宫逼其自缢，所生二位皇子亦被鸩杀。',
        subpack: '三',
        gender: 'female',
        faction: 'qun',
        hp: 3,
        skills: ['zhuikong', 'qiuyuan']
    },
    liru: {
        name: '李儒',
        intro: '董卓的首席谋士，为董卓所亲信，大小事宜皆与其商议。董卓趁乱进京、说降吕布、废立皇帝、迁都长安等举动，均离不开李儒的参谋之功，并奉命毒杀皇帝刘辩。李傕被曹操击败后，李儒从此不知所踪，消失在历史长河中。',
        subpack: '三',
        gender: 'male',
        faction: 'qun',
        hp: 3,
        skills: ['juece', 'mieji', 'fencheng']
    },

    caozhen: {
        name: '曹真',
        intro: '曹操族子，官至大将军、大司马。其父为曹操招募人马时被州郡所杀，曹操因怜悯曹真少年丧父而待其如亲子一般，因赞赏曹真的勇猛而让他率领虎豹骑。曹真在镇守曹魏西北边境时表现突出，魏文帝时期督众将大破羌胡联军，平定河西；魏明帝时期屡次对抗诸葛亮的北伐。',
        subpack: '四',
        gender: 'male',
        faction: 'wei',
        hp: 4,
        skills: ['sidi']
    },
    hanhaoshihuan: {
        name: '韩浩史涣',
        intro: '韩浩和史涣都以忠勇著称，两人皆是曹操心腹将领，共同掌管禁兵。',
        subpack: '四',
        gender: 'male',
        faction: 'wei',
        hp: 4,
        skills: ['shenduan', 'yonglve']
    },
    chenqun: {
        name: '陈群',
        intro: '陈群一直位居要职，先后受曹操、曹丕托孤，成为魏国重臣，官至司空。其子陈泰，亦是魏国后期名将。最大的贡献为创立了九品中正制，为后期的人才选拔和管理打好了基础。',
        subpack: '四',
        gender: 'male',
        faction: 'wei',
        hp: 3,
        skills: ['pindi', 'faen']
    },
    wuyi: {
        name: '吴懿',
        intro: '初为益州牧刘璋的部将，刘备进攻益州时，泠苞在雒城大败，吴懿自告奋勇，领兵前往救援。不料被赵云和张飞生擒，吴懿于是归降。刘备自称汉中王，迎娶吴懿之妹。诸葛亮出师北伐，吴懿以左将军、高阳侯的身份跟随出征，屡立战功。诸葛亮逝世后，吴懿随姜维一并镇守汉中。',
        subpack: '四',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['benxi']
    },
    zhangsong: {
        name: '张松',
        intro: '刘璋的部下，长相丑陋但有过目不忘的本领。张松奉命出使许都被曹操赶出，归蜀时为刘备所厚待，于是将西川地理图献予刘备，劝刘备取益州，愿为内应，并派好友孟达、法正帮助刘备。',
        subpack: '四',
        gender: 'male',
        faction: 'shu',
        hp: 3,
        skills: ['qiangzhi', 'xiantu']
    },
    zhoucang: {
        name: '周仓',
        intro: '原为张宝部将。关羽千里走单骑时，周仓投降关羽，成为了关羽的贴身护卫。建安十六年（公元211年），刘备攻打成都时，周仓跟随关羽镇守荆州。关羽水淹七军时，周仓曾生擒魏军的立义将军庞德，关羽被孙权斩首之后，周仓在麦城大哭失声，拔剑自刎而死。',
        subpack: '四',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['zhongyong']
    },
    sunluban: {
        name: '孙鲁班',
        intro: '孙权之女。孙鲁班与孙权二子孙和不睦。孙权长子孙登死后，孙和被立为太子。孙鲁班向孙权进谗言废孙和太子之位，孙和被废后忧愤而死。',
        subpack: '四',
        gender: 'female',
        faction: 'wu',
        hp: 3,
        skills: ['zenhui', 'jiaojin']
    },
    zhuhuan: {
        name: '朱桓',
        intro: '字休穆，吴郡吴县（今江苏苏州）人，吴国名将，官至前将军、青州牧，假节，封为嘉兴侯。有一子朱异。',
        subpack: '四',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['fenli', 'pingkou']
    },
    guyong: {
        name: '顾雍',
        intro: '为蔡邕之徒。其为人少言语，不饮酒，严厉正大，被张纮推荐仕于孙权。孙权任命他为会稽郡丞，行太守事，后不断升迁，官至吴国丞相。顾雍为官，多进良言，有功于吴。',
        subpack: '四',
        gender: 'male',
        faction: 'wu',
        hp: 3,
        skills: ['shenxing', 'bingyi']
    },
    caifuren: {
        name: '蔡夫人',
        intro: '原是刘表的小妾，正室死后，成为了刘表的后妻。因刘琮娶了自己的侄女所以对其偏爱有加。刘备客居荆州时险些受其所害。刘表死后为了让刘琮即位不惜献州于曹操。',
        subpack: '四',
        gender: 'female',
        faction: 'qun',
        hp: 3,
        skills: ['qieting', 'xianzhou']
    },
    jushou: {
        name: '沮授',
        intro: '袁绍帐下谋士。史载他“少有大志，擅于谋略”。曾为冀州别驾，举茂才，并当过两次县令。后来又当韩馥别驾，被韩馥表为骑都尉。袁绍占据冀州后任用沮授为从事。经常对袁绍提出良策，但很多时候袁绍并不听从。官渡之战时袁绍大败，沮授未及逃走，被曹操所获，因拒降被曹操处死。',
        subpack: '四',
        gender: 'male',
        faction: 'qun',
        hp: 3,
        skills: ['jianying', 'shibei']
    },

    caorui: {
        name: '曹叡',
        intro: '魏文帝曹丕长子，曹魏第二位皇帝。在位期间指挥曹真、司马懿等人成功防御了吴、蜀的多次攻伐，并且平定鲜卑，攻灭公孙渊，颇有建树。',
        subpack: '五',
        gender: 'male',
        faction: 'wei',
        hp: 3,
        skills: ['huituo', 'mingjian', 'xingshuai']
    },
    caoxiu: {
        name: '曹休',
        intro: '曹操族子，曹操大宴铜雀台之时，射箭夺袍。曹休随曹操四处征伐，在攻蜀汉中之战，伐吴濡须口之战均有登场，曾放冷箭射倒凌统的马匹，后又协助夏侯惇平息洛阳纵火叛乱，总管御林兵马，协助曹丕代汉。',
        subpack: '五',
        gender: 'male',
        faction: 'wei',
        hp: 4,
        skills: ['qianju', 'qingxi']
    },
    zhongyao: {
        name: '钟繇',
        intro: '初为长安郡守，马超反叛时，引军攻打长安，钟繇率军防卫。后城破，钟繇从东门弃城而走，退守潼关。后奉献帝令繇草拟诏令，册立曹操为魏王，曹操以钟繇为相国。明帝即位时，钟繇为太傅。诸葛亮北伐，钟繇举荐司马懿前往抵御。',
        subpack: '五',
        gender: 'male',
        faction: 'wei',
        hp: 3,
        skills: ['huomo', 'zuoding']
    },
    liuchen: {
        name: '刘谌',
        intro: '刘禅第五子，自幼聪明，英敏过人。魏军兵临城下时，刘禅准备投降，刘谌劝阻刘禅投降不成后悲愤不已，遂自杀于昭烈庙。',
        subpack: '五',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['zhanjue', 'qinwang']
    },
    xiahoushi: {
        name: '夏侯氏',
        intro: '夏侯渊从女，夏侯霸从妹，出城拾柴时被张飞所得，取其为妻。后生有二女，其中一人为星彩。',
        subpack: '五',
        gender: 'female',
        faction: 'shu',
        hp: 3,
        skills: ['qiaoshi', 'yanyu']
    },
    zhangyi: {
        name: '张嶷',
        intro: '曾随诸葛亮南征孟获，七擒孟获的战斗中立下赫赫战功，与祝融夫人单挑。诸葛亮病死五丈原，告诉姜维张嶷忠贞勇猛，经验丰富，是可以依靠的武将，后于征伐魏国时为掩护姜维撤退阵亡。',
        subpack: '五',
        gender: 'male',
        faction: 'shu',
        hp: 4,
        skills: ['wurong', 'shizhi']
    },
    sunxiu: {
        name: '孙休',
        intro: '孙权第六子，孙綝发动政变罢黜孙亮后，迎立孙休为帝。后孙綝专权，孙休遣使丁奉等人将其诛杀。孙休在位期间，颁布良制，嘉惠百姓，促进了东吴的繁荣。',
        subpack: '五',
        gender: 'male',
        faction: 'wu',
        hp: 3,
        skills: ['yanzhu', 'xingxue', 'zhaofu']
    },
    zhuzhi: {
        name: '朱治',
        intro: '孙坚旧将，朱然嗣父，孙坚阵亡后，孙策附袁术，朱治、吕范为之定计，用玉玺向袁术借兵夺取江东。孙策平定东路后，任命朱治为吴郡太守，收军返回江东。后来赤壁之战，大都督周瑜令朱治、吕范为四方巡警使，催督六郡官军。',
        subpack: '五',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['anguo']
    },
    quancong: {
        name: '全琮',
        intro: '吴国名将，孙策进兵江东时归顺之，深得孙权赏识，孙权甚至将孙鲁班许配之。',
        subpack: '五',
        gender: 'male',
        faction: 'wu',
        hp: 4,
        skills: ['yaoming']
    },
    gongsunyuan: {
        name: '公孙瓒',
        intro: '辽东太守公孙度之孙，辽东割据首领。趁魏、吴骚乱之际自称燕王，发动叛乱，与魏对抗。败给司马懿率领的讨伐大军，被围困后乞降不被接受，与子修在欲出城逃跑时被斩杀。',
        subpack: '五',
        gender: 'male',
        faction: 'qun',
        hp: 4,
        skills: ['huaiyi']
    },
    guotupangji: {
        name: '郭图逢纪',
        intro: '两人均是袁绍帐下谋士。曾联手献计，利用公孙瓒攻击韩馥，又劝说韩馥请袁绍抵挡公孙瓒，终替袁绍拿下冀州。官渡之战期间，两人进谗逼反张郃高览，逼死田丰。使得袁绍的实力大损。',
        subpack: '五',
        gender: 'male',
        faction: 'qun',
        hp: 3,
        skills: ['jigong', 'shifei']
    }
} as HeroDict;