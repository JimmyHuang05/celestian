import assignments from '../public/mapplus/city-territory-assignments.json' with {type:'json'}
import {countryDescriptions} from './mapplus-country-descriptions.js'
import {brittoniaCities,brittoniaScenes} from './brittonia-cities.js'
import {countryGovernments} from './map-country-governments.js'
// Existing cultural prototypes retained; missing rulers and local religious
// traditions are authored additions documented in docs/mapplus-culture-update.md.
export const countryCulture={
 '圣特尔莫前哨':{capital:'圣特尔莫堡',seatLabel:'前哨驻地',government:'王室直属军事驻地',leaderLabel:'营务长',monarch:'莱昂·德·萨里亚',population:'约 2,400 人',hideRulingParty:true},
 '特雷尔芬城邦':{capital:'特雷尔芬港',government:'海湾议会共治',leaderLabel:'议会首席',monarch:'莱乌·特雷芬',population:'约 3.8 万人',hideRulingParty:true},
 '卡卢夫诸港同盟':{councilSeat:'卡卢夫港',government:'诸港协商同盟',leaderLabel:'轮值召集人',monarch:'阿鲁梅·卡因',population:'约 5.6 万人',hideRulingParty:true},
 '吕尼扬科诸社':{councilSeat:'吕尼扬科集镇',government:'河谷村社联合议事',leaderLabel:'议事机构',monarch:'诸社代表会',population:'约 12.4 万人',hideRulingParty:true},
 '阿切莱群岛联盟':{councilSeat:'塔韦莱港（临时）',government:'岛社联合议会',leaderLabel:'议会召集人',monarch:'阿雅莱·韦拉',population:'约 7.2 万人',hideRulingParty:true},
 '绍雷克协约':{councilSeat:'绍雷克冬营（冬季）',government:'冬营代表协约',leaderLabel:'议事机构',monarch:'冬营代表会',population:'约 1.9 万人',hideRulingParty:true},
 '沃龙佐边疆区':{capital:'斯韦特洛加万',rulerTitle:'总督',monarch:'米哈伊尔·安德烈耶维奇·沃龙佐夫',population:'约 2 万人',ethnicity:'沃龙佐人（边疆驻民）'},
 '克莱曼尼殖民地':{capital:'克莱曼尼',rulerTitle:'总督',monarch:'阿瑟·威廉·哈德威克',population:'约 15 万人',territory:'约 2,440,000 平方公里',ethnicity:'克莱曼尼人（拓殖民）',rulingParty:'圣塔洛斯皇家特许公司'},
 '北英普顿殖民地':{capital:'北英普顿',rulerTitle:'总督',monarch:'爱德华·亨利·阿什克罗夫特',population:'约 46 万人',territory:'约 5,480,000 平方公里',ethnicity:'英普顿人（拓殖民）',rulingParty:'皇帝陛下的帝国拓殖公司'},
 '普罗维登提亚联合拓殖区':{capital:'纳尔逊要塞',rulerTitle:'总督',monarch:'霍雷肖·埃德蒙·纳尔逊',population:'约 3 万人',ethnicity:'普罗维登提亚人',rulingParty:'普罗维登提亚联合管理委员会'},
 '锡里亚共和国':{capital:'萨洛纳',rulerTitle:'元老院首执政',monarch:'洛伦佐·法列罗',population:'约 360 万人',territory:'约 68,000 平方公里',ethnicity:'锡里亚人',rulingParty:'协和进步会'},
 '锡里亚国':{capital:'纳罗纳',rulerTitle:'护国公',monarch:'莱昂纳多·瓦莱里乌斯',population:'约 280 万人',territory:'约 77,000 平方公里',ethnicity:'锡里亚人',rulingParty:'锡里亚复兴党'},
 '伊斯法尔崇高国':{capital:'塞利米耶',rulerTitle:'沙阿',monarch:'阿尔达希尔四世·米赫兰',population:'约 8,200 万人',territory:'约 3,850,000 平方公里',ethnicity:'伊斯法尔人',rulingParty:'内廷会议'},
 '香佩安自由市':{capital:'香佩安市',rulerTitle:'监督专员',monarch:'马尔科·切莱斯蒂尼',ethnicity:'香佩安人'},
 '奥兰尼亚帝国':{population:'约 8,900 万人',territory:'约 6,300,000 平方公里',rulingParty:'王党'},
 '布列托尼亚公国':{capital:'南特里亚',rulerTitle:'大公',monarch:'阿兰六世·德·蒙福尔',population:'约 4,800 万人',territory:'约 3,200,000 平方公里',ethnicity:'阿尔莫里卡人'},
 '奥克塔尼亚公国':{capital:'图卢兹城',rulerTitle:'大公',monarch:'雷蒙七世·德·图卢兹',population:'约 2,400 万人',territory:'约 1,150,000 平方公里',ethnicity:'奥克塔尼亚人'},
 '萨瓦尔迪亚公国':{capital:'尚贝里亚',rulerTitle:'大公',monarch:'维托里奥·阿梅迪奥二世·德·萨瓦尔迪亚',population:'约 420 万人',territory:'约 480,000 平方公里',ethnicity:'萨瓦尔迪亚人'},
 '瓦莱西亚同盟':{capital:'卢塞纳',rulerTitle:'国家元首',monarch:'联邦执政委员会',population:'约 1,650 万人',territory:'约 850,000 平方公里',ethnicity:'多民族（瓦莱西亚人、琥珀人、伊斯塔维拉人等）'},
 '法罗斯城邦':{capital:'法罗斯港',rulerTitle:'海军执政',monarch:'尼阿库斯·纳瓦尔霍斯',population:'约 85 万人',territory:'约 22,000 平方公里',ethnicity:'法罗斯人'},
 '提洛斯城邦':{capital:'提洛斯城',rulerTitle:'大议长',monarch:'客里诺·阿波罗尼奥斯',population:'约 210 万人',territory:'约 65,000 平方公里',ethnicity:'提洛斯人'},
 '伊奥尼亚':{capital:'阿尔戈斯',rulerTitle:'执政官',monarch:'佩里克里斯·科德洛斯',population:'约 1,450 万人',territory:'约 580,000 平方公里',ethnicity:'伊奥尼亚人'},
 '提尔塞尼亚':{capital:'塔克维尼亚',rulerTitle:'终身独裁官',monarch:'阿鲁恩斯·韦尔图姆纳',ethnicity:'提尔塞尼亚人',rulingParty:'国家复兴党'},
 '神圣的霍亨泰因帝国':{capital:'克罗恩堡',rulerTitle:'皇帝',monarch:'威廉三世·冯·霍亨泰因',ethnicity:'霍亨泰因人',rulingParty:'国家社会党',ideology:'法尔肯里德主义'},
 '维洛戈里亚帝国':{capital:'利莫加德',rulerTitle:'沙皇',monarch:'阿列克谢·伊万诺维奇',ethnicity:'维洛戈里亚人',rulingParty:'全维洛戈里亚统一党'},
 '东方帝国':{capital:'大都',rulerTitle:'大汗',monarch:'蒙哥·铁木尔',ethnicity:'东方人'},
 '伊斯塔维拉王国':{monarch:'费尔南多四世·德·瓦尔卡萨',ethnicity:'伊斯塔维拉人',religion:'潮汐教会',rulingParty:'王党'},
 '琥珀王国':{monarch:'洛伦佐三世·迪·贝拉蒙特',ethnicity:'琥珀人',religion:'无',rulingParty:'无党派'},
 '琥珀共和国':{rulerTitle:'第一执政官',monarch:'维托里奥·贝兰迪',ethnicity:'琥珀人',religion:'无',rulingParty:'共和联盟'},
 '海岸邦联':{rulerTitle:'邦联议长',monarch:'杜阿尔特·德·阿泽维多',ethnicity:'科斯塔人',religion:'香料与黄金之神',rulingParty:'最高邦联会议'},
 '罗兰骑士团国':{rulerTitle:'大团长',monarch:'阿尔芒·德·沃克莱尔',ethnicity:'无',religion:'天命颁主 万军之尊'},
 '赫尔铎王国':{capital:'诸湾港',monarch:'哈康·维尔加德',ethnicity:'赫尔铎人',religion:'无'},
 '希斯伯尼亚':{capital:'查士赫里忒',rulerTitle:'首席执政官',monarch:'尼基塔斯·阿尔吉罗斯',ethnicity:'希斯伯尼亚人',religion:'无',rulingParty:'元老院与公民大会'},
}
const renames={
 '8699f08b-1495-439f-8831-b4cebc367eb1':{type:'基地'},
 '4a2a2ff9-7933-4975-9ed3-5276a101aa12':{title:'灰岛港',foreign_title:'Puerto Ceniza'},
 '1011a439-d51e-42e2-aa6d-7dde0438aaf6':{title:'弗洛伦萨港',foreign_title:'Florença do Mar'},
 '9a155ccf-9317-4a3b-9138-d77ba8cab01d':{title:'维吉亚湾',foreign_title:'Baía da Vigia'},
 '7e7e47dd-e6aa-49c5-9db0-7041e4c92f5b':{title:'国王港',foreign_title:'Porto Real'},
 '08b480d7-bc21-48e4-8902-5f3cac21534e':{title:'恩塞阿达',foreign_title:'Enseada'},
}
const replacements=[['费伦扎·马里纳','弗洛伦萨港'],['Fiorenza Marina','Florença do Mar'],['托雷瓜迪亚湾','维吉亚湾'],['Torreguardia Bay','Baía da Vigia'],['国王城','国王港'],['Regalport','Porto Real'],['恩塞纳达','恩塞阿达'],['Ensenada','Enseada'],['Porto Cenere','Puerto Ceniza']]
const brittoniaNames=Object.values(brittoniaCities).flatMap(c=>[[c.old,c.title],[c.oldForeign,c.foreign_title]])
export function cultureText(text){return typeof text==='string'?[...replacements,...brittoniaNames].reduce((s,[a,b])=>s.replaceAll(a,b),text).replaceAll('Bahía de Enseada','Baía da Enseada').replaceAll('昂格莱德联合拓殖区','普罗维登提亚联合拓殖区'):text}
export function culturalCity(row){
 const next={...row,...renames[row.id],...assignments[row.id]}
 if(assignments[row.id])next.group_id=assignments[row.id].country
 for(const key of ['title','foreign_title','description','alt'])next[key]=cultureText(next[key])
 if(row.id==='b9a47c72-1169-468e-8b28-079af7598304')next.description=next.description?.replace('帝国统治时期兴建的旧自治领首府，现为独立维斯廷的行政中心','奥兰尼亚帝国维斯廷地区的行政中心，由帝国统治时期的旧自治领首府发展而来')
 if(row.id==='59beda17-6397-4e39-9201-dc5545fcad96'&&/Catmere|卡特/.test(next.description))next.description='维斯廷湖畔的宁静小镇，本土语名称意为“猫湖”。湖边牧场、石砌屋舍与小集市沿旧渡口展开，居民仍沿用本地语言与乡间习俗。'
 if(row.id==='bf6645f2-df6e-494e-962c-0c82fa20faf5')next.description='坐落于独立岛屿上的商业自由市，由本地商人寡头在专员监督下主持市政。东方运来的胡椒、肉桂与丁香在此卸货交易，再经仓栈与商船销往大陆各地。'
 if(row.id==='4a2a2ff9-7933-4975-9ed3-5276a101aa12')next.description=next.description?.replace('灰岛上唯一的城市','伊斯塔维拉王国灰岛上的港城')
 if(row.id==='08b480d7-bc21-48e4-8902-5f3cac21534e')next.description=next.description?.replace(/^南部海湾北岸的港湾城市/,'海岸邦联南部海湾北岸的港湾城市')
 if(row.id==='08b480d7-bc21-48e4-8902-5f3cac21534e')next.description=next.description?.replace(/^东部海湾沿岸的港城/,'海岸邦联东部海湾沿岸的港城')
 if(row.id==='620e2693-629f-4f03-8c39-3f485111de9d')next.description=next.description?.replace(/^东北半岛的沿海城市/,'海岸邦联东北半岛的沿海城市')
 const city=brittoniaCities[row.id]
 if(city){const {old,oldForeign,...details}=city;Object.assign(next,details,{country:'布列托尼亚公国',countryId:'custom-armorica',group_id:'布列托尼亚公国'})}
 if(brittoniaScenes[row.image])Object.assign(next,brittoniaScenes[row.image])
 return next
}
export function countryCultureProfile(row){
 if(row.title==='罗德里亚开拓区'||row.group_id==='罗德里亚开拓区')row={...row,title:row.title==='罗德里亚开拓区'?'沃龙佐边疆区':row.title,...(row.group_id==='罗德里亚开拓区'?{group_id:'沃龙佐边疆区'}:{})}
 const culture=countryCulture[row.group_id||row.title]
 const government=countryGovernments[row.group_id||row.title]
 const result=culture||government?{...row,countryOverview:{...row.countryOverview,...culture,...(government?{government}:{})}}:row
 if(countryDescriptions[row.group_id||row.title])result.description=countryDescriptions[row.group_id||row.title]
 if((row.group_id||row.title)==='提尔塞尼亚')result.foreign_title='RES PUBLICA TYRSENIA'
 if((row.group_id||row.title)==='维洛戈里亚帝国')result.foreign_title='Велогорийская империя'
 if((row.group_id||row.title)==='沃龙佐边疆区')result.foreign_title='Voronzo Krai'
 if((row.group_id||row.title)==='克莱曼尼殖民地')result.foreign_title='Clemeny Colony'
 if((row.group_id||row.title)==='北英普顿殖民地')result.foreign_title='North Ingleton Colony'
 if((row.group_id||row.title)==='普罗维登提亚联合拓殖区')result.foreign_title='Providentia Joint Colonization Zone'
 if((row.group_id||row.title)==='锡里亚共和国')result.foreign_title='REPUBBLICA DI SIRIA'
 if((row.group_id||row.title)==='锡里亚国')result.foreign_title='STATO DI SIRIA'
 if((row.group_id||row.title)==='伊斯法尔崇高国')result.foreign_title='Dowlat-e Aliyye-ye Isfar'
 if((row.group_id||row.title)==='神圣的霍亨泰因帝国')result.foreign_title='Heiliges Kaiserreich Hohentein'
 if((row.group_id||row.title)==='香佩安自由市')result.foreign_title='Città Libera di Ciampiana'
 if((row.group_id||row.title)==='伊奥尼亚')result.foreign_title='RES PUBLICA IONIA'
 if((row.group_id||row.title)==='提洛斯城邦')result.foreign_title='CIVITAS DELOS'
 if((row.group_id||row.title)==='法罗斯城邦')result.foreign_title='CIVITAS PHAROS'
 if((row.group_id||row.title)==='瓦莱西亚同盟')result.foreign_title='CONFOEDERATIO VALESIA'
 if((row.group_id||row.title)==='奥克塔尼亚公国')result.foreign_title='Ducatus Occitaniae'
 if((row.group_id||row.title)==='萨瓦尔迪亚公国')result.foreign_title='Ducatus Savaldiae'
 if((row.group_id||row.title)==='布列托尼亚公国')result.foreign_title='DUCATUS UNITUS ARMORICAE'
 if((row.group_id||row.title)==='希斯伯尼亚'){
  result.foreign_title||='Res Publica Hispernia'
  result.description||='以查士赫里忒为首都的半岛共和国，由元老院与公民大会共同维系政务。河港、沿海城镇与内陆农庄通过圣约体系相连，保留各城的议事传统；首席执政官负责执行元老院决议与统筹对外事务。'
 }
 if(Number.isFinite(row.landAreaKm2))result.countryOverview={...result.countryOverview,territory:row.landAreaKm2>0?(row.landAreaKm2<50000?'不足 100,000 平方公里':`约 ${(Math.round(row.landAreaKm2/100000)*100000).toLocaleString('en-US')} 平方公里`):null}
 if(result.title==='神圣的霍亨泰因帝国')result.title='霍亨泰因帝国'
 return result
}
