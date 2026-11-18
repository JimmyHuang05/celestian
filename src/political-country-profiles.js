const legacyIDs=['region_3_1','region_70_1_2','region_3_2_2','region_3_2_1_2','region_70_2_2','region_138']
export async function countryProfiles(countries,signal){
 const response=await fetch('/map/world-240705-base-v2/legacy-region-metadata.json',{signal})
 if(!response.ok)throw Error('国家资料暂时无法加载')
 const {data}=await response.json()
 return buildCountryProfiles(countries,data)
}
export function buildCountryProfiles(countries,data){
 const profiles=legacyIDs.map((id,i)=>({...countries.find(c=>c.region_id===`political-${i+1}`),...data.find(c=>c.region_id===id),region_id:`political-${i+1}`,legacyRegionId:id,is_primary:true,is_sub_primary:false,sub_group_id:null}))
 profiles[0].countryOverview={capital:'翡兰珀',government:'君主制帝国',monarch:'伊莎贝拉二世',territory:'约 9,500,000 平方公里',population:'约 13700 万人',ethnicity:'奥兰人',religion:''}
 const overviews=[null,{capital:'洛雷迪亚',government:'君主制王国'},
  {capital:'宏伟的琥珀城',government:'君主制王国'},
  {capital:'新琥珀城',government:'共和制',monarch:'不适用'},
  {capital:'欧佩里亚',government:'商业邦联',monarch:'不适用'},
  {capital:'瓦尔蒙城',government:'骑士团教会国家',monarch:'不适用'}]
 for(let i=1;i<profiles.length;i++)profiles[i].countryOverview={...overviews[i],...profiles[i].countryOverview}
 profiles.push({...countries.find(c=>c.title==='赫尔铎王国'),group_id:'赫尔铎王国',title:'赫尔铎王国',foreign_title:'Kongeriket Herdor',is_primary:true,
 countryOverview:{capital:'诸湾港',government:'峡湾共治王政',monarch:'哈康·维尔加德',territory:'1,359,472 平方公里'},
 description:'赫尔铎王国位于大陆北部，疆域沿峡湾密布的海岸展开，向内陆延伸至群山之间。王国实行峡湾共治王政。王位世袭，新君继位须经诸湾议会承认。现任国王哈康·维尔加德（Håkon Værgard）主持外交与海防，各峡湾的地方事务由各自的议会管理。沿岸航路维系着王国各地，也是赫尔铎通往南方诸国的贸易通道。'})
 return profiles
}
