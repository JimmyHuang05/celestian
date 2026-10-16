// Approved first redraw (exec-434a9151), 1106 x 1422. Hand-traced visible locks.
// One continuous mesh preserves painted overlaps; these are deformation masks,
// not separate raster layers. Roots follow the torso, tips share its 4s breath.
export const ISABELLA_RIG_SIZE=[1106,1422]
export const isabellaHairStrands=[
  {id:'face-left',name:'左脸侧卷发',color:'#ffbc91',sway:[.6,.45],delay:.06,
    spine:[[508,224],[489,264],[508,298],[541,325]],
    boundary:[[500,214],[520,229],[512,259],[522,284],[546,302],[552,328],[536,339],[504,323],[482,296],[474,268],[482,238]]},
  {id:'face-right',name:'右脸侧卷发',color:'#ffdf95',sway:[-.7,.45],delay:.07,
    spine:[[669,235],[698,267],[681,294],[706,325]],
    boundary:[[666,225],[685,236],[712,264],[713,281],[699,303],[719,323],[712,341],[687,327],[667,301],[676,281],[661,252]]},
  {id:'left-back-upper',name:'左后上层长发',color:'#8ce0bf',sway:[-1.9,.9],delay:.12,
    spine:[[496,314],[436,355],[356,384],[252,423],[175,451]],
    boundary:[[487,304],[513,324],[473,352],[417,382],[355,409],[276,443],[212,459],[143,466],[166,445],[239,414],[339,379],[434,344]]},
  {id:'left-upper-flyaway',name:'左上细长发梢',color:'#7dcaf4',sway:[-.7,-2.8],delay:.19,
    spine:[[406,458],[321,475],[232,477],[155,461],[98,427],[72,388]],
    boundary:[[405,450],[419,466],[357,484],[280,494],[214,487],[146,469],[103,444],[78,420],[63,391],[67,374],[75,389],[87,417],[117,439],[170,457],[237,466],[321,464],[378,451]]},
  {id:'left-back-middle',name:'左后中层长发',color:'#9aaffe',sway:[-2,1.5],delay:.14,
    spine:[[478,366],[413,424],[310,474],[197,513],[140,568]],
    boundary:[[466,361],[493,383],[462,415],[414,449],[359,482],[291,504],[224,528],[182,554],[155,592],[128,611],[111,584],[120,545],[158,508],[223,477],[298,451],[385,407],[437,379]]},
  {id:'left-front-ribbon',name:'左前交叠宽发束',color:'#c59df3',sway:[-1.6,2.0],delay:.16,
    spine:[[24,569],[68,648],[137,713],[231,757],[321,785]],
    boundary:[[8,558],[58,560],[94,598],[113,637],[158,684],[212,721],[269,749],[328,759],[367,782],[347,803],[302,807],[242,789],[187,768],[127,734],[88,692],[54,643],[26,601]]},
  {id:'left-outer-descending',name:'左外侧下垂发束',color:'#f2a7cf',sway:[-2.7,.7],delay:.17,
    spine:[[123,684],[140,761],[106,843],[73,922],[95,976]],
    boundary:[[103,678],[134,690],[159,744],[158,789],[129,849],[96,902],[80,935],[83,959],[104,984],[86,980],[64,958],[53,934],[67,889],[88,843],[111,791],[120,753],[111,714]]},
  {id:'left-lower-loop',name:'左下外卷发束',color:'#f0be88',sway:[-2.6,1.5],delay:.19,
    spine:[[152,766],[207,842],[262,916],[330,964],[401,995]],
    boundary:[[135,757],[169,771],[199,808],[239,851],[275,896],[328,936],[379,959],[418,968],[431,989],[410,1011],[375,1007],[327,989],[278,960],[233,920],[199,877],[167,826],[149,790]]},
  {id:'left-inner-tips',name:'左下内侧分叉发梢',color:'#cfe78e',sway:[-1.1,3.0],delay:.19,
    spine:[[255,900],[292,980],[344,1048],[420,1091]],
    boundary:[[242,885],[270,906],[294,957],[322,1000],[362,1030],[399,1038],[425,1025],[432,1037],[410,1055],[426,1088],[414,1100],[371,1080],[339,1055],[310,1027],[284,987],[259,941]]},
  {id:'right-shoulder-loop',name:'右肩上翘细发束',color:'#80ded6',sway:[2,-1],delay:.13,
    spine:[[695,320],[744,346],[802,349],[855,365],[887,387]],
    boundary:[[686,309],[709,317],[745,336],[790,336],[831,343],[867,360],[890,380],[897,397],[886,401],[878,383],[852,368],[820,361],[789,365],[769,389],[747,388],[724,366],[701,346]]},
  {id:'right-back-upper',name:'右后上层长发',color:'#7bb2f8',sway:[2.4,1.1],delay:.14,
    spine:[[748,405],[829,459],[930,494],[1082,518]],
    boundary:[[735,393],[767,413],[821,444],[873,466],[934,480],[1003,480],[1101,507],[1103,528],[1060,549],[992,547],[925,535],[857,512],[802,482],[759,442]]},
  {id:'right-outer-loop',name:'右后外侧环状发束',color:'#a899f4',sway:[2.6,-1.1],delay:.17,
    spine:[[936,534],[1019,561],[1024,614],[992,682],[975,731]],
    boundary:[[926,524],[979,537],[1021,553],[1053,578],[1058,612],[1042,653],[1012,692],[989,735],[970,751],[950,742],[955,712],[979,669],[1002,638],[1019,601],[1006,576],[973,559],[935,548]]},
  {id:'right-front-ribbon',name:'右前长弧发束',color:'#ed9eda',sway:[1.9,1.8],delay:.16,
    spine:[[722,433],[787,540],[858,639],[951,736],[1040,830],[1083,884]],
    boundary:[[710,426],[740,443],[773,491],[816,546],[854,591],[888,641],[939,687],[988,734],[1035,783],[1082,835],[1104,877],[1104,905],[1090,917],[1083,896],[1074,877],[1054,882],[1024,869],[994,837],[962,800],[922,768],[888,725],[852,687],[822,641],[793,603],[763,554],[741,506],[728,465]]},
  {id:'right-bottom-outer',name:'右下外侧回卷发梢',color:'#f8bb99',sway:[2.9,1.9],delay:.19,
    spine:[[1053,879],[1011,946],[1010,1018],[1002,1072],[967,1122]],
    boundary:[[1040,866],[1072,886],[1044,931],[1033,966],[1036,1004],[1033,1046],[1015,1093],[982,1133],[962,1137],[956,1126],[977,1101],[983,1072],[969,1056],[918,1053],[902,1039],[922,1034],[960,1040],[995,1035],[1006,1007],[1000,969],[998,939],[1021,897]]},
  {id:'right-bottom-inner',name:'右下内侧回卷发束',color:'#9bd8a4',sway:[1.8,2.6],delay:.19,
    spine:[[1030,893],[954,952],[864,1000],[780,1034],[718,1046],[671,1029]],
    boundary:[[1024,880],[1045,896],[1007,937],[955,975],[894,1008],[828,1041],[777,1058],[734,1066],[700,1062],[669,1047],[655,1027],[656,1002],[668,1005],[675,1026],[701,1040],[732,1037],[779,1020],[840,992],[900,961],[967,921]]},
  {id:'right-lowest-tip',name:'右下最细游离发梢',color:'#ddca82',sway:[.8,2.7],delay:.19,
    spine:[[822,1040],[778,1080],[741,1091],[696,1084]],
    boundary:[[814,1029],[838,1038],[816,1070],[786,1094],[753,1108],[722,1106],[691,1092],[683,1074],[693,1071],[704,1084],[736,1093],[764,1086],[790,1064]]},
]

