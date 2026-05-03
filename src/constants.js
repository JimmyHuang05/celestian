const ASSETS_BASE = 'https://assets.jimmyhuang.cn'
const BUILD_HASH = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev-' + Math.random().toString(36).slice(2, 14)
export { BUILD_HASH }
export default ASSETS_BASE
