import type { SGS } from '../sgs/types';
import { skill } from './skill';

export default {
    heropack: '星火燎原',
    skill,
    lib: {
        keyword: {
            '转换技': ['武将发动转换技以后，该技能会切换至另一形态；转换技一共有两个形态，再次发动该技能以后则会切换至初始技能形态。', 'brown']
        }
    },
    hero: {
        caoang:{
            name:'曹昂',
            intro:'字子修，曹操的长子，由于性情谦和且聪慧所以深得曹操喜爱。曹操征讨张绣时，羞辱张绣之婶邹氏，被张绣突然袭击。曹昂为保护曹操撤退，与典韦一起战死在宛城。',
            subpack:'天府',
            gender: 'male',
            faction:'wei',
            hp:4,
            skills:['kangkai']
        },
        zhugedan:{
            name:'诸葛诞',
            intro:'字公休，曹魏后期的重要将领，诸葛亮的族弟。曾与司马师一同平定毌丘俭、文钦的叛乱。之后因与被诛的夏侯玄、邓飏交厚，且见到王淩、毌丘俭等人的覆灭而心不自安，于甘露二年起兵，并得到东吴的支援，但于次年被镇压，被大将军司马胡奋所斩。',
            subpack:'天府',
            gender: 'male',
            faction:'wei',
            hp:4,
            skills:['gongao', 'juyi']
        },
        wuxian:{
            name:'吴苋',
            intro:'穆皇后吴氏，陈留（今河南开封）人，车骑将军吴懿之妹，三国时期蜀汉昭烈帝刘备的皇后。吴氏早年丧父，其父生前与刘焉交情深厚，所以全家跟随刘焉来到蜀地。后刘焉听相面者说吴氏有大贵之相，于是为儿子刘瑁迎娶吴氏。刘瑁死后，吴氏成为寡妇。建安十九年（214年），刘备平定益州，纳吴氏为夫人。建安二十四年（219年），刘备自称汉中王，立吴氏为汉中王后。章武元年（221年），刘备称帝，建立蜀汉，立吴氏为皇后。章武三年（223年），刘备去世，太子刘禅即位，尊嫡母吴氏为皇太后。延熙八年（245年），吴氏去世，谥号穆皇后，葬入刘备的惠陵。',
            subpack:'天府',
            gender: 'female',
            faction:'shu',
            hp:3,
            skills:['fumian', 'daiyan']
        },
        zhangxingcai:{
            name:'张星彩',
            intro:'蜀名将张飞与夏侯氏所生之女，刘禅的妻子，史上称为“敬哀皇后”。',
            subpack:'天府',
            gender: 'female',
            faction:'shu',
            hp:3,
            skills:['shenxian', 'qiangwu']
        },
        buzhi:{
            name:'步骘',
            intro:'吴重臣，最初避难江东，于孙权统事后，被召为主记。后游历吴地，又任海盐县长，还任东曹掾，出领鄱阳太守。建安十五年，转交州刺史、立武中郎将，率军接管往交州，追拜使持节、征南中郎将。次年，以平定交州功，加平戎将军，封广信侯。后迁右将军、左护军，改封临湘侯。孙权称帝后，拜骠骑将军，领冀州牧，后因冀州分与蜀汉而解牧职。又都督西陵。赤乌九年，代陆逊为丞相。',
            subpack:'天府',
            gender: 'male',
            faction:'wu',
            hp:3,
            skills:['hongde', 'dingpan']
        },
        sundeng:{
            name:'孙登',
            intro:'字子高，孙权长子。孙权称帝后其被立为太子，受诸葛恪等人辅佐。其人性情温和而能礼贤下士，加之爱民如子，因此深受爱戴。曾劝服孙权在孙虑之死时节哀，并劝谏孙权勿用吕壹苛政。后不幸早逝，临终前上书建言，推荐了多位良臣。其亡故令孙权极为悲伤，也为南鲁党争的祸乱埋下了伏笔。',
            subpack:'天府',
            gender: 'male',
            faction:'wu',
            hp:4,
            skills:['kuangbi']
        },
        caojie:{
            name:'曹节',
            intro:'沛国谯县（今安徽亳州）人，汉献帝刘协第二任皇后，魏武帝曹操的女儿。建安十八年（213年），曹操将女儿曹宪、曹节、曹华三姐妹同时入宫中，封为夫人。建安十九年（214年），并封为贵人。曹操废掉汉献帝第一位皇后伏寿，将她囚禁而死。曹操要汉献帝立曹节为皇后，汉献帝只得依从。建安二十五年（220年），曹操去世，曹丕袭封魏王位。曹丕授意华歆去逼汉献帝让位。曹节怒斥华歆，华歆只好退出宫去。第二天又逼汉献帝将帝位禅让给曹丕。并以武力威胁，向曹节索要玺印，曹节无奈，将玺印掷于栏板之下。面对曹丕篡位，她极为愤怒，高喊：“老天有眼，决不让你长久！”汉献帝被废为山阳公，曹节为山阳公夫人。景元元年（260年），曹节病逝，仍以汉朝礼仪合葬于献帝的禅陵，谥号献穆皇后。',
            subpack:'天府',
            gender: 'female',
            faction:'qun',
            hp:3,
            skills:['shouxi', 'huimin']
        },
        liuxie:{
            name:'刘协',
            intro:'字伯和，又字合。祖籍沛县，生于洛阳。汉灵帝第三子，被董卓迎立为帝。董卓被王允和吕布诛杀后，董卓部将李傕等攻入长安，再次挟持了他，后来逃出长安。公元196年，曹操控制了刘协，并迁都许昌，“挟天子以令诸侯”。公元220年，曹操病死，刘协被曹丕控制，随后被迫禅让于曹丕。',
            subpack:'天府',
            gender: 'male',
            faction:'qun',
            hp:3,
            skills:['tianming', 'mizhao']
        },
        duji:{
            name:'杜畿',
            intro:'字伯侯，京兆杜陵（今陕西西安东南）人。东汉末及三国时曹魏官吏及将领。西汉御史大夫杜延年的后代。历官郡功曹、守郑县令，善于断案。荀彧将他举荐给曹操，曹操任命他为司空司直，调任护羌校尉，使持节领西平太守。 曹丕受禅登基后，封杜畿为丰乐亭侯。官至尚书仆射。后在陶河试航时遇上大风沉没，杜畿淹死，死时六十二岁，曹丕为之涕泣，追赠其为太仆，谥戴侯。',
            subpack:'天梁',
            gender: 'male',
            faction:'wei',
            hp:3,
            skills:['andong', 'yingshi']
        },
        lidian:{
            name:'李典',
            intro:'字曼成，曹操麾下将领。李典深明大义，不与人争功，崇尚学习与高贵儒雅，尊重博学之士，在军中被称为长者。李典有长者之风，官至破虏将军，三十六岁去世。魏文帝曹丕继位后追谥号为愍侯。',
            subpack:'天梁',
            gender: 'male',
            faction:'wei',
            hp:3,
            skills:['xunxun', 'wangxi']
        },
        simalang:{
            name:'司马朗',
            intro:'字伯达，“司马八达”之一。曹操任司空后，司马朗被辟为司空属官，又历任成皋令、堂阳长、元城令、丞相主簿、兖州刺史等职，所在皆有政绩，深受百姓爱戴。后司马朗与夏侯惇、臧霸等征讨吴国，到达居巢。军队中流行瘟疫，司马朗亲自去视察，派送医药，因此染病去世。',
            subpack:'天梁',
            gender: 'male',
            faction:'wei',
            hp:3,
            skills:['junbing', 'quji']
        },
        dongyun:{
            name:'董允',
            intro:'大汉重臣，掌军中郎将董和之子。东汉末年，其父董和事刘璋为益州太守，刘备立太子时，允被选为洗马，后为黄门侍郎，延熙六年（公元243年）加辅国将军，延熙七年（公元244年）以侍中守尚书令，任大将军费祎的副手。',
            subpack:'天梁',
            gender: 'male',
            faction:'shu',
            hp:3,
            skills:['bingzheng', 'sheyan']
        },
        yanjun:{
            name:'严畯',
            intro:'字曼才，彭城（治今江苏徐州）人，三国时期孙吴官员、学者。性情忠厚，待人以诚。少好学，精通《诗》、《书》、《三礼》，又好《说文》。避乱江东，与诸葛瑾、步骘是好朋友，被张昭推荐给孙权作骑都尉、从事中郎。建安二十二年（217年），横江将军鲁肃去世，孙权打算让严畯接替其位。严畯很有自知之明，知道自己没有能力对抗在荆州的关羽和北面的曹魏，便坚决不接受此任命。后来担任尚书令。严畯享年七十八岁。著有《孝经传》、《潮水论》。',
            subpack:'天梁',
            gender: 'male',
            faction:'wu',
            hp:3,
            skills:['guanchao', 'xunxian']
        },
        zhugejin:{
            name:'诸葛谨',
            intro:'字子瑜，吴国大臣，诸葛亮之兄，诸葛恪之父。经鲁肃推荐，为东吴效力。胸怀宽广，温厚诚信，得到孙权的深深信赖，努力缓和蜀汉与东吴的关系。建安二十五年（220年）吕蒙病逝，诸葛瑾代吕蒙领南郡太守，驻守公安。孙权称帝后，诸葛瑾官至大将军，领豫州牧。',
            subpack:'天梁',
            gender: 'male',
            faction:'wu',
            hp:3,
            skills:['huanshi', 'hongyuan', 'mingzhe']
        },
        liuyan:{
            name:'刘焉',
            intro:'字君郎（《华阳国志》又作君朗）。江夏郡竟陵县（今湖北省天门市）人。东汉末年宗室、军阀，汉末群雄之一，西汉鲁恭王刘余之后。刘焉初以汉朝宗室身份，拜为中郎，历任雒阳令、冀州刺史、南阳太守、宗正、太常等官。因益州刺史郄俭在益州大肆聚敛，贪婪成风，加上当时天下大乱。刘焉欲取得一安身立命之所，割据一方，于是向朝廷求为益州牧，封阳城侯，前往益州整饬吏治。郄俭为黄巾军所杀，刘焉进入益州，派张鲁盘踞汉中，张鲁截断交通，斩杀汉使，从此益州与中央道路不通。刘焉进一步对内打击地方豪强，巩固自身势力，益州因而处于半独立的状态。兴平元年（194年），刘焉因背疮迸发而逝世，其子刘璋继领益州牧。',
            subpack:'天梁',
            gender: 'male',
            faction:'qun',
            hp:3,
            skills:['tushe', 'limu']
        },
        zhanglu:{
            name:'张鲁',
            intro:'汉宁太守，继父祖之后传播五斗米教。刘璋杀张鲁之母，二人因此结仇，多次交战。刘备攻益州时，刘璋向张鲁求援。张鲁派马超前往，但马超投降刘备。张鲁后见曹操自封魏王，想要自立为汉宁王，为谋士阎圃劝免。后曹操讨汉中，张鲁败，众人劝其烧粮仓，张鲁认为这是国家之物，未听从，为曹操所称赞。后投降曹操，任镇南将军。',
            subpack:'天梁',
            gender: 'male',
            faction:'qun',
            hp:3,
            skills:['yishe', 'bushi', 'midao']
        },
        guohuanghou:{
            name:'郭皇后',
            intro:'明元郭皇后（并非郭女王），在三国志有正传。曹叡夫人，曹丕的儿媳妇，曹芳，曹髦，曹奂三朝太后，是唯一经历了曹魏全部皇帝时代的贵族女性。曹魏后三帝时期，由于皇帝年少，太后与重臣一同处理政务。史书上对郭皇后有两种截然不同的记载，一种是曹芳被废和曹髦死后郭太后发诏书斥责他们不配人君，另一种却提及曹芳被夺权期间，太后与曹芳相拥而泣，曹髦讨伐司马昭前，曾向太后禀报。',
            subpack:'天机',
            gender: 'female',
            faction:'wei',
            hp:3,
            skills:['jiaozhao', 'danxin']
        },
        xizhicai:{
            name:'戏志才',
            intro:'或志才为字，名不详（一说名忠），东汉颍川郡（今河南禹州）人。经张邈推荐，成为曹操手下谋士。为人多谋略，曹操十分器重，不幸早卒。三国演义中并无此人，三国志中只有寥寥数语。由荀彧推荐给曹操，被称为有“负俗之讥”。死后，荀彧又举荐了郭嘉。陈寿《三国志》记载：太祖与荀彧书曰：自志才亡后，莫可与计事者。汝、颍固多奇士，谁可以继之？彧荐嘉。',
            subpack:'天机',
            gender: 'male',
            faction:'wei',
            hp:3,
            skills:['standard:tiandu', 'xianfu', 'chouce']
        },
        qinmi:{
            name:'秦宓',
            intro:'字子敕。广汉郡绵竹县（今四川德阳北）人。三国蜀汉时大臣、学者。秦宓善舌辩。早年仕于益州牧刘璋麾下，后降刘备。刘备伐吴时，秦宓劝阻，刘备大怒，欲杀秦宓。因诸葛亮及时求情，才保住性命，仅被下狱，后被释放，拜左中郎将、长水校尉。吴蜀同盟后，孙权派张温至成都回访。酒宴之上，秦宓与张温舌战，说得张温无言以对。后官至大司农。建兴四年（226年），秦宓病逝。',
            subpack:'天机',
            gender: 'male',
            faction:'shu',
            hp:3,
            skills:['jianzheng', 'zhuandui', 'tianbian']
        },
        sunqian:{
            name:'孙乾',
            intro:'字公祐。北海郡（治今山东昌乐西）人。东汉末年刘备的幕僚。最初被大儒郑玄推荐于州里。刘备领徐州，以孙乾为从事。自徐州跟随刘备，多次作为刘备的使臣。刘备定益州后，拜孙乾为秉忠将军，其待遇仅次于麋竺，与简雍相同。不久后便病逝。',
            subpack:'天机',
            gender: 'male',
            faction:'shu',
            hp:3,
            skills:['qianya', 'shuimeng']
        },
        panjun:{
            name:'潘濬',
            intro:'字承明。武陵郡汉寿县（今湖南汉寿）人。三国时期吴国重臣，蜀汉大司马蒋琬的表弟。潘濬为人聪察，对问有机理，拜大儒宋忠为师，得到“建安七子”之一的王粲赏识。不到三十，即被荆州牧刘表任命为江夏从事，因按杀贪污的沙羡长而闻名。建安十六年（211年），被刘备任命为荆州治中从事，与守臣关羽不睦。建安二十四年（219年），孙权得荆州，拜潘濬为辅军中郎将。又迁奋威将军，封常迁亭侯。孙权称帝后，拜少府，进封刘阳侯，又改太常。黄龙三年（231年），授假节，与吕岱率军五万平五溪蛮夷叛乱，经三年而斩获数万，使得一方宁静。潘濬为人刚正不阿，在吕壹弄权时，屡请孙权将其诛杀。甚至想亲手击杀吕壹，使吕壹对他非常畏惧。赤乌二年（239年），潘濬去世。',
            subpack:'天机',
            gender: 'male',
            faction:'wu',
            hp:3,
            skills:['guanwei', 'gongqing']
        },
        xuezong:{
            name:'薛综',
            intro:'字敬文，沛郡竹邑（今安徽濉溪）人，三国时期吴国名臣。少时避乱至交州，师从刘熙。士燮归附孙权，召其为五官中郎将，出任合浦、交阯太守。后从征至九真，回朝任谒者仆射。232年，升任尚书仆射。240年，改任选曹尚书。242年，担任太子少傅，兼任选部职任。243年，薛综去世。薛综是当时名儒，著有诗赋难论数万言，集为《私载》，并著有《五宗图述》、《二京解》。',
            subpack:'天机',
            gender: 'male',
            faction:'wu',
            hp:3,
            skills:['funan', 'jiexun']
        },
        caiyong:{
            name:'蔡邕',
            intro:'字伯喈。陈留郡圉县（今河南杞县南）人。东汉时期名臣，文学家、书法家，才女蔡文姬之父。蔡邕早年拒朝廷征召之命，后被征辟为司徒掾属，任河平长、郎中、议郎等职，曾参与续写《东观汉记》及刻印熹平石经。后因罪被流放朔方，几经周折，避难江南十二年。董卓掌权时，强召蔡邕为祭酒。三日之内，历任侍御史、治书侍御史、尚书、侍中、左中郎将等职，封高阳乡侯，世称“蔡中郎”。董卓被诛杀后，蔡邕因在王允座上感叹而被下狱，不久便死于狱中，年六十。',
            subpack:'天机',
            gender: 'male',
            faction:'qun',
            hp:3,
            skills:['bizhuan', 'tongbo']
        },
        wangcan:{
            name:'王粲',
            intro:'字仲宣。山阳郡高平县（今山东微山两城镇）人。东汉末年文学家，“建安七子”之一，太尉王龚曾孙、司空王畅之孙。',
            subpack:'天机',
            gender: 'male',
            faction:'qun',
            hp:3,
            skills:['sanwen', 'qiai', 'denglou']
        },
        weicaiwenji:{
            name:'魏蔡文姬',
            intro:'琰，原字昭姬，晋时避司马昭讳，改字文姬，东汉末年陈留圉（今河南开封杞县）人，东汉大文学家蔡邕的女儿，是中国历史上著名的才女和文学家，精于天文数理，既博学能文，又善诗赋，兼长辩才与音律。代表作有《胡笳十八拍》、《悲愤诗》等。',
            subpack:'天同',
            gender: 'female',
            faction:'wei',
            hp:3,
            skills:['chenqing', 'mozhi']
        },
        weijiangwei:{
            name:'魏姜维',
            intro:'字伯约，天水冀人。三国时期蜀汉著名将领、军事统帅。原为曹魏天水郡的中郎将，后降蜀汉，官至凉州刺史、大将军。诸葛亮去世后继承诸葛亮的遗志，继续率领蜀汉军队北伐曹魏，与曹魏名将陈泰、郭淮、邓艾等多次交手。',
            subpack:'天同',
            gender: 'male',
            faction:'wei',
            hp:4,
            skills:['kunfen', 'fengliang']
        },
        weipangde:{
            name:'魏庞德',
            intro:'字令明，东汉末年雍州南安郡狟道县（今甘肃天水市武山县四门镇）人。曹操部下重要将领。官至立义将军，拜关门亭侯。谥曰壮侯。有一子庞会。',
            subpack:'天同',
            gender: 'male',
            faction:'wei',
            hp:4,
            skills:['standard:mashu', 'juesi']
        },
        shusunshangxiang:{
            name:'蜀孙尚香',
            intro:'孙夫人，乃孙权之妹。刘备定荆州，孙权进妹与其结姻，重固盟好。孙夫人才捷刚猛，有诸兄之风。后人为其立庙，号曰“枭姬庙”。',
            subpack:'天同',
            gender: 'female',
            faction:'shu',
            hp:3,
            skills:['liangzhu', 'fanxiang']
        },
        shuxushu:{
            name:'蜀徐庶',
            intro:'字元直，与司马徽、诸葛亮等人为友。先化名单福仕官于新野的刘备，后因曹操囚禁其母而不得不弃备投操，临行前向刘备推荐诸葛亮之才。入曹营后，一言不发，不曾为曹操进献过一计半策。后人形容徐庶“身在曹营心在汉”。',
            subpack:'天同',
            gender: 'male',
            faction:'shu',
            hp:3,
            skills:['wuyan', 'jujian']
        },
        wupangtong:{
            name:'吴庞统',
            intro:'字士元，襄阳（治今湖北襄阳）人。三国时刘备帐下谋士，官拜军师中郎将。才智与诸葛亮齐名，人称“凤雏”。在进围雒县时，统率众攻城，不幸被流矢击中去世，时年三十六岁。追赐统为关内侯，谥曰靖侯。庞统死后，葬于落凤庞统墓坡。',
            subpack:'天同',
            gender: 'male',
            faction:'wu',
            hp:3,
            skills:['guolun', 'songsang']
        },
        qunhuangyueying:{
            name:'群黄月英',
            intro:'荆州沔南白水人，沔阳名士黄承彦之女，诸葛亮之妻，诸葛瞻之母。容貌甚丑，而有奇才：上通天文，下察地理，韬略近于诸书无所不晓，诸葛亮在南阳闻其贤而迎娶。',
            subpack:'天同',
            gender: 'female',
            faction:'qun',
            hp:3,
            skills:['jiqiao', 'linglong']
        },
        quntaishici:{
            name:'群太史慈',
            intro:'字子义，东莱黄县（今山东龙口东黄城集）人。东汉末年武将，守言应诺，恪遵信义，始终如一，弭息诽论。官至建昌都尉。弓马熟练，箭法精良。原为刘繇部下，后被孙策收降，于赤壁之战前病逝，死时才四十一岁。',
            subpack:'天同',
            gender: 'male',
            faction:'qun',
            hp:4,
            skills:['jixu']
        },
        wenpin:{
            name:'文骋',
            intro:'本为刘表大将，刘表死后，跟随刘琮投降曹操。后曹操令其镇守江夏，多次阻止了关羽和孙权的进攻，为曹操倚为屏障的大将之一。',
            subpack:'天相',
            gender: 'male',
            faction:'wei',
            hp:4,
            skills:['zhenwei']
        },
        liyan:{
            name:'李严',
            intro:'字正方，蜀汉重臣。初为刘表部下，曹操入主荆州时，李严西奔入蜀。刘备入川，李严率众投降，深得刘备器重，受命与诸葛亮、法正等人一同编制《蜀科》，又率军平定了蜀中盗贼。白帝城托孤，与诸葛亮共受遗诏同扶幼主。其人性格矜高难近，终因督粮不利且谎报实情而被流放，后在当地去世。',
            subpack:'天相',
            gender: 'male',
            faction:'shu',
            hp:3,
            skills:['duliang', 'fulin']
        },
        mazhong:{
            name:'马忠',
            intro:'本名狐笃，字德信，巴西阆中人，初次出场时随丞相诸葛亮南征孟获，诸葛亮遣马忠与赵云两路夹攻，大败蛮将阿会喃。孟获派弟孟优赴汉军处假投降，欲内应外合，诸葛亮将计就计，埋伏擒获孟获和诸洞酋长，马忠亦于此战立下战功。后诸葛亮北伐时亦数次出阵，立下汗马功劳。',
            subpack:'天相',
            gender: 'male',
            faction:'shu',
            hp:4,
            skills:['fuman']
        },
        mizhu:{
            name:'糜竺',
            intro:'原为徐州富商，后被徐州牧陶谦辟为别驾从事。陶谦病死后，奉其遗命迎接刘备。与其弟麋芳拒绝曹操的任命而跟随刘备，在刘备最潦倒之时给予刘备很大的帮助，使他重新振作。214年（建安十九年），刘备入主益州后，拜麋竺为安汉将军，地位在诸葛亮之上，为刘备手下众臣之最。吕蒙袭取荆州，麋芳举城投降，导致关羽兵败身亡，麋竺面缚请罪，刘备劝慰麋竺，对他待遇如初。',
            subpack:'天相',
            gender: 'male',
            faction:'shu',
            hp:3,
            skills:['ziyuan', 'jugu']
        },
        zhoufang:{
            name:'周鲂',
            intro:'字子鱼。吴郡阳羡县（今江苏宜兴）人。三国时期吴国将领。周鲂年少时好学，被举为孝廉。历任宁国县长、怀安县长、钱塘侯相，一月之内，便斩杀作乱的彭式及其党羽，因而升任丹阳西部都尉。彭绮率数万人反叛时，周鲂被任命为鄱阳太守，与胡综共同将其生擒，因功加职昭义校尉。后诈降曹休，诱其率军接应，使曹休在石亭之战中一败涂地，战后因功被加职为裨将军，封关内侯。贼帅董嗣凭险骚扰豫章等郡，周鲂派间谍将其诱杀，不费兵卒即安定数郡。周鲂在鄱阳赏罚分明、恩威并施，于任职十三年后去世。',
            subpack:'天相',
            gender: 'male',
            faction:'wu',
            hp:3,
            skills:['youdi', 'duanfa']
        },
        heqi:{
            name:'贺齐',
            intro:'字公苗，会稽山阴（今浙江绍兴）人。早年在平定山越的战争中立有大功，又讨平叛乱无数，身经百战，所向披靡，深受孙权器重。后来在与魏国的多次边境争斗中也屡立战功，官至后将军，并领徐州牧。',
            subpack:'天相',
            gender: 'male',
            faction:'wu',
            hp:4,
            skills:['qizhou', 'shanxi']
        },
        lvdai:{
            name:'吕岱',
            intro:'字定公，广陵海陵（今江苏如皋）人。三国时期吴国重臣、将领。吕岱一生戮力奉公，为孙吴开疆拓土，功勋赫赫。太平元年（256年），吕岱去世，年九十六。',
            subpack:'天相',
            gender: 'male',
            faction:'wu',
            hp:4,
            skills:['qinguo']
        },
        liuyao:{
            name:'刘繇',
            intro:'字正礼。东莱牟平（今山东牟平）人。东汉末年宗室、大臣，汉末群雄之一，齐悼惠王刘肥之后，太尉刘宠之侄。刘繇最初被推举为孝廉，授郎中。任下邑县长时，因拒郡守请托而弃官。后被征辟为司空掾属，除授侍御史，因战乱而不到任，避居淮浦。兴平元年（194年），被任命为扬州刺史。他先后与袁术、孙策交战，一度被朝廷加授为扬州牧、振武将军，但最终还是败归丹徒。此后，刘繇又击破反叛的笮融，旋即病逝，年四十二。',
            subpack:'天相',
            gender: 'male',
            faction:'qun',
            hp:4,
            skills:['kannan']
        },
        lvqian:{
            name:'吕虔',
            intro:'字子恪。任城国（今山东济宁东南）人。汉末至三国曹魏时期将领。吕虔有勇有谋，曹操在兖州时，任命他为从事，率领家丁驻守湖陆。后升任泰山太守，与夏侯渊共同镇压济南等地的黄巾军。被推举为秀才，加任骑都尉，仍管辖泰山郡。曹丕继任魏王后，加吕虔为裨将军，封益寿亭侯。再升任徐州刺史，加任威虏将军。任用王祥为别驾，将民政事务都委托于他，为世人所称赞。曹叡继位后，改封万年亭侯。吕虔死后，其子吕翻世袭万年亭侯。',
            subpack:'七杀',
            gender: 'male',
            faction:'wei',
            hp:4,
            skills:['weilu', 'zengdao']
        },
        guanyinping:{
            name:'关银屏',
            intro:'关羽之女。因在关羽的四个子女中排行第三，故又被称作“关三小姐”、“关氏三姐”或“关羽三小姐”。传说她是赵云的弟子、并随同诸葛亮平定南蛮。',
            subpack:'七杀',
            gender: 'female',
            faction:'shu',
            hp:3,
            skills:['xuehen', 'huxiao', 'wuji']
        },
        mayunlu:{
            name:'马云禄',
            intro:'马腾之女，马超之妹，赵云之妻。父亲令其自幼习武，枪术非凡，寻常男子也是难以匹敌。',
            subpack:'七杀',
            gender: 'female',
            faction:'shu',
            hp:4,
            skills:['standard:mashu', 'fengpo']
        },
        xushi:{
            name:'徐氏',
            intro:'孙权之弟孙翊的妻子，著名烈女。孙翊的部下妫览、戴员买通家将边鸿将孙翊杀死，并将全部罪责推给边鸿，又谋杀了前来查问的太守孙河。徐夫人一面用美人计色诱妫览、戴员，令其放松警惕；一面对孙翊生前亲信孙高、傅婴说明真相并晓以大义，最终成功地在内室中将杀夫凶手妫览、戴员诛杀。',
            subpack:'七杀',
            gender: 'female',
            faction:'wu',
            hp:3,
            skills:['wengua', 'fuzhu']
        },
        zumao:{
            name:'祖茂',
            intro:'字大荣，吴郡富春人，使用双刀。孙坚在汜水关被华雄击败，祖茂为保护主公而主动提出与孙坚交换头盔，孙坚因此得脱。祖茂将孙坚的赤帻挂在柱子上，准备以此引诱华雄，趁机偷袭，却反被华雄所杀。',
            subpack:'七杀',
            gender: 'male',
            faction:'wu',
            hp:4,
            skills:['yinbing', 'juedi']
        },
        gongsunzan:{
            name:'公孙瓒',
            intro:'字伯珪，号“白马义从”。辽西令支人。东汉末年献帝年间占据幽州一带的军阀，汉末群雄之一。出身贵族，因母地位卑贱，只当了郡中小吏。他貌美，声音洪亮，机智善辩。后随卢植于缑氏山中读书，粗通经传。',
            subpack:'七杀',
            gender: 'male',
            faction:'qun',
            hp:4,
            skills:['yicong', 'qiaomeng']
        },
        tadun:{
            name:'蹋顿',
            intro:'东汉末年辽西乌桓（亦称乌丸）的首领，乌桓大人丘力居的从子，总摄三王部。曾出兵协助袁绍，击破公孙瓒。此后受袁绍假传朝廷诏命，与三王难楼、苏仆延、乌延等人同受单于称号及印绶。后难楼、苏仆延率其部众奉立楼班为单于，蹋顿于是退位为王。袁绍死后，收到被曹操击败的袁尚的求助，纠集逃亡至乌桓的幽州、冀州官吏百姓，企图夺回河北。东汉建安十二年，曹操亲征乌桓。八月，乌桓、袁氏部队于柳城白狼山为曹军所败，蹋顿在此战中被曹操的先锋张辽所斩杀。',
            subpack:'七杀',
            gender: 'male',
            faction:'qun',
            hp:4,
            skills:['luanzhan']
        },
        zhangliang:{
            name:'张梁',
            intro:'东汉末年黄巾起义首领之一，张角的三弟。中平元年（184）随兄起义，号称“人公将军”。遭到朝廷所派左中郎将皇甫嵩进攻时，他率军在广宗（今河北威县）进行反击。后因警戒疏忽，遭到汉军夜袭，兵败身亡。',
            subpack:'七杀',
            gender: 'male',
            faction:'qun',
            hp:4,
            skills:['jijun', 'fangtong']
        }
    }
} as SGS;