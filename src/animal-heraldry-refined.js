const assetRoot='/imperial-knights/animal-heraldry-v3';
const groups={
  bear:{title:'熊 · 古林镇守',description:'宽肩、巨掌与厚重轮廓；金色浮雕与深绿盾底。'},
  lynx:{title:'猞猁 · 巡影缄密',description:'伏身、攀援、静听；以短尾、耳簇和收拢的身形表现机敏。'},
  wolf:{title:'狼 · 极境远征',description:'昂首、腾跃、狼首；长吻、长尾和舒展的轮廓指向远方。'},
  all:{title:'三兽九案 · 形与势',description:'每行一种动物，从左至右为 01、02、03。点击可查看细节。'},
};
const board=document.querySelector('#board');
const modal=document.querySelector('dialog');
let opener;
let variants=[];
function openDetail(item,button){
  opener=button;
  modal.classList.toggle('reference',item.reference===true);
  document.querySelector('#detail-group').textContent=item.reference?'工艺参照':groups[item.animal].title;
  document.querySelector('#detail-title').textContent=item.reference?item.name:`${item.code} · ${item.name}`;
  document.querySelector('#detail-description').textContent=item.subtitle;
  const image=document.querySelector('#detail-image');
  image.src=item.reference?item.src:`${item.assetBase||assetRoot}/${item.id}.png`;
  image.alt=item.name;
  const link=document.querySelector('#download');
  link.hidden=Boolean(item.reference);
  link.href=image.src;link.download=`${item.id}.png`;
  modal.showModal();
}
function render(group){
  document.body.classList.toggle('overview',group==='all');
  document.querySelector('#group-title').textContent=groups[group].title;
  document.querySelector('#group-description').textContent=groups[group].description;
  for(const button of document.querySelectorAll('[data-group]'))button.setAttribute('aria-pressed',String(button.dataset.group===group));
  board.replaceChildren();
  for(const item of variants.filter(item=>group==='all'||item.animal===group)){
    const card=document.createElement('figure');
    card.className='candidate';card.dataset.animal=item.animal;
    card.innerHTML=`<button class="art" type="button" aria-label="放大查看 ${item.code} ${item.name}"><span class="corner-code">${item.code}</span><img src="${item.assetBase||assetRoot}/${item.id}.webp" alt="${item.name}：${item.subtitle}" width="${item.width}" height="${item.height}"><span class="zoom-hint" aria-hidden="true">⊕</span></button><figcaption><span class="number">${item.code}</span><h3>${item.name}</h3><p>${item.subtitle}</p></figcaption>`;
    const button=card.querySelector('button');
    button.addEventListener('click',()=>openDetail(item,button));
    board.append(card);
  }
}
for(const button of document.querySelectorAll('[data-group]'))button.addEventListener('click',()=>render(button.dataset.group));
document.querySelector('.reference-button').addEventListener('click',function(){openDetail({reference:true,id:'lion-reference',name:'逐猎之狮',subtitle:'参照盾徽的浮雕层次、金属光泽与饱满构图。',src:'/imperial-knights/pursuing-lion-v1/03-reguardant.webp'},this);});
document.querySelector('.close').addEventListener('click',()=>modal.close());
modal.addEventListener('close',()=>opener?.focus());
modal.addEventListener('click',event=>{if(event.target!==modal)return;const rect=modal.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)modal.close();});
try{
  const response=await fetch(`${assetRoot}/manifest.json`);
  if(!response.ok)throw new Error('纹章图集加载失败');
  variants=await response.json();
  render('all');
}catch(error){board.textContent=`图集暂未加载成功，请刷新页面。${error.message}`;}
