export const BASEMAP_STYLES = [
  { id: 'default', label: '默认', note: '羊皮纸手绘地图' },
  { id: 'ecology', label: '生态', note: '植被与生物群落' },
  { id: 'elevation', label: '高程', note: '地表海拔与海底深度 · m' },
  { id: 'geo', label: '地理图', note: '分层设色与地形晕渲' },
  { id: 'temperature', label: '气温', note: '年平均气温 · °C' },
  { id: 'precipitation', label: '降水', note: '年降水量 · mm' },
  { id: 'blank', label: '白模', note: '浅色陆地与水域轮廓' },
]

export const normalizeBasemapStyle = value => BASEMAP_STYLES.some(style => style.id === value) ? value : 'default'
