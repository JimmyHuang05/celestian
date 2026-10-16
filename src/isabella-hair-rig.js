// The A reference uses this coordinate system. Boundaries follow individual
// visible locks, not left/right rectangles. Shared borders taper to the same
// parent motion so intersecting locks cannot open cracks in the painted plate.
export const ISABELLA_RIG_SIZE=[896,1152]
export const isabellaHairStrands=[
  {id:'face-left',name:'左脸侧卷发',color:'#ffbc91',sway:[.55,.45],delay:.06,
    spine:[[424,197],[412,231],[415,254],[441,277]],
    boundary:[[420,190],[436,198],[430,225],[430,245],[450,264],[445,285],[420,277],[402,256],[400,231],[407,207]]},
  {id:'face-right',name:'右脸侧卷发',color:'#ffdf95',sway:[-.65,.45],delay:.07,
    spine:[[533,207],[552,237],[540,262],[568,291]],
    boundary:[[528,200],[545,208],[561,226],[566,245],[550,264],[575,286],[568,302],[540,285],[526,263],[538,238],[523,224]]},
  {id:'left-back-upper',name:'左后上层长发',color:'#8ce0bf',sway:[-1.15,.7],delay:.12,
    spine:[[421,271],[365,312],[288,344],[204,369],[136,381]],
    boundary:[[418,262],[431,282],[407,309],[353,344],[300,368],[237,386],[168,398],[115,395],[138,374],[223,348],[306,323],[377,294]]},
  {id:'left-upper-flyaway',name:'左上细长发梢',color:'#7dcaf4',sway:[-.35,-1.7],delay:.19,
    spine:[[361,393],[288,410],[205,408],[128,385],[85,361],[69,338]],
    boundary:[[366,383],[371,397],[319,418],[260,423],[197,418],[144,401],[102,379],[76,355],[64,331],[72,332],[91,358],[136,383],[200,400],[276,402],[331,391]]},
  {id:'left-back-middle',name:'左后中层长发',color:'#9aaffe',sway:[-1.2,1.0],delay:.14,
    spine:[[406,317],[345,373],[256,414],[179,461],[131,515]],
    boundary:[[393,317],[414,329],[398,354],[356,383],[321,413],[268,439],[226,453],[189,479],[162,516],[136,542],[111,519],[113,477],[145,445],[195,417],[258,393],[321,366],[365,339]]},
  {id:'left-front-ribbon',name:'左前交叠宽发束',color:'#c59df3',sway:[-.9,1.3],delay:.16,
    spine:[[43,467],[68,527],[128,579],[207,616],[264,629]],
    boundary:[[25,458],[68,458],[103,492],[114,525],[144,556],[189,584],[233,603],[280,608],[296,626],[270,647],[226,651],[174,631],[122,607],[85,570],[56,527],[32,490]]},
  {id:'left-outer-descending',name:'左外侧下垂发束',color:'#f2a7cf',sway:[-1.65,.45],delay:.17,
    spine:[[121,558],[135,632],[111,693],[78,758],[96,805]],
    boundary:[[98,550],[129,566],[155,621],[146,670],[117,721],[88,764],[87,791],[111,819],[92,815],[70,791],[65,766],[79,720],[101,669],[113,630],[105,594]]},
  {id:'left-lower-loop',name:'左下外卷发束',color:'#f0be88',sway:[-1.5,.9],delay:.20,
    spine:[[137,632],[174,706],[211,758],[269,793],[320,793]],
    boundary:[[121,627],[154,639],[186,683],[208,722],[251,756],[297,777],[327,776],[339,792],[319,809],[275,807],[234,791],[198,766],[166,724],[142,685]]},
  {id:'left-inner-tips',name:'左下内侧分叉发梢',color:'#cfe78e',sway:[-.7,1.85],delay:.21,
    spine:[[215,719],[244,788],[286,836],[325,845]],
    boundary:[[207,706],[235,725],[251,767],[270,798],[308,815],[342,803],[342,818],[317,829],[326,849],[307,858],[274,846],[248,816],[229,778]]},
  {id:'right-shoulder-loop',name:'右肩上翘细发束',color:'#80ded6',sway:[1.3,-.6],delay:.13,
    spine:[[542,271],[584,301],[628,296],[661,305],[676,324]],
    boundary:[[537,265],[554,270],[584,289],[626,288],[654,292],[675,307],[684,325],[677,334],[669,322],[648,307],[624,307],[603,330],[584,331],[563,311],[542,294]]},
  {id:'right-back-upper',name:'右后上层长发',color:'#7bb2f8',sway:[1.45,.7],delay:.14,
    spine:[[594,357],[660,405],[737,426],[837,430]],
    boundary:[[586,347],[618,362],[657,385],[698,402],[745,412],[795,411],[859,427],[848,445],[808,455],[755,451],[708,443],[663,424],[621,397]]},
  {id:'right-outer-loop',name:'右后外侧环状发束',color:'#a899f4',sway:[1.6,-.7],delay:.18,
    spine:[[727,436],[803,454],[807,504],[776,559],[770,606]],
    boundary:[[719,430],[764,438],[809,449],[832,472],[830,511],[804,545],[786,571],[782,605],[761,614],[755,579],[769,540],[792,513],[804,481],[792,468],[755,457],[722,447]]},
  {id:'right-front-ribbon',name:'右前长弧发束',color:'#ed9eda',sway:[1.15,1.15],delay:.16,
    spine:[[563,368],[614,453],[678,530],[755,602],[831,682],[827,723]],
    boundary:[[551,361],[578,375],[606,415],[646,465],[690,506],[729,557],[777,592],[823,635],[855,675],[873,707],[868,730],[854,734],[855,706],[828,697],[800,701],[773,674],[745,646],[709,616],[681,578],[649,552],[626,515],[599,476],[576,435],[563,402]]},
  {id:'right-bottom-outer',name:'右下外侧回卷发梢',color:'#f8bb99',sway:[1.8,1.2],delay:.21,
    spine:[[841,702],[802,759],[797,823],[793,869],[769,903]],
    boundary:[[828,693],[851,706],[828,743],[822,772],[817,811],[819,842],[808,881],[785,912],[761,922],[751,912],[765,891],[771,866],[761,849],[721,844],[704,832],[720,827],[752,835],[783,828],[797,805],[794,776],[789,756],[806,721]]},
  {id:'right-bottom-inner',name:'右下内侧回卷发束',color:'#9bd8a4',sway:[1.05,1.6],delay:.20,
    spine:[[812,720],[748,762],[670,801],[600,833],[546,837],[505,817]],
    boundary:[[814,707],[831,721],[799,752],[749,782],[696,810],[644,836],[599,849],[554,853],[526,846],[501,834],[488,814],[490,790],[500,791],[505,817],[526,828],[554,827],[602,813],[651,793],[703,768],[757,739]]},
  {id:'right-lowest-tip',name:'右下最细游离发梢',color:'#ddca82',sway:[.5,1.7],delay:.22,
    spine:[[623,823],[586,853],[601,875],[652,878],[680,862]],
    boundary:[[611,815],[636,818],[610,846],[598,857],[610,869],[638,874],[667,866],[684,852],[686,866],[667,885],[638,892],[605,886],[585,872],[577,855],[590,835]]},
]