const clamp=x=>Math.max(0,Math.min(1,x))
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)}
function segment(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)
  const t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length*length||1))
  return {distance:Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy),t,length}
}
function coverage(p,polygon,feather=14){
  let inside=false,distance=Infinity
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j]
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
    distance=Math.min(distance,segment(p,a,b).distance)
  }
  return inside?smooth(distance/feather):0
}
const protectedRegions=[
  [[528,235],[548,223],[594,217],[644,216],[665,235],[663,265],[642,293],[606,311],[571,302],[542,281]],
  [[552,321],[594,316],[638,330],[669,345],[687,386],[688,443],[668,493],[634,544],[588,522],[571,457],[566,399],[546,367]],
  [[642,337],[668,333],[705,345],[734,366],[746,403],[747,471],[733,521],[709,537],[691,517],[688,459],[687,410],[673,380],[646,363]],
  [[522,325],[547,342],[544,377],[527,418],[504,456],[483,481],[443,507],[387,538],[331,560],[305,570],[289,591],[270,586],[269,567],[276,550],[304,537],[336,537],[392,516],[444,491],[478,464],[496,428],[503,382]],
  [[483,750],[592,760],[657,816],[644,883],[614,988],[606,1101],[613,1211],[617,1362],[603,1407],[564,1407],[543,1350],[490,1340],[464,1290],[472,1229],[503,1176],[508,1052],[496,908]],
]

const compiled=isabellaHairStrands.map(strand=>{
  const lengths=strand.spine.slice(1).map((point,i)=>Math.hypot(point[0]-strand.spine[i][0],point[1]-strand.spine[i][1]))
  return {...strand,lengths,length:lengths.reduce((sum,x)=>sum+x,0),bounds:[Math.min(...strand.boundary.map(p=>p[0])),Math.min(...strand.boundary.map(p=>p[1])),Math.max(...strand.boundary.map(p=>p[0])),Math.max(...strand.boundary.map(p=>p[1]))]}
})

export function isabellaHairVertex(u,v){
  const p=[u*ISABELLA_RIG_SIZE[0],v*ISABELLA_RIG_SIZE[1]],cos=[0,0],sin=[0,0]
  let total=0,cover=0
  const protect=Math.max(...protectedRegions.map(poly=>coverage(p,poly,3)))
  if(protect>.999)return [0,0,0,0,0]
  for(const strand of compiled){
    const [x0,y0,x1,y1]=strand.bounds
    if(p[0]<x0||p[0]>x1||p[1]<y0||p[1]>y1)continue
    const weight=coverage(p,strand.boundary)*(1-protect)
    if(!weight)continue
    let nearest=Infinity,progress=0,walk=0
    for(let i=0;i<strand.spine.length-1;i++){
      const hit=segment(p,strand.spine[i],strand.spine[i+1])
      if(hit.distance<nearest){nearest=hit.distance;progress=(walk+hit.t*hit.length)/strand.length}
      walk+=hit.length
    }
    // First joint is anchored. Freedom and follow-through grow down the lock.
    const freedom=smooth(progress),lag=(.025+strand.delay*freedom)*Math.PI/2
    for(let axis=0;axis<2;axis++){
      const amplitude=strand.sway[axis]*(strand.id.startsWith('face-')?1.12:1.85)*freedom*weight
      cos[axis]+=amplitude*Math.cos(lag)
      sin[axis]-=amplitude*Math.sin(lag)
    }
    cover=Math.max(cover,weight);total+=weight
  }
  // Normalize intersecting masks instead of summing two full displacements.
  const divisor=Math.max(1,total)
  return [cos[0]/divisor,cos[1]/divisor,sin[0]/divisor,sin[1]/divisor,cover]
}
