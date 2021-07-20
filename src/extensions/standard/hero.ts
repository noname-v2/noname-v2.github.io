import type { HeroCollection } from '../sgs/sgs';

export const hero = <HeroCollection>{
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
};