const mapExtent = [[0,0],[2048,0],[2048,1024],[0,1024]]

// The terrain lines separate the affected areas from the refuges.
// The renderer supplies the international borders from the territory SVG.
const tatriaHighlands = [
  [284,278],[309,265],[315,260],[320,257],[326,251],[330,249],
  [334,243],[339,239],[343,233],[350,230],[353,225],[359,223],
  [363,217],[369,215],[372,210],[379,207],[383,201],[388,198],
  [394,191],[381,177],[284,177],
]

const boraviaUplands = [
  [456,222],[441,225],[437,230],[431,231],[428,236],[422,237],
  [419,241],[414,243],[415,248],[418,251],[416,254],[421,258],
  [425,259],[428,263],[432,262],[436,266],[442,267],[448,271],
  [460,273],
]

// Trace the river in the reference crop, using the nearby Boravia border
// bend to register the crop against the political SVG.
const greatRiverFront = [
  [108,51],[121,56],[129,61],[139,65],[145,70],[191,70],
  [199,74],[206,81],[212,87],[216,95],[226,103],[233,110],
  [237,119],[240,128],[244,138],[245,152],[244,164],[249,171],
  [258,178],[266,185],[276,191],[288,196],[299,202],[311,211],
  [321,219],[332,226],[342,230],[354,241],[363,248],[370,253],
  [377,248],[385,240],[393,232],[404,225],[414,217],[425,211],
  [436,205],[448,201],[460,197],[473,193],[488,190],[506,189],
  [526,189],[541,185],[551,181],[557,176],[561,168],[620,152],
].map(([x,y]) => [407 + (x - 586) / 3.6, 359 + (y - 143) / 3.6])

const greatRiverNorth = [[200,270],[470,270],[470,345], ...greatRiverFront.toReversed(), [200,325]]

// The breach extends from the river bend toward the coast. Overlap the
// existing northern mask so the two areas render as one continuous wash.
const amberKingdomBreach = [
  [347,355],[422,355],[422,391],[410,392],[407,394],[403,396],
  [399,396],[395,394],[389,393],[386,391],[383,386],[380,383],
  [376,382],[370,382],[365,381],[360,379],[355,379],[351,381],
  [347,384],[344,386],
]

// The ridge crosses political borders, so the same refuge is subtracted
// from each affected country's own pollution mask.
const westernRidgeRefuge = [
  [112,557],[130,531],[164,517],[222,506],[272,490],[304,471],
  [326,449],[344,415],[341,367],[337,336],[319,297],[312,266],
  [329,238],[352,223],[381,215],[422,215],[402,240],[391,275],
  [383,311],[400,329],[426,350],[437,379],[427,404],[412,426],
  [414,455],[417,480],[391,491],[357,506],[325,529],[296,547],
  [254,557],[215,569],[180,583],[148,586],[122,573],
].map(([x,y]) => [390 + (x - 687) / 4.48, 203 + (y - 30) / 4.48])

// The northern front encloses North Cape. Inland, the front narrows
// but still crosses the southern border, severing the overland connection.
const velogoriyaBreach = [
  [478,24],[732,24],[719,53],[704,70],[698,84],[708,96],
  [694,110],[681,120],[677,134],[665,146],[670,158],[659,170],
  [654,184],[661,198],[648,210],[644,225],[650,236],[638,247],
  [637,261],[631,273],[637,294],[588,294],[590,278],[584,264],
  [588,250],[574,237],[579,222],[567,213],[560,200],[548,189],
  [551,177],[535,164],[529,151],[515,143],[518,130],[507,119],
  [499,104],[502,92],[490,78],[494,66],[482,53],
]

const blueSeaHighlands = [
  [212,518],[217,501],[234,487],[260,481],[286,471],[309,460],
  [326,441],[347,426],[373,418],[400,412],[431,410],[461,414],
  [480,424],[490,440],[488,464],[480,486],[466,511],[449,539],
  [430,566],[410,590],[385,609],[365,630],[341,639],[310,644],
  [279,644],[254,636],[239,614],[227,588],[223,561],[218,537],
].map(([x,y]) => [574 + (x - 232) / 2.5, 237 + (y - 520) / 2.5])

