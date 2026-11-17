export const countryIdentities = {
  '锡里亚共和国': {region_id:'custom-east-illyria',politicalColor:'#918975'},
  '锡里亚国': {region_id:'custom-west-illyria',politicalColor:'#81968d'},
  '神圣的霍亨泰因帝国': {region_id:'custom-hohentein',politicalColor:'#8b877a'},
  '伊斯法尔崇高国': {region_id:'custom-isfar',politicalColor:'#9f8b66'},
  '香佩安自由市': {region_id:'custom-ciampiana',politicalColor:'#9b855e'},
  '布列托尼亚公国': {region_id:'custom-armorica',politicalColor:'#b39b75'},
  '萨瓦尔迪亚公国': {region_id:'custom-savaldia',politicalColor:'#8993a4'},
  '奥克塔尼亚公国': {region_id:'custom-occitania',politicalColor:'#72947e'},
  '瓦莱西亚同盟': {region_id:'custom-valesia',politicalColor:'#8b9672'},
  '伊奥尼亚': {region_id:'custom-ionia',politicalColor:'#688f9d'},
  '提洛斯城邦': {region_id:'custom-delos',politicalColor:'#a18d60'},
  '法罗斯城邦': {region_id:'custom-pharos',politicalColor:'#8a809f'},
}

// Map presentation only. Pure presentation normalization; respects vector-draft.json as single source of truth.
export function countryDisplayDraft(source) {
  const draft = {...source, rings:source.rings.map(r=>({...r})), countries:(source.countries||[]).map(c=>({...c}))}
  for(const country of draft.countries)if(country.title==='罗德里亚开拓区')country.title='沃龙佐边疆区'
  for(const [title, identity] of Object.entries(countryIdentities)){
    if(!draft.countries.some(c=>c.title===title||c.region_id===identity.region_id)){
      draft.countries.push({...identity,title})
    }
  }
  return draft
}
