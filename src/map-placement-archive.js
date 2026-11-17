export const PLACEMENT_KEYS=['celestian-placement-new-estra-20cbce0ed04d','celestian-text-placement-v1','celestian-wonder-placement-v1']
export async function archiveLocalPlacements(){
 const data={}
 for(const key of PLACEMENT_KEYS){try{const value=JSON.parse(localStorage.getItem(key));if(value&&Object.keys(value).length)data[key]=value}catch{}}
 if(import.meta.env.DEV&&Object.keys(data).length){const handshake=await fetch('/__mapplus/archive',{cache:'no-store'});if(!handshake.ok)throw Error('定位保存接口暂不可用');const {token}=await handshake.json();const response=await fetch('/__mapplus/archive',{method:'POST',headers:{'Content-Type':'application/json','X-Placement-Token':token},body:JSON.stringify(data)});if(!response.ok)throw Error('定位保存到项目失败')}
}
export async function readProjectPlacements(){const response=await fetch('/mapplus/placements.json',{cache:'no-store'});if(!response.ok)return {};try{return await response.json()}catch{return {}}}
export async function placementEntries(key){
 const saved=await readProjectPlacements().catch(()=>({}))
 if(import.meta.env.DEV||saved[key])return saved[key]||{}
 try{const local=JSON.parse(localStorage.getItem(key));return {...saved[key],...local}}catch{return saved[key]||{}}
}
export async function saveProjectPlacements(key, entries, mode='patch'){
 const handshake=await fetch('/__mapplus/archive',{cache:'no-store'})
 if(!handshake.ok)throw Error('定位保存接口暂不可用')
 const {token}=await handshake.json()
 const response=await fetch('/__mapplus/archive',{method:'POST',headers:{'Content-Type':'application/json','X-Placement-Token':token},body:JSON.stringify({key,entries,mode})})
 if(!response.ok){
  const result=await response.json().catch(()=>null)
  throw Error(result?.error||'项目定位保存失败，请重试')
 }
}
