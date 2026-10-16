import './profile-sound.css'

const cues={
  'f967a2c8-252b-4a1e-8e55-9ac5fe1597e2':'isabella-crystal-v3',
  '2a9bf85c-f975-4054-9597-5f4f11414983':'elowen',
  'bf217625-407b-4cff-ae92-4f1ba3ba8cca':'sylvia',
  '4ea0b64e-1c59-43a5-a082-caf6c6a5a790':'euphemia',
  '5bf8f6ab-da96-4cc6-a715-45050f289dd5':'xianna',
  'ec561630-2810-41a0-8524-857bfa8365e1':'day-fourteen'
}

export function mountProfileSound(currentCharacter){
  let context,voice,timer,sequence=0,muted=false,disposed=false
  const buffers=new Map()
  try{muted=localStorage.getItem('profile-sound-muted')==='true'}catch{}
  const controls=document.createElement('div')
  controls.className='profile-sound-controls'
  controls.innerHTML='<button type="button" class="sound-replay">↻ 重播音效</button><button type="button" class="sound-toggle"></button>'
  document.querySelector('.profile').append(controls)
  const replay=controls.querySelector('.sound-replay'),toggle=controls.querySelector('.sound-toggle')
  function update(){
    toggle.textContent=muted?'音效 · 关':'音效 · 开'
    toggle.setAttribute('aria-label',muted?'开启角色音效':'关闭角色音效')
    toggle.setAttribute('aria-pressed',String(muted))
    replay.disabled=muted
  }
  function unlock(){
    if(disposed)return
    try{
      context??=new (window.AudioContext||window.webkitAudioContext)()
      if(context.state==='suspended')context.resume().catch(()=>{})
    }catch{controls.title='当前浏览器无法播放音效'}
  }
  function cancel(){
    clearTimeout(timer)
    sequence++
    if(voice&&context){
      const old=voice;voice=null
      old.gain.gain.cancelScheduledValues(context.currentTime)
      old.gain.gain.setTargetAtTime(0,context.currentTime,.018)
      old.source.stop(context.currentTime+.09)
    }
  }
  async function buffer(name){
    if(!buffers.has(name)){
      const pending=fetch(`/audio/characters/${name}.wav?v=${name==='day-fourteen'?12:11}`)
        .then(response=>{if(!response.ok)throw new Error('Sound unavailable');return response.arrayBuffer()})
        .then(bytes=>context.decodeAudioData(bytes))
        .catch(error=>{buffers.delete(name);throw error})
      buffers.set(name,pending)
    }
    return buffers.get(name)
  }
  function schedule(id,delay=140){
    cancel()
    if(muted||disposed||document.hidden||!context)return
    const token=sequence,name=cues[id]
    if(!name)return
    timer=setTimeout(async()=>{
      try{
        const audio=await buffer(name)
        if(token!==sequence||muted||disposed||document.hidden||context.state!=='running')return
        const source=context.createBufferSource(),gain=context.createGain()
        source.buffer=audio;gain.gain.value=.3
        source.connect(gain);gain.connect(context.destination)
        const playing={source,gain};voice=playing
        source.onended=()=>{source.disconnect();gain.disconnect();if(voice===playing)voice=null}
        source.start()
        controls.title=''
      }catch{controls.title='音效暂时无法播放，请点击重播重试'}
    },delay)
  }
  replay.onclick=()=>{unlock();schedule(currentCharacter(),60)}
  toggle.onclick=()=>{
    muted=!muted
    if(muted)cancel();else unlock()
    try{localStorage.setItem('profile-sound-muted',String(muted))}catch{}
    update()
  }
  const onVisibility=()=>{if(document.hidden)cancel()}
  document.addEventListener('visibilitychange',onVisibility)
  update()
  return {unlock,cancel,schedule,destroy(){
    disposed=true;cancel();controls.remove()
    document.removeEventListener('visibilitychange',onVisibility)
    context?.close().catch(()=>{})
  }}
}
