export const EDEN_ART_SIZE = { width: 1672, height: 941 }
export const EDEN_ORIGINAL_ART = '/images/eden/black-sun-sacred-tree.webp'

// User-supplied web extractions, copied byte-for-byte. Registration is entirely
// presentational so the original PNGs remain available for independent reuse.
// The default framing is now full bleed: scenery overscans the canvas and the
// foreground steps continue below its lower edge, including during parallax.
export const EDEN_ART_LAYERS = [
  { id: 'distance', name: '天幕与远景', number: '01', file: '01-background.png',
    detail: '保留原底图中的云海、山脉与城市', depth: 0.08,
    initial: { x: 0, y: 0, scale: 1.14 } },
  { id: 'landscape', name: '独立山景 · 备用', number: '02', file: '03-landscape.png',
    detail: '默认隐藏，避免与底图重复；可单独查看与移动', depth: 0.22,
    initial: { x: 0, y: 8.4, scale: 1.142, stretchY: 0.82, visible: false } },
  { id: 'eclipse', name: '黑日与放射', number: '03', file: '02-eclipse.png',
    detail: '黑日放大并靠近上沿，放射在圣树后方展开', depth: 0.24,
    initial: { x: 0, y: -8.4, scale: 0.986 } },
  { id: 'architecture-left', name: '左侧拱廊', number: '04', file: '04-architecture-left.png',
    detail: '建筑延伸到左侧画外，取消原先留给外框的空隙', depth: 0.72,
    initial: { x: -3.36, y: -1.68, scale: 0.986, stretchY: 0.9 } },
  { id: 'architecture-right', name: '右侧拱廊', number: '05', file: '05-architecture-right.png',
    detail: '建筑向右侧画外延展，与左侧分别控制', depth: 0.78,
    initial: { x: 4.8, y: -1.68, scale: 0.986, stretchY: 0.9 } },
  { id: 'stairs', name: '前景石阶', number: '06', file: '07-stairs.png',
    detail: '石阶铺满横向宽度并延伸出下沿，保留视差余量', depth: 1,
    initial: { x: 0, y: 22, scale: 1.08, stretchY: 0.72 } },
  { id: 'tree', name: '圣树与根系', number: '07', file: '06-sacred-tree.png',
    detail: '随无框构图适度放大，根系衔接前景石阶', depth: 1.7,
    initial: { x: -0.56, y: 16.35, scale: 0.582 } },
  { id: 'frame', name: '金色外框', number: '08', file: '08-gold-frame.png',
    detail: '默认关闭，保留为可选装饰；开启时保持固定', depth: 0,
    initial: { x: 0, y: 0, scale: 1, visible: false } },
].map(layer => ({
  ...layer,
  initial: { opacity: 1, visible: true, stretchY: 1, ...layer.initial },
  src: `/images/eden/layers-web-v2/${layer.file}`,
}))

export function createEdenLayerSettings() {
  return Object.fromEntries(EDEN_ART_LAYERS.map(layer => [layer.id, {
    ...layer.initial,
  }]))
}
