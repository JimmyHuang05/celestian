import {culturalCity} from './mapplus-culture.js'
// Preserve IDs and saved placements; overrides apply only to the new world.
const changes = {
  "748481bf-6ae1-479d-8691-492b5c4325a0": {"title":"卡斯泰尔韦尔德","foreign_title":"Castelverde","description":"琥珀共和国西南山麓的商路城市，古堡与集市扼守通向狭长半岛的道路。牲畜、木材与山地物产在此交易，客栈和修车作坊为往来车队提供补给。"},
  "a16382a1-e854-44bf-aaf8-b78e8994fdd1": {"title":"梅里迪亚诺港","foreign_title":"Porto Meridiano","description":"琥珀共和国南岸的主要港口，山地商路在此与沿海航线相接。船坞与仓栈沿港湾展开，石材、葡萄酒及内陆工坊的制品由此装船运往各地。"},
  "bf6645f2-df6e-494e-962c-0c82fa20faf5": {"title":"香佩安市","foreign_title":"Ciampiana","description":"全大陆的香料集散地，由贸易寡头控制的自由市。港口码头昼夜不息，来自东方的胡椒、肉桂、丁香在此卸货，再分装运往大陆各地。"},
  "103f053f-c8e0-4c9c-b0de-74f9dbbe1eba": {"title":"新琥珀城","foreign_title":"Nuova Ambra","description":"琥珀共和国的首都，共和国建立后新建的都城，坐落于琥珀半岛北端。"},
  "efac2214-0768-44e0-8ed0-be09290a2924": {"title":"贝拉港","foreign_title":"Puerto de la Vela","description":"伊斯塔维拉王国的离岛港城，汇集岛间商路与南方远洋航线。白灰墙面的街巷从港湾伸向旧城，船坞、缝帆工坊与仓栈沿岸相连。船东与货商在海商公署登记契约、处理海损，候风的商船则在此补充淡水、粮食与索具，是王国通往南方海域的重要中转港。"},
  "e7d937af-b0b7-4e5d-a8e9-1b39fe253ca4": {"title":"丽瓦绮澜","foreign_title":"Riva Chiara","description":"坐落于水晶池西北岸的湖滨城市，远处高山的积雪映入澄澈湖面。石砌街巷沿岸铺展，曾是琥珀半岛著名的避暑胜地与山地商路驿站。"},
  "7e0a1010-3203-4eb7-b177-44784149ebd3": {"title":"蓬泰科尔沃","foreign_title":"Pontecorvo","description":"琥珀王国东部的陆路商贸重镇，连接王城、水晶池周边与共和国方向的道路。谷物、酒品和琥珀制品在此集散，旧城商馆与车马行共同支撑着两国间的日常贸易。"},
  "7bcb69b8-4091-45d3-8209-89e7adfa4fbb": {"title":"马里纳比安卡","foreign_title":"Marina Bianca","description":"又名“白色海滨”——白色石砌建筑沿港湾铺展，灯塔矗立在岬角顶端，是琥珀王国最繁华的港口。"},
  "f44be4da-3fa9-476c-8919-a67be8acab40": {"title":"宏伟的琥珀城","foreign_title":"Magnifica Città di Ambra","description":"琥珀王国的首都，坐落于琥珀半岛南端，依山而建，俯瞰琥珀湾。城堡始建于中世纪，后经数次扩建，如今是王宫、议会与最高法院所在地。"},
  "redmesa": {"title":"雷德梅萨","foreign_title":"Redmesa","description":"阿尔卡特大陆西南半岛的内陆商贸城市，坐落于山前河谷与干旱台地交界处。居民引河水灌溉田地，经营牲畜交易、矿料转运与商队补给；城外赭红色的风蚀岩群，是穿越台地的旅人辨认道路的地标。"},
  "b97014ed-a6ed-4e3b-a251-305b862ddb1a": {"title":"珊瑚城","foreign_title":"The Coral City","description":"以近海广袤的珊瑚礁群得名。温暖清澈的海水孕育了丰富的渔业与珍珠养殖业，也为城市吸引来络绎不绝的商船。"},
  "c698b169-25a5-425d-9056-73c27b454637": {"title":"布拉德茅斯","foreign_title":"Bloodmouth","description":"奥兰尼亚在阿尔卡特大陆建立的第一座港口城市，坐落于红河入海口。河水携带流域内红色岩层风化形成的泥沙，丰水期呈赭红色，殖民者遂以“血河口”命名。"},
  "6afda075-530e-44b2-85ac-83000a863d75": {"title":"威廉明娜港","foreign_title":"Port Wilhelmina","description":"美丽安静的小城镇，毗邻威廉明娜国家公园。主要发展船舶维修、物资补给、燃料加注与生态旅游业。水清浪平，是过往船只喜爱的停靠点。"},
  "7bc03ea0-98a2-4506-bfcc-2b49358d175f": {"title":"纳尔逊要塞","foreign_title":"Fort Nelson","description":"昂格莱德联合拓殖区的总部，坐落于登陆点附近的海岸岬角，一座规模宏大的永备要塞。"},
  "5cd3778e-8fb6-4cc1-83c4-751f1377b700": {"title":"灰铅镇","foreign_title":"Greylead","description":"昂格莱德联合拓殖区的矿业基地，坐落于内陆铅锌矿脉之上。矿井深入岩层，绞车日夜不停。冬季地表封冻，粗选后的矿石经雪橇转运，其余时节由货车运往昂格莱德要塞装船。"},
  "4493f1d0-aba0-468c-825d-1dc5395daadb": {"title":"东方要塞","foreign_title":"Eastern Fortress","description":"昂格莱德联合拓殖区正在兴建中的第二要塞——规划中的城区规模远超鸢尾花东方要塞，未来将成为殖民地的行政中心与最大军事堡垒。"},
  "8699f08b-1495-439f-8831-b4cebc367eb1": {"title":"断口","foreign_title":"The Breach","description":"昂格莱德联合拓殖区的矿业基地，坐落于庞大山脉唯一的天然断口处——所有的内陆勘探任务都从这里出发。"},
  "6e4ee387-8692-41a2-82d3-cc236b83bbf6": {"title":"贝尔维克","foreign_title":"Bellwick","description":"北英普顿殖民地北岸的城市，由拓殖公司的货栈与定居者集市发展而来。海外运来的咖啡、周边农庄的烟草与内陆矿产在此收储，沿岸商船将其运往北英普顿，修船作坊与小商行沿街分布。"},
  "f726a0cd-a03f-4312-80b8-1507bc55e445": {"title":"布莱肯菲尔德","foreign_title":"Brackenfield","description":"殖民地南部河谷的农业城市，周围分布着谷物农场、牧场与新垦田地。磨坊、制革作坊和农具商铺围绕中心广场聚集，农产经商道送往附近的哈伯里港。"},
  "cfa7b0bf-df0e-4712-8191-aaa28f1d09f0": {"title":"埃尔姆斯福德","foreign_title":"Elmsford","description":"北英普顿殖民地南部河湾的城市，围绕渡口与农产集市逐渐扩建。周边农庄的谷物、烟草在此分拣装运，河岸仓栈、车马行和农具工坊为内陆聚落提供物资。"},
  "dc91c53a-ee44-480b-a364-77f0c02ccb76": {"title":"阿什伯恩","foreign_title":"Ashbourne","description":"殖民地西岸的城市，由伐木营地和沿海聚落逐渐发展而来。锯木厂、皮货商行与木工坊构成当地的主要产业，山地物产经此整理后运往北部城镇。"},
  "5c3e9b15-bdb4-4098-b0fa-2c3e9e1ac18d": {"title":"北英普顿","foreign_title":"North Ingleton","description":"奥兰尼亚帝国位于新大陆的殖民地之一，扼守着沟通两大洋的咽喉海峡，温和的气候滋养了广阔农场，大量谷物与牲畜经此出口。"},
  "7e6276b4-f77e-4567-b88c-e3420f199a20": {"title":"普雷斯科特","foreign_title":"Prescott","description":"殖民地东岸的沿海城市，由商船补给站与定居者集市发展而来。居民经营渔业、仓储和近岸运输，来自内陆的皮货与木材在此换装，再送往各地港口。"},
  "a6c045de-47cf-45f1-988c-747d909ae2d2": {"title":"哈伯里港","foreign_title":"Port Harbury","description":"克莱曼尼殖民地南岸的主要港城，承担南部腹地与大陆之间的海运贸易。木材、矿石与农产在此装船外运，船坞、海关和大型仓栈沿海湾分布，是殖民地南部通向远洋的门户。"},
  "3798570c-7149-483a-8108-491e32cd2fde": {"title":"雷德里奇","foreign_title":"Redridge","description":"殖民地中部山地东麓的矿业城市，因邻近山岭露出的赤色岩层得名。铁矿开采、选矿与金属修造是当地的主要行业，城中集市为周边矿场和山地聚落提供补给。"},
  "78bc0179-4867-4e15-a26f-b3540fa7ea30": {"title":"克莱曼尼","foreign_title":"Clemeny","description":"克莱曼尼殖民地的首府，殖民政府与驻军司令部所在地。行政机关、商馆和铁路站场构成城市的核心，统筹各地政务、贸易与军需运输，是奥兰尼亚在新大陆的重要统治中心。"},
  "c84009eb-5ab3-47a1-b705-36007e5284f6": {"title":"沃德福德","foreign_title":"Wardford","description":"克莱曼尼殖民地连接南北腹地的重要河谷城市，桥梁与陆路将北部要塞、沿海港口和南方聚落联系起来。货栈、车马行与加工工坊围绕渡桥聚集，承担木材、矿石及农产的集散转运。"},
  "dadf554e-3e62-412e-a9ed-dec200087081": {"title":"伟大要塞","foreign_title":"Grand Fortress","description":"大陆同盟在新大陆的军事中枢。层层叠叠的防御工事从港口一直延伸至山顶，炮台、城墙、堡垒交错密布。"},
  "89ca7333-70d7-4caa-a568-fd349f4e51a6": {"title":"米尔福德","foreign_title":"Milford","description":"位于铁桥与克莱曼尼之间的河谷城市，由渡口、磨坊与铁路补给站发展而来。货栈、修造工坊和车马行沿交通干道聚集，为往来列车、商队及两地驻军提供物资，是边境运输线上的中途集散地。"},
  "db1db209-df35-46bc-8ecd-e025edec32b6": {"title":"铁桥","foreign_title":"Ironbridge","description":"没有铁路，就没有铁桥——而铁路一旦中断，克莱曼尼便是一座孤城。"},
  "af0b27ab-9657-4b39-aeee-723828961e15": {"title":"滨海艾恩德","type":"主要城市","foreign_title":"Ende-on-Sea","description":"新大陆最北端的港口城市，维多利亚洲际航线的终点。这里是毛皮、矿石与鲸油的集散地，也是拓荒者与逃亡者的最后落脚处。文明到此为止，再往前只有冰与沉默……"},
  "01363b55-210c-45ca-9930-a9d484ab190c": {"title":"莱恩山下阿尔希斯","foreign_title":"Altheas under Mount Layne","description":"钢铁与蒸汽在此交响，烟尘与灯火共染长空。帝国第一艘蒸汽动力的战列舰从这里启航，龙骨滑下船台的瞬间，宣告了一个旧时代的结束。如今，船坞中仍在建造更大的巨舰，烟囱日夜不熄。"},
  "59beda17-6397-4e39-9201-dc5545fcad96": {"title":"朗卡兹","foreign_title":"Lenn ar C'hazh","description":"帝国北部的宁静小镇，以古时定居于此的领主“卡特”（Catt）命名。后语音演变，缩写为“Catmere”，被后人附会为“猫湖”。"},
  "4b26ee75-5c25-41b1-901f-6fb1aa45f774": {"title":"法威","foreign_title":"Faoued","description":"南部港口小城，以远洋渔业闻名。当地人常年深入外海，捕捞金枪鱼与鳕鱼，码头上渔获堆积如山，腌制桶与冰窖沿街排开。"},
  "3c6ecd13-5249-4151-b30f-ee530d92752a": {"title":"凯吕埃尔","foreign_title":"Kêrvreizh","description":"坐落于中部山麓与东部平地交界的古老城镇，旧聚落占据谷口高地，周边分布着石墙围合的牧场与农庄。牲畜交易、制革和谷物加工延续至今，货车由此往返首府与东岸港口。"},
  "6d17cec7-cafe-4681-a8db-82aa51897014": {"title":"卡斯泰尔莫尔","foreign_title":"Kastell-Meur","description":"维斯廷岛北端的沿海古城，石砌街屋围绕山丘古堡层层展开。居民经营近海渔业、养羊与毛织作坊，仍以本土语言传唱航海歌谣；岬角灯塔为绕行北岸的船只指引航向。"},
  "40e1e903-4e76-4900-b085-9ccb46c2dfe7": {"title":"朗桥","foreign_title":"Pont-an-Traoñ","description":"位于岛屿中西部山地通道的商路古城，以谷地古桥得名。客栈、车马行和修造作坊围绕桥头与旧驿站聚集，延续着为山地商队提供补给的传统，本土语言仍是集市间通行的乡音。"},
  "6083f58d-0e44-4273-88f1-2d8c37287353": {"title":"卡斯泰尔苏","foreign_title":"Kastell-Su","description":"环绕南部旧堡发展起来的古城，扼守维斯廷岛南端的商路。如今是帝国与伊斯塔维拉王国最大的贸易口岸，本地商会仍沿用旧有行规；战时则成为自治领南部防线的关键节点。"},
  "8bb987d3-a81f-4421-b643-8789b6e89308": {"title":"凯尔布拉德","foreign_title":"Kerbrad","description":"维斯廷岛西南部的农业古城，田地、树篱与牧场围绕低矮的石砌街区展开。城中的粮仓、磨坊和牲畜市场供应南部城镇，是西岸乡村与卡斯泰尔苏之间的重要集散地；收获季的集市与乡间歌舞延续着本土传统。"},
  "efc5d772-469b-45d9-a3c5-c75da17cb8bf": {"title":"卡恩港","foreign_title":"Porzh Karn","description":"维斯廷岛西北岸的古老港城，承担北部地区的物资集散与船舶补给。本地船主与商人行会长期经营鱼市、船坞和沿岸仓栈，渔获、羊毛与石材经此外运，是自治领西部的商贸中心。"},
  "6c22d09f-0f89-4ee2-9cc5-b38105e6d620": {"title":"波尔扎韦尔","foreign_title":"Porz-Avel","description":"维斯廷岛东岸的古老港城，连接自治领腹地与大陆沿海航线。归入帝国后，沿湾船厂与货运码头不断扩建，旧港街区仍保留本土语言和造船行会传统，如今是首府以南主要的航运与工业中心。"},
  "b9a47c72-1169-468e-8b28-079af7598304": {"title":"波尔兹维斯廷","foreign_title":"Porzh Vestin","description":"帝国征服维斯廷后兴建的自治领首府，深水港旁的街区与公共建筑沿袭奥兰尼亚本土风格。这里是帝国唯一安全、规模化利用以太能的城市，也是超凡魔药研究的核心基地，维斯廷大学的相关专业在全大陆首屈一指。"},
  "6328ca3b-7a04-4fc1-8739-9d108181716a": {"title":"巴恩盖特","foreign_title":"Barngate","description":"古代建于莱恩山脉缺口处的关隘，扼守东西商道咽喉，今为帝国边境重要的陆上口岸。"},
  "4819c8a9-2d11-4ff4-b159-184b65a41bc3": {"title":"皇后十字镇","foreign_title":"Queenscross","description":"半岛南部的铁路枢纽，命名者选择以“皇后”为名，以此表达对王室的效忠。"},
  "500ded46-81be-45ac-bad9-8110796269a5": {"title":"白石浦","foreign_title":"Camas Sgeil","description":"因盛产优质大理石而得名，采石与石材贸易兴盛。帝国众多宫殿与教堂的白石，皆由此地运出。"},
  "3a1da717-9ff4-44f8-953a-0093d122ba15": {"title":"格伦娜拉","foreign_title":"Glennara","description":"奥兰尼亚北部半岛山城，面朝大海，背倚苍崖。无河有山，风静潮平。一座让心安静下来的地方。"},
  "df2eda6a-6d6e-462a-bdc1-574d4016530b": {"title":"北港","foreign_title":"Norhaven","description":"暖流经此，主港区通常不形成连续海冰——作为帝国北方的重要门户，此处承担着渔业、矿石运输与极地探险补给的重任。"},
  "45a92564-abc9-46fb-bc0f-8c3ebdff4ec4": {"title":"奈恩堡","foreign_title":"Nairnburgh","description":"北境的首府，也是这片寒冷土地上最大的城市。坐落于靠山的海湾深处，山脊如巨臂环抱，挡住了北方的冷风与暴雪。城中气候较北境腹地温和许多，暖流支流带来的温暖海水使主港区通常不封冻，商船四季可至。"},
  "c62378af-5787-43b8-9493-517733c28cb5": {"title":"贝尔卡里克","foreign_title":"Béal Carraige","description":"南部海边入海口，威姆逊河的终点。河水在此汇入大海，咸淡水交汇处滋养出丰饶的渔场。"},
  "d34908f7-1b21-4bba-86a2-af582ed470a1": {"title":"因弗利亚姆","foreign_title":"Inbhear Liam","description":"南部平原最大的城市，坐落于威姆逊河畔。河流在此宽阔平缓，码头连绵数里，谷物、木材与纺织品在此集散，运往帝国各地。"},
  "d0008af0-1052-42c7-bbd0-689870a68844": {"title":"蒂尔安沙卡","foreign_title":"Tír an Seaca","description":"霜地的王冠领地，也是这片广袤峡湾中唯一称得上大城市的地方。"},
  "1865cbcf-f568-4af3-934f-4737805748a4": {"title":"阿达拉","foreign_title":"Ath Dara","description":"群山间的河谷小城，牧场沿水铺展，林木覆着两侧山坡。山中的原木在此锯解，谷地的羊毛织成厚呢。河岸传来锯木声，街巷深处，是织机绵长的回响。"},
  "9526656c-c8bb-4440-bd00-d86d75bbbd98": {"title":"邓利亚","foreign_title":"Dunlia","description":"北方半岛西侧的临海小城，背靠牧地，面朝开阔的海湾。岸上织就的厚毛衣，随渔船一道出海；归港的鱼货，则在盐桶与熏炉间留下北海的滋味。"},
  "acabe2a2-1a3f-4f1b-9a98-8aee4799181f": {"title":"库恩芬","foreign_title":"Coonfin","description":"面向北方航道的港城，渔船在此卸下满舱鱼货，往来的商船在此修补船身、等候顺风。腌鱼的仓房沿岸排开，船坞中锤声不歇。岬角外帆影渐远，港内又点起了灯。"},
  "bda4eae3-738b-4172-b4a4-063c7c539031": {"title":"塞利米耶","foreign_title":"Selimiye","description":"东方帝国的首都，奥兰尼亚大使在日记中如此描述：“城垣广阔，宫阙如林。商肆林立，丝绸如山。皇宫金瓦，不可直视。大汗之宴，百兽千侍。繁华富庶，远胜翡兰珀。”"},
  "ef28730c-9d5e-497f-abc5-14590095d024": {"title":"蓬塔多拉达","foreign_title":"Ponta Dourada","description":"南部岛屿东端的沿海城市，朝向远洋航路。居民以渔业、盐渍加工和沿岸贸易为生，市街上的小商行与旅舍为往来船员提供补给。"},
  "76134cb7-2fba-4d3d-a3e3-8b65d9495152": {"title":"波托文托港","foreign_title":"Porto Vento","description":"海岸邦联南部的重要港口城市。海风终年不息，是邦联舰队常用的停靠与补给站。商船往来频繁，渔获与本地葡萄酒经此运往邦联各地。"},
  "b49b675c-e541-4cd2-ad78-e78837a6d881": {"title":"阿克罗克雷姆","foreign_title":"Akrokrem"},
  "fcbfaf26-80b9-49ea-8e3e-01c94ac0e840": {"title":"白崖观测站","foreign_title":"Whitecliff Observatory","description":"坐落于昂格莱德大陆东海岸的白色崖壁，专门用于监测代号已知为最大水中泰坦的“A-3”。"},
  "8ebf1616-5d90-4d06-9b42-a02015c3201c": {"title":"鹰巢","foreign_title":"Eagle's Nest","description":"坐落于峡湾一侧的孤立山顶。陆行泰坦“C-1”在此定居，皇室在约六百年前与它建立了友好的合作关系。"},
  "bf4b6f15-f9c8-4025-a569-3184a37ce225": {"title":"长弓手走廊","foreign_title":"Longbow Corridor","description":"坐落于两座山脊之间的狭长谷地。这里是陆行泰坦“C-2”的活动区域，帝国与它的友好关系已持续了数个世纪。"},
  "4a2a2ff9-7933-4975-9ed3-5276a101aa12": {"title":"灰岛港","foreign_title":"Porto Cenere","description":"灰岛上唯一的城市，鸢尾花航线上臭名昭著的走私之都。环火山区的以太解质从采晶人转移到走私商人手中，再伪装成合法货物运往大陆……这里是冒险家的乐园，也是法律的尽头。"},
  "95ef26f2-a817-48c4-9674-755140daa1b6": {"title":"洛雷迪亚","foreign_title":"Loredia","description":"伊斯塔维拉王国的首都，也是整个滨海国家集团的政治核心与决策中枢。所有关乎海岸命运的重大条约与法令皆在此签署。"},
  "7ac9b8ed-d23c-4c13-9b29-1e88e47a7a27": {"title":"莱万特港","foreign_title":"Puerto de Levante","description":"王国东岸的重要远洋港口，面向奥术之海的商路。船厂、海关与大型仓栈沿港区分布，承担东方货物的转运，也是王国商船队维修与补给的主要基地之一。"},
  "da965837-bd17-4ccd-8dc3-1793151a78e5": {"title":"里贝拉德尔马","foreign_title":"Ribera del Mar","description":"首都海湾西岸的城市，以近岸运输、渔获加工和小型修船作坊为业。沿湾街市承接首都的日常采买，清晨的鱼市与渡船码头总是最先热闹起来。"},
  "8a054f3a-a96d-44db-a2b3-3601e66a02d9": {"title":"布鲁马港","foreign_title":"Puerto Bruma","description":"王国西北海岸的重要港城，扼守北方沿岸航路。渔船与商船在湾内汇集，盐渍鱼货、羊毛和矿石由此外运，船坞与仓栈构成城市最繁忙的街区。"},
  "8aad1273-45f4-4861-87a2-fb23654ed391": {"title":"托雷维恩托","foreign_title":"Torreviento","description":"王国北端的丘陵城市，以古老的瞭望塔和沿坡展开的石砌街巷闻名。周边牧场出产羊毛与乳酪，城中的织坊和皮革作坊为北方村镇供应日用品。"},
  "799443a0-70f3-46ba-a66e-024f81b31fd6": {"title":"佩尼亚尔瓦","foreign_title":"Peñalba","description":"位于北部山地东麓的城市，浅色石材砌成的街屋沿山坡层叠。采石、陶器与山地果园支撑着当地生计，城中集市是附近山村交换物产的场所。"},
  "55ae6fc1-4435-4cf5-9212-35a7b19751ce": {"title":"瓦尔德奥利瓦","foreign_title":"Valdeoliva","description":"连接北部山地与中部平原的商贸重镇，往来车队在此换马、补给和交易。橄榄油、羊毛与金属制品汇入城中市场，商会经营的仓栈沿主要道路绵延。"},
  "5043d548-ff12-482c-a189-bf5b0c7fc7fe": {"title":"蒙特塞达","foreign_title":"Monteceda","description":"西部山麓的商路驿城，连接沿海平地与内陆山道。木材、石料和山地蜂蜜在此交易，老驿站周围逐渐形成了工坊、客栈与热闹的牲畜市场。"},
  "1e493599-ffcc-4818-bedd-ead7e60d0291": {"title":"贝尔蒙特","foreign_title":"Belmonte","description":"西南山地与半岛平原之间的城市，石砌老城俯瞰通往海湾的道路。牧业、皮革加工与车马贸易历史悠久，每年的牲畜集市吸引周边各地商贩前来。"},
  "10b74477-1644-448b-9d3f-ab7608b1a598": {"title":"阿尔科马尔","foreign_title":"Arcomar","description":"中央海湾南岸的城市，老城区以连续的石拱廊和遮阴庭院著称。居民经营渔业、陶器与沿岸运输，海边集市供应邻近城镇所需的鱼货和生活器具。"},
  "b0cb3b88-1cf0-46c2-950b-d96a87ed09bd": {"title":"丰特克拉拉","foreign_title":"Fuente Clara","description":"南部半岛腹地的城市，因旧城广场上的清泉得名。周围农庄种植谷物、果树与葡萄，泉渠灌溉着城郊菜园，定期市集为半岛村镇提供物资。"},
  "60644f54-2e0a-4d2f-af67-562993aaf4ae": {"title":"奥利瓦雷斯","foreign_title":"Olivares","description":"南部平原的农业城市，以橄榄园、葡萄园和家庭酿酒坊闻名。收获季节，周边庄园的货车汇入城中，榨油坊与酒窖成为当地最繁忙的地方。"},
  "9d3ee418-e8d0-46de-b138-19fd96e7e0c4": {"title":"坎波韦拉","foreign_title":"Campovera","description":"王国西部的陆上贸易中心，连接海岸邦联方向的商道与王国内陆腹地。粮食、牲畜和纺织品在此集散，货栈、车马行与兑换商馆围绕古老的交易广场聚集。"},
  "462698fe-de50-4036-af8d-69a06457d0de": {"title":"圣特尔莫","foreign_title":"San Telmo","description":"东南岛屿的主要港城与行政中心，承担奥术之海航线的中途补给。商船在此添水、修缮和交换货物，航海学校与领航人公会使城市享有悠久的航海声誉。"},
  "08b480d7-bc21-48e4-8902-5f3cac21534e": {"title":"恩塞纳达","foreign_title":"Ensenada","description":"南部海湾北岸的港湾城市，平静水面为渔船和沿岸商船提供泊地。制绳、帆布和木工作坊沿码头分布，周边农庄的粮食与酒品也经此装船外运。"},
  "620e2693-629f-4f03-8c39-3f485111de9d": {"title":"塞雷诺岬","foreign_title":"Cabo Sereno","description":"东北半岛的沿海城市，依靠渔业、果园与近岸贸易发展。岬角上的灯塔指引船只驶入邻近海湾，临海广场定期举办鱼市与乡村集会。"},
  "345424fe-ccf8-4a88-ba43-efb9f6c2e9bd": {"title":"欧佩里亚","foreign_title":"Operia","description":"海岸邦联的首都，俄提斯洋与深渊之海间最大的远洋贸易停靠点。商船在此补给、交易、换船，航线如血管般交汇于此。"},
  "1011a439-d51e-42e2-aa6d-7dde0438aaf6": {"title":"费伦扎·马里纳","foreign_title":"Fiorenza Marina","description":"十字群岛与大陆之间的最大中转枢纽。整座城市依湾而建，码头连绵数里，旅馆、仓库、兑换行鳞次栉比。"},
  "9a155ccf-9317-4a3b-9138-d77ba8cab01d": {"title":"托雷瓜迪亚湾","foreign_title":"Torreguardia Bay","description":"位于国王港北部，隔海峡相望，是十字群岛北部的重要深水港湾。天然地势形成避风锚地，常年有邦联巡逻舰队驻泊，兼顾商船中转与海域警戒任务。"},
  "7e7e47dd-e6aa-49c5-9db0-7041e4c92f5b": {"title":"国王城","foreign_title":"Regalport","description":"海岸邦联位于十字群岛的军事重镇，也是圣塔洛斯航线上最繁忙的港口，为邦联西部最大的贸易与航运中心。"},
  "f85afa2e-99d2-4079-8b89-4363c27c4d55": {"title":"维拉塞雷纳","foreign_title":"Vila Serena","description":"岛屿东北部的集市城市，白墙瓦顶的街屋围绕广场铺展。周边庄园的葡萄酒、橄榄油与谷物在此汇集，定期举办的市集连接着岛内村镇。"},
  "143ed27a-5931-4fad-814e-c8f2fd73eb12": {"title":"蒙特克拉罗","foreign_title":"Monte Claro","description":"坐落于岛屿西南山麓的城市，石砌街巷沿缓坡延伸。居民经营果园、采石与木工作坊，山地物产经此转运至沿海港镇。"},
  "86c9a7e0-5e38-484e-9a6c-000f68f73f6d": {"title":"瓦莱韦尔德","foreign_title":"Vale Verde","description":"南部岛屿西段的农业与商贸城市，腹地分布着牧场、果园和谷物农庄。城中的仓栈与周市服务周边聚落，奶酪、皮革与酿酒是当地传统产业。"},
  "7d7c7fe2-7b8d-4cbc-a2dc-389b2318ced6": {"title":"奥罗拉港","foreign_title":"Porto da Aurora","description":"海岸邦联大陆北岸的重要港城，连接十字群岛航路与内陆商道。沿湾分布的船厂、仓栈和交易行使其成为粮食、木材与纺织品的集散中心，旧城高处的灯塔是归航船只熟悉的地标。"},
  "68c804c1-7b4a-48ed-9e9c-ff87802561f9": {"title":"维拉弗兰卡","foreign_title":"Vila Franca","description":"连接海岸邦联与伊斯塔维拉王国的重要陆上贸易城市，内陆商道与通往欧佩里亚的道路在此交汇。城内关税署、货栈与商馆林立，两国的谷物、羊毛、葡萄酒和制成品经此集散，是邦联通向王国内陆的商贸门户。"},

}
const independentVestin = new Set([
  '6083f58d-0e44-4273-88f1-2d8c37287353', 'b9a47c72-1169-468e-8b28-079af7598304',
  '59beda17-6397-4e39-9201-dc5545fcad96', '4b26ee75-5c25-41b1-901f-6fb1aa45f774',
  '6d17cec7-cafe-4681-a8db-82aa51897014', 'efc5d772-469b-45d9-a3c5-c75da17cb8bf',
  '6c22d09f-0f89-4ee2-9cc5-b38105e6d620', '3c6ecd13-5249-4151-b30f-ee530d92752a',
  '8bb987d3-a81f-4421-b643-8789b6e89308',
])
export function newWorldMarker(row) {
  const result = { ...row, ...changes[row.id], description: changes[row.id]?.description ?? row.description }
  if (!independentVestin.has(row.id)) return culturalCity(result)
  // User-authored boundary revision: independence changes sovereignty, not
  // the settlement's identity, position, language or imperial-era history.
  result.country = '维斯廷'; result.group_id = '维斯廷'
  result.description = result.description
    .replace('帝国与伊斯塔维拉王国最大的贸易口岸', '维斯廷与伊斯塔维拉王国之间的重要贸易口岸')
    .replace('自治领南部防线', '维斯廷南部防线')
    .replace('帝国北部的宁静小镇', '维斯廷的宁静小镇')
    .replace('自治领腹地', '维斯廷腹地').replace('自治领西部', '维斯廷西部')
  if (row.id === 'b9a47c72-1169-468e-8b28-079af7598304') {
    result.description = result.description
      .replace('帝国征服维斯廷后兴建的自治领首府', '帝国统治时期兴建的旧自治领首府，现为独立维斯廷的行政中心')
      .replace('这里是帝国唯一安全、规模化利用以太能的城市', '这里以安全、规模化利用以太能著称')
  }
  return culturalCity(result)
}