// Preserve the southern interior. Clipped against the current territory,
// this front covers approximately 80% of North Ingleton's map area.
const northIngletonFront = [
  [1400,330],[1660,330],[1660,459.5],[1600,462.5],[1578,457.5],
  [1559,455.5],[1549,461.5],[1533,463.5],[1512,458.5],[1499,461.5],
  [1488,459.5],[1473,453.5],[1463,455.5],[1446,462.5],[1400,459.5],
]

const clemenyCoastalFront = [
  [215,318],[225,296],[249,282],[278,279],[310,274],[338,275],
  [370,283],[399,293],[425,300],[450,298],[472,284],[491,268],
  [516,257],[540,255],[567,265],[597,282],[622,296],[649,309],
  [655,335],[622,362],[544,385],[424,404],[294,390],[222,351],
].map(([x,y]) => [1626 + (x - 251) / 3.68, 395 + (y - 413) / 3.68])

// Register the crop on the North Cape and Fuleng settlement markers.
const northernShoreFronts = [
  [[565,192],[598,157],[627,134],[753,121],[928,130],[1060,140],
    [1040,170],[981,209],[910,246],[836,283],[782,278],[717,258],[665,227],[593,216]],
  [[175,378],[226,365],[292,361],[336,366],[386,389],[416,418],
    [429,461],[417,507],[390,529],[338,529],[302,518],[255,497],[214,468],[189,436]],
]

export const northernShorePollution = northernShoreFronts.map(front => ({
  country:'political-7',
  points:front.map(([x,y]) => [593.4 + (x - 474) / 2.36, 129.52 + (y - 327) / 2.36]),
}))

export const ashIslandPollution = {
  country:'political-2',
  points:[[86,382],[133,382],[133,415],[145,415],[145,444],[86,444]],
}

// Registered to the capital and river-port markers in the latest annotated crop.
export const sanVidalPollution = {
  country:'custom-san-vidal',
  points:[[99,511],[104,447],[110,405],[121,375],[136,333],[151,291],
    [165,269],[190,255],[222,245],[254,234],[292,233],[315,238],[329,245],
    [340,261],[353,294],[363,308],[382,327],[394,341],[397,363],[419,364],
    [446,361],[462,360],[478,351],[499,353],[522,349],[546,335],[562,333],
    [586,335],[600,337],[615,345],[628,355],[635,375],[657,376],[676,369],
    [699,358],[715,357],[736,364],[747,369],[763,373],[772,382],[778,410],
    [779,451],[785,476],[783,496],[774,515],[774,527],[782,534],[800,538],
    [818,539],[820,559],[820,575],[812,596],[790,620],[758,644],[716,668],
    [668,692],[620,723],[583,744],[289,744],[246,710],[209,676],[171,640],
    [138,603],[116,568],[105,545]].map(([x,y]) => [1206 + (x-340)/2.55, 606 + (y-541)/2.55]),
}

export const acelaiPollution = {
  country:'custom-acelai',
  points:[[1649,797],[1658,793],[1673,794],[1682,798],[1691,797],[1700,804],
    [1701,818],[1694,832],[1680,835],[1664,831],[1650,824],[1643,813]],
}

export const initialPollution = [
  acelaiPollution,
  sanVidalPollution,
  ashIslandPollution,
  {country:'custom-tatria', points:mapExtent, refuges:[tatriaHighlands, westernRidgeRefuge]},
  {country:'custom-region-44930', points:mapExtent, exclude:boraviaUplands},
  {country:'custom-pannovia', points:mapExtent, refuges:[westernRidgeRefuge]},
  {country:'political-3', points:greatRiverNorth},
  {country:'political-3', points:amberKingdomBreach},
  {country:'political-4', points:greatRiverNorth, refuges:[westernRidgeRefuge]},
  {country:'political-7', points:velogoriyaBreach, refuges:[blueSeaHighlands]},
  ...northernShorePollution,
  {country:'custom-1d92e13a-b16c-47e6-a8aa-4764e2a01136', points:mapExtent},
  {country:'custom-c037d371-0a4e-411b-99ab-e5133cc71dc8', points:northIngletonFront},
  {country:'custom-4b691d1c-b1c3-4533-8432-044c260d391a', points:clemenyCoastalFront},
  {country:'custom-4b691d1c-b1c3-4533-8432-044c260d391a', points:[[1618,388],[1634,388],[1634,402],[1618,402]]},
  {country:'custom-4b691d1c-b1c3-4533-8432-044c260d391a', points:[[1598,430],[1626,430],[1626,460],[1598,460]]},
]