const clamp=x=>Math.max(0,Math.min(1,x))
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)}
function segment(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)
  const t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length*length||1))
  return {distance:Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy),t,length}
}
function coverage(p,polygon,feather=7){
  let inside=false,distance=Infinity
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j]
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
    distance=Math.min(distance,segment(p,a,b).distance)
  }
  return inside?smooth(distance/feather):0
}
const protectedRegions=[
  // Face, chest, raised arm, skirt-gripping arm/hand and legs must not inherit
  // a nearby hair lock's independent deformation, even at overlapping edges.
  [[444,216],[462,205],[501,204],[526,218],[530,240],[511,268],[486,286],[459,271],[443,249]],
  [[449,289],[478,285],[510,296],[535,304],[554,326],[552,374],[547,426],[523,467],[480,457],[459,419],[463,361],[450,333]],
  [[522,302],[544,298],[564,306],[584,324],[593,366],[590,415],[580,448],[564,450],[554,433],[552,379],[552,349],[526,326]],
  [[433,291],[453,299],[452,330],[437,357],[424,388],[405,415],[361,433],[307,455],[282,465],[255,466],[249,485],[235,486],[234,467],[239,453],[259,445],[291,445],[343,428],[384,410],[402,384],[411,354],[412,319]],
  [[403,628],[499,628],[548,665],[541,720],[510,797],[491,905],[496,990],[499,1108],[467,1141],[438,1098],[398,1084],[382,1048],[404,1003],[411,961],[408,868],[404,780]],
]

const compiled=isabellaHairStrands.map(strand=>{
  const lengths=strand.spine.slice(1).map((point,i)=>Math.hypot(point[0]-strand.spine[i][0],point[1]-strand.spine[i][1]))
  return {...strand,lengths,length:lengths.reduce((sum,x)=>sum+x,0),bounds:[Math.min(...strand.boundary.map(p=>p[0])),Math.min(...strand.boundary.map(p=>p[1])),Math.max(...strand.boundary.map(p=>p[0])),Math.max(...strand.boundary.map(p=>p[1]))]}
})

export function isabellaHairVertex(u,v){
  const p=[u*896,v*1152],cos=[0,0],sin=[0,0]
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
    const freedom=smooth(progress),lag=(.035+strand.delay*freedom)*Math.PI/2
    for(let axis=0;axis<2;axis++){
      const amplitude=strand.sway[axis]*(strand.id.startsWith('face-')?1.15:1.4)*freedom*weight
      cos[axis]+=amplitude*Math.cos(lag)
      sin[axis]-=amplitude*Math.sin(lag)
    }
    cover=Math.max(cover,weight);total+=weight
  }
  // Normalize intersecting masks instead of summing two full displacements.
  const divisor=Math.max(1,total)
  return [cos[0]/divisor,cos[1]/divisor,sin[0]/divisor,sin[1]/divisor,cover]
}
