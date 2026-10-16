// The archive reads only its own frozen public data, never the live API.
let snapshot
export async function apiGet(path) {
  snapshot ||= fetch('/old/snapshot.json').then(response => {
    if (!response.ok) throw new Error('怀旧档案暂时无法加载')
    return response.json()
  }).catch(error => { snapshot = undefined; throw error })
  const data = await snapshot
  if (!Object.hasOwn(data, path)) throw new Error('怀旧档案中没有此内容')
  return structuredClone(data[path].data)
}
