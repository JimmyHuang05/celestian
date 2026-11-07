import assert from 'node:assert/strict'
import fs from 'node:fs'
import { indexRegions, searchMap } from '../src/map-ui/search.js'

const parent = { region_id: 'a', group_id: '国家A', title: '国家A', is_primary: true, status: '正常', description: '国家资料' }
const colony = { region_id: 'b', group_id: '国家A', title: '殖民地', sub_group_id: '殖民地', is_sub_primary: true, status: '正常', description: '殖民地资料' }
const rows = [parent, colony,
  { region_id: 'c', group_id: '国家A', follow_primary: true, status: '正常' },
  { region_id: 'd', group_id: '国家A', sub_group_id: '殖民地', follow_primary: true, status: '污染' },
  { region_id: 'e', group_id: '国家A', sub_group_id: '殖民地', follow_primary: true, status: '污染', description: '当地污染详情' },
  { region_id: 'f', group_id: '国家A', title: '独立区域', status: '污染' },
]
const before = JSON.stringify(rows)
const index = indexRegions(rows, new Set(rows.map(row => row.region_id)))
assert.equal(index.length, 4)
assert.equal(index.find(row => row.title === '国家A').region_id, 'a')
assert.equal(index.find(row => row.title === '殖民地' && row.status === '污染').description, '当地污染详情')
assert.equal(index.find(row => row.title === '殖民地' && row.status === '污染').region_id, 'e')
assert.equal(searchMap([], index, '国家A', '首都').length, 4, 'A point filter must not hide matching regions')
assert.equal(JSON.stringify(rows), before)
const records = JSON.parse(fs.readFileSync(new URL('../public/map/world-240705-base-v2/legacy-region-metadata.json', import.meta.url))).data
const svg = fs.readFileSync(new URL('../public/map/world-240705-base-v2/legacy-regions.svg', import.meta.url), 'utf8')
const valid = new Set([...svg.matchAll(/data-region-id="([^"]+)"/g)].map(match => match[1]))
const real = searchMap([], indexRegions(records, valid), '奥兰尼亚', '')
assert.equal(real.filter(result => result.row.title === '女王陛下的奥兰尼亚帝国').length, 1)
assert.equal(real[0].row.title, '女王陛下的奥兰尼亚帝国')
assert(real.some(result => result.row.title === '北英普顿殖民地'))
assert(real.some(result => result.row.title === '北海以太能污染区'))
assert.equal(real.filter(result => result.row.title === '克莱曼尼殖民地' && result.row.status === '污染').length, 1)
console.log('Passed: dossier deduplication, local status preservation, primary ordering, independent colonies, point-filter isolation and immutable source data.')
