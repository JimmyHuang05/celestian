const NAME='celestian-political-vector-live-v1'
// Request the editor's current draft when a map tab is opened later.
export function politicalPublisher(getDraft){
 if(!globalThis.BroadcastChannel)return {update(){},destroy(){}}
 const channel=new BroadcastChannel(NAME)
 const send=()=>channel.postMessage({type:'draft',draft:getDraft()})
 channel.onmessage=e=>{if(e.data?.type==='request')send()}
 return {update:send,destroy:()=>channel.close()}
}
export function watchPoliticalDraft(receive){
 if(!globalThis.BroadcastChannel)return ()=>{}
 const channel=new BroadcastChannel(NAME)
 channel.onmessage=e=>{if(e.data?.type==='draft')receive(e.data.draft)}
 channel.postMessage({type:'request'})
 const request=()=>channel.postMessage({type:'request'})
 window.addEventListener('focus',request)
 return ()=>{window.removeEventListener('focus',request);channel.close()}
}
