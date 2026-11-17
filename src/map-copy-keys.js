// Stable identities shared by the local editor and map dossiers.
export const sceneCopyKey = scene => `scene:${scene.image || scene.title}`
export const regionCopyKey = row => `region:${row.legacyRegionId || row.region_id || row.sourceRegionId}`
export const markerCopyKey = row => `marker:${row.id}`
export function copyKeyForRow(row) {
  if (row.isRegion && row.group_id === '赫尔铎王国') return 'country:赫尔铎王国'
  if (row.isRegion && row.group_id === '希斯伯尼亚') return 'country:希斯伯尼亚'
  return row.isRegion ? regionCopyKey(row) : row.isLandmark ? `landmark:${row.id}` : markerCopyKey(row)
}
