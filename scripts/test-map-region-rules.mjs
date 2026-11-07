import assert from 'node:assert/strict'
import { resolveRegion, relatedRegions } from '../src/map-regions.js'
const parent = { region_id: 'a', group_id: '国家A', is_primary: true, title: '国家A' }
const sub = { region_id: 'b', group_id: '国家A', sub_group_id: '本土', is_sub_primary: true, title: '本土' }
const follower = { region_id: 'c', group_id: '国家A', sub_group_id: '本土', follow_primary: true }
const other = { region_id: 'd', group_id: '国家B', sub_group_id: '本土', is_sub_primary: true }
const records = [other, parent, sub, follower]
assert.equal(resolveRegion(follower, records), sub)
assert.equal(resolveRegion({ ...follower, sub_group_id: '' }, records), parent)
assert.deepEqual(relatedRegions(follower, records).map(r => r.region_id), ['a', 'b', 'c'])
assert.equal(resolveRegion(parent, records), parent)
console.log('Passed: main/subregion following and related territory grouping exclude another country with the same subgroup name.')
