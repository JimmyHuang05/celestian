// Independent new-world landmarks use the same dossier/share contract as points.
// Scene images remain in the lazy-loaded detail panel, not the basemap bundle.
export const ashIslandVolcano = {
  id: 'landmark-ash-island-volcano',
  title: '蒙特索姆布拉火山',
  foreign_title: 'Vulcão do Monte Sombra',
  type: '自然奇观',
  isLandmark: true,
  description: '已知规模最大的陆地单体火山，灰岛便是其历次喷发堆积而成。即使处于休眠期，山体仍向外辐射超量以太。琥珀王国已全面禁止进入火山核心区，却仍有采晶人越过封锁线，冒险采集高纯度以太解质，供给灰岛港的走私市场。',
  lat: (1 - 833 / 2048) * 5200,
  lng: 243 / 4096 * 10800,
  sceneRegionIds: ['region_89_core', 'region_89_1_1'],
}

export const WONDER_KEY = 'celestian-wonder-placement-v1'
export const MAPPLUS_WONDERS_ENABLED = false
export const mapPlusLandmarks = [
  {id:'landmark-rainbow-falls',title:'林登贝克大瀑布',foreign_title:'Lindenbeker Wasserfälle',type:'自然奇观',isLandmark:true,
   description:'宽阔河流绕过林间岩岛，沿弧形断崖分作重重水幕。瀑底水雾终日升腾，阳光照入时，彩虹横跨深谷。',
   svg:'/mapplus/landmarks/rainbow-falls-gouache-v2.svg',position:null,size:46,aspect:1.52381,sceneRegionIds:['landmark_rainbow_falls'],
   placementNote:'适合湿润热带或亚热带的大河断崖处，放在内陆河道上，而非入海口。'},
  {id:'landmark-stone-sails',title:'石帆群峰',foreign_title:'The Stone Sails',type:'自然奇观',isLandmark:true,
   description:'薄而高的岩脊如石帆般成列耸立，古老山路蜿蜒其间。行旅与驮队经过峰脚，更显群峰的巨大尺度。',
   svg:'/mapplus/landmarks/stone-sails-gouache-v2.svg',position:null,size:44,aspect:1.48148,sceneRegionIds:['landmark_stone_sails'],
   placementNote:'适合岩层陡立的山地或临海山脊，沿山系走向摆放。'},
  {id:'landmark-calderan-peaks',title:'卡尔德伦群峰',foreign_title:'Picos de Calderón',type:'自然奇观',isLandmark:true,
   description:'临海群峰陡然拔起，密林覆盖山麓，云雾长久缠绕峰顶，是远航船只辨认海岸的天然标志。',
   svg:'/mapplus/landmarks/calderan-peaks-gouache-v2.svg',position:null,size:44,aspect:1.47239,sceneRegionIds:['landmark_calderan_peaks'],
   placementNote:'优先放在湿润热带或亚热带的迎风海岸；温暖多雨、山麓有密林，比寒带更贴近原图。'},
  {id:'landmark-vairmont-falls',title:'维尔蒙特瀑布海岸',foreign_title:'The Vairmont Falls Coast',type:'自然奇观',isLandmark:true,
   description:'山间河流越过层层断崖，化为瀑布汇入海湾。雨季银流遍布岩岸，水雾与山间低云相接。',
   svg:'/mapplus/landmarks/vairmont-falls-gouache-v2.svg',position:null,size:46,aspect:1.51899,sceneRegionIds:['landmark_vairmont_falls'],
   placementNote:'优先放在温带多雨的迎风海岸，保留森林与充沛径流；热带也可，严格寒带不宜保持图中的茂密森林。'},
  {...ashIslandVolcano, svg:'/mapplus/landmarks/ash-island-volcano-gouache-v2.svg', position:[-427.25,118.5], size:22.5, aspect:1.89723},
  {id:'landmark-blue-ice-cavern',title:'蓝冰洞',foreign_title:'Goluboy Ledyanoy Grot',type:'自然奇观',isLandmark:true,
   description:'冰壁深处的洞穴透出幽蓝光泽，层叠的冰拱与裂隙勾勒出冰川内部的纹理。',
   svg:'/mapplus/landmarks/blue-ice-cavern-gouache-v3.svg',position:null,size:36,aspect:1.57377,sceneRegionIds:['landmark_blue_ice_cavern']},
]
export function resolveWonders(entries={}) {
 return mapPlusLandmarks.map(row=>{
  const item=entries[row.id]||{},p=Object.hasOwn(item,'position')?item.position:row.position
  const position=Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=-1024&&p[0]<=0&&p[1]>=0&&p[1]<=2048?p:null
  const size=Number.isFinite(item.size)?Math.max(8,Math.min(160,item.size)):row.size
  return {...row,position,size,...(position?{lat:(1+position[0]/1024)*5200,lng:position[1]/2048*10800}:{})}
 })
}
