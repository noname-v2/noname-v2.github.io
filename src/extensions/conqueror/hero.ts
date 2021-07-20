import type { HeroCollection } from '../sgs/sgs';

export const hero = <HeroCollection>{
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
        skills: ['meteror.xunxun', 'meteror.wangxi']
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
        skills: ['standard.mashu', 'qianxi']
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
        skills: ['qice', 'zhiyu']
    }
};