const assetRoot='/imperial-knights/animal-heraldry-v2';
const groups={
  bear:{title:'熊 · 古林与堡垒',description:'厚重的轮廓、圆耳与钝吻，以古典纹章姿态表现山地守卫。'},
  lynx:{title:'猞猁 · 巡影与缄密',description:'耳簇、短尾与夸张的大爪，三种姿态表现侦察、潜行与情报。'},
  wolf:{title:'狼 · 远征与朔风',description:'长吻、瘦长躯干和舒展的步态，以银狼与星辰呼应远征。'},
  all:{title:'三兽九案 · 姿态与轮廓',description:'每组从左至右为 01、02、03；点击任意方案可查看透明原图。'},
};
const variants=await fetch(`${assetRoot}/manifest.json`).then(response=>{if(!response.ok)throw new Error('无法加载纹章候选');return response.json();});
const board=document.querySelector('#board');
const modal=document.querySelector('dialog');
let opener;
const shield=`<svg class="shield" viewBox="0 0 500 610" preserveAspectRatio="none" aria-hidden="true"><path class="edge" d="M250 10Q145 53 15 37L22 350Q30 494 250 600Q470 494 478 350L485 37Q355 53 250 10Z"/><path class="field" d="M250 22Q145 63 27 50L34 350Q42 484 250 586Q458 484 466 350L473 50Q355 63 250 22Z"/><path class="inner" d="M250 32Q145 72 37 61L44 350Q52 478 250 574Q448 478 456 350L463 61Q355 72 250 32Z"/></svg>`;
function render(group){
  document.body.classList.toggle('overview',group==='all');
  document.querySelector('#group-title').textContent=groups[group].title;
  document.querySelector('#group-description').textContent=groups[group].description;
  for(const button of document.querySelectorAll('[data-group]'))button.setAttribute('aria-pressed',String(button.dataset.group===group));
  board.replaceChildren();
  for(const item of variants.filter(item=>group==='all'||item.animal===group)){
    const card=document.createElement('figure');card.className='candidate';card.dataset.animal=item.animal;
    card.innerHTML=`<button class="art" type="button" aria-label="放大查看 ${item.code} ${item.name}">${shield}<span class="corner-code">${item.code}</span><img src="${assetRoot}/${item.id}.webp" alt="${item.name}：${item.subtitle}" width="1024" height="1024"><span class="zoom-hint" aria-hidden="true">⊕</span></button><figcaption><span class="number">${item.code}</span><h3>${item.name}</h3><p>${item.subtitle}</p></figcaption>`;
    const button=card.querySelector('button');
    button.addEventListener('click',()=>{
      opener=button;modal.dataset.animal=item.animal;
      document.querySelector('#detail-group').textContent=groups[item.animal].title;
      document.querySelector('#detail-title').textContent=`${item.code} · ${item.name}`;
      document.querySelector('#detail-description').textContent=item.subtitle;
      const image=document.querySelector('#detail-image');image.src=`${assetRoot}/${item.id}.png`;image.alt=`${item.name}透明原图`;
      const link=document.querySelector('#download');link.href=image.src;link.download=`${item.id}.png`;
      modal.showModal();
    });
    board.append(card);
  }
}
for(const button of document.querySelectorAll('[data-group]'))button.addEventListener('click',()=>render(button.dataset.group));
document.querySelector('.field-toggle').addEventListener('click',function(){const plain=document.body.classList.toggle('plain');this.setAttribute('aria-pressed',String(!plain));this.textContent=plain?'查看盾底':'查看素底';});
document.querySelector('.close').addEventListener('click',()=>modal.close());
modal.addEventListener('close',()=>opener?.focus());
modal.addEventListener('click',event=>{if(event.target!==modal)return;const rect=modal.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)modal.close();});
render('bear');
