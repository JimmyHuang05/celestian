function animateDragonHead(svg){
 const paths=[...svg.querySelectorAll('path')];
 // Isolate the upper head and crown from the neck and detached flames.
 const ids=[2,4,6,7,8,9,10,15,19,22,26,27,29,30,34];
 const animations=[];
 for(const i of ids){const path=paths[i];let wrap=path.parentElement;
  if(!wrap.hasAttribute('data-head')){wrap=document.createElementNS('http://www.w3.org/2000/svg','g');wrap.dataset.head='1';path.before(wrap);wrap.append(path);}
  wrap.style.transformBox='view-box';wrap.style.transformOrigin='56% 57%';
  animations.push(wrap.animate([{transform:'rotate(0deg)'},{transform:'rotate(3deg)',offset:.42},{transform:'rotate(3deg)',offset:.58},{transform:'rotate(0deg)'}],{duration:1400,easing:'ease-in-out',iterations:1}));
 }
 return Promise.all(animations.map(a=>a.finished.catch(()=>{})));
}
function animateOuterStars(svg){
 const paths=[...svg.querySelectorAll('path')];
 return Promise.all([8,2,28].map((i,n)=>paths[i].animate([
  {opacity:1,filter:'brightness(1)'},
  {opacity:1,filter:'brightness(1.75)',offset:.45},
  {opacity:1,filter:'brightness(1)'}
 ],{duration:600,delay:n*180,easing:'ease-in-out',iterations:1}).finished.catch(()=>{})));
}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function play(card){if(card.dataset.busy||reduced.matches)return;card.dataset.busy='1';const svg=card.querySelector('svg[data-kind]'),kind=svg.dataset.kind;const animations=[];if(kind==='characters'){animateOuterStars(svg).then(()=>delete card.dataset.busy);return;}if(kind==='dragon'){animateDragonHead(svg).then(()=>delete card.dataset.busy);return;}
for(const g of svg.querySelectorAll('[data-part]')){const n=Number(g.dataset.part);g.style.transformBox='view-box';g.style.transformOrigin='50% 50%';let frames,delay=0,duration=1000;
if(kind==='dragon'){g.style.transformBox='fill-box';g.style.transformOrigin='50% 90%';frames=[{transform:'rotate(0deg)',opacity:1},{transform:'rotate(-4deg) translateY(-4px)',opacity:.7},{transform:'rotate(3deg) translateY(-7px)',opacity:1},{transform:'rotate(0deg)',opacity:1}];}
if(kind==='gallery'){frames=[{transform:'rotate(0deg) scale(1)'},{transform:'rotate(12deg) scale(.94)',offset:.4},{transform:'rotate(16deg) scale(.88)',offset:.48},{transform:'rotate(0deg) scale(1)'}];duration=750;}
if(kind==='factions'){const a=n*2*Math.PI/3;const x=Math.sin(a)*12,y=-Math.cos(a)*12;frames=[{transform:'translate(0px,0px)'},{transform:`translate(${x}px,${y}px)`,offset:.4},{transform:'translate(0px,0px)'}];delay=n*85;duration=800;}
if(kind==='characters'){frames=[{opacity:1},{opacity:.4,offset:.2},{opacity:1,filter:'brightness(1.65)',offset:.5},{opacity:1,filter:'brightness(1)'}];delay=n*130;duration=650;}
animations.push(g.animate(frames,{duration,delay,easing:'ease-in-out',iterations:1}));}
Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>delete card.dataset.busy);}

// Preserve the approved hover-open / leave-close behavior from the old site.
export function mountEmblemMotion(card) {
 const host=card.querySelector('.animated-emblem'),svg=host?.querySelector('svg');
 if(!svg)return;
 let motions=null,hovered=false,focused=false;
 function update(){
  if(reduced.matches)return;
  const expanded=hovered||focused;
  if(!motions){
   if(!expanded)return;
   play(host);
   motions=svg.getAnimations({subtree:true}).filter(a=>a.effect.target!==svg);
   for(const a of motions){
    const frames=a.effect.getKeyframes();
    const peak=frames.reduce((best,f,i)=>i>0&&i<frames.length-1&&f.computedOffset<=.5?i:best,1);
    const first={...frames[0]},last={...frames[peak]};
    for(const f of [first,last]){delete f.computedOffset;delete f.offset;}
    a.effect.setKeyframes([first,last]);
    a.effect.updateTiming({duration:450,delay:Math.min(a.effect.getTiming().delay||0,180),fill:'both',easing:'ease-in-out'});
    a.currentTime=0;
   }
  }
  for(const a of motions){a.playbackRate=expanded?1:-1;a.play();}
 }
 const enter=()=>{hovered=true;update()},leave=()=>{hovered=false;update()};
 const focus=()=>{focused=true;update()},blur=e=>{if(!card.contains(e.relatedTarget)){focused=false;update()}};
 card.addEventListener('pointerenter',enter);card.addEventListener('pointerleave',leave);
 card.addEventListener('focusin',focus);card.addEventListener('focusout',blur);
 return ()=>{
  card.removeEventListener('pointerenter',enter);card.removeEventListener('pointerleave',leave);
  card.removeEventListener('focusin',focus);card.removeEventListener('focusout',blur);
  for(const a of svg.getAnimations({subtree:true}))a.cancel();
 };
}

