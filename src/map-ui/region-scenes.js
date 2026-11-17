// Region scenery is keyed by geometry ID, independently of city landmarks.
export const regionScenes = {
  landmark_blue_ice_cavern: [{
    title: '蓝冰洞',
    foreign_title: 'Goluboy Ledyanoy Grot',
    image: '/gallery/scenes/blue-ice-cavern-v1.webp',
    alt: '巨大的幽蓝冰洞嵌于陡峭冰壁之中，洞前融水流过浮冰与黑色砾岸',
    description: '层叠冰拱深入冰川腹地，日光穿过厚冰，映出幽蓝光泽。融水携着碎冰流出洞口，汇入冰壁下的河道。',
  }],
  region_27: [{
    title: '北海石棺',
    foreign_title: 'The North Sea Sarcophagus',
    image: '/gallery/scenes/north-sea-sarcophagus-v1.webp',
    alt: '隔海远望北海石棺，巨大的铁板封罩与石砌扶壁笼罩荒凉海岸上的高塔遗址',
    description: '为封存第一代以太能高塔残骸而建的巨型隔离工程，厚重铁板与石砌扶壁将爆炸中心彻底包覆。其形如棺椁，故称“石棺”。封罩之下的以太仍未平息，周边海域至今维持永久封锁。',
  }],
  region_160: [{
    title: '卡尔德伦群峰',
    foreign_title: 'Picos de Calderón',
    image: '/gallery/scenes/draconis-calderan-peaks-v1.webp',
    alt: '有龙之地海岸高耸的尖峰与密林，云雾缠绕山腰，帆船驶过山脚海面',
    description: '自海岸拔地而起的陡峭群峰，密林攀附岩壁，峰顶常年隐于云层。其高低错落的轮廓在远海仍清晰可辨，是航海者辨认有龙之地海岸的重要标志。',
  }, {
    title: '维尔蒙特瀑布海岸',
    foreign_title: 'The Vairmont Falls Coast',
    image: '/gallery/scenes/draconis-vairmont-coast-v1.webp',
    alt: '层叠峭壁间的瀑布奔流入海，阳光穿过厚云照亮山脊与森林',
    description: '山间水流沿层叠峭壁倾泻入海，形成绵延的瀑布群。雨季白练遍布岩岸，水雾与低云相接；醒目的断崖和银色瀑流，使这段海岸成为海图上易于辨认的天然地标。',
  }],
  region_89_1_1: [{
    title: '门多萨火山湖',
    foreign_title: 'Lago Volcánico de Mendoza',
    image: '/gallery/scenes/mendoza-volcanic-lake-v3.webp',
    alt: '夕阳照亮火山岩壁环抱的湖泊，金色倒影横穿湖面，远岸升起地热蒸汽',
    description: '灰岛最大的淡水湖泊，深蓝湖水汇聚于火山盆地之中。多数采晶人沿湖扎营，将这里作为深入封锁区前的补给与集散地。',
  }],
  region_89_core: [{
    title: '蒙特索姆布拉火山口',
    foreign_title: 'Cratera do Monte Sombra',
    image: '/gallery/scenes/ash-island-caldera-v1.webp',
    alt: '俯瞰灰岛巨大的沉睡火山口，层叠岩壁环抱深陷的盆地，云雾漂浮于辽阔的环形山脊之间',
    description: '已知世界最大的单体火山，虽已沉睡漫长岁月，地下以太仍不断逸出。火山口横跨数十公里，对岸岩壁隐没于云霭，足以容纳一座庞大都市；层层断崖直落深处，被采晶人称为“大地尚未闭合的眼睛”。',
  }],
}
// Independent wonders reuse their own scene without duplicating the original regional gallery.
regionScenes.landmark_calderan_peaks = [regionScenes.region_160[0]]
regionScenes.landmark_vairmont_falls = [regionScenes.region_160[1]]
regionScenes.landmark_rainbow_falls = [{
  title:'林登贝克大瀑布',foreign_title:'Lindenbeker Wasserfälle',
  image:'/gallery/scenes/rainbow-falls-v1.webp',
  alt:'密林环绕的弧形大瀑布，层层水幕落入深谷，水雾中映出彩虹',
  description:'宽阔河流绕过林间岩岛，沿弧形断崖分作重重水幕。瀑底水雾终日升腾，阳光照入时，彩虹横跨深谷。',
}]
regionScenes.landmark_stone_sails = [{
  title:'石帆群峰',foreign_title:'The Stone Sails',
  image:'/gallery/scenes/stone-sails-v1.webp',
  alt:'薄而高的岩脊如船帆排列，行旅与驮队沿临海山路穿行',
  description:'薄而高的岩脊成列耸立，远望如凝固的船帆。山路穿过峰脚，行旅与驮队显得格外渺小。',
}]
