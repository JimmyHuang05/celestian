export const fusionConcepts = [
  { name: '风景入文', english: 'IN THE SCENE', mood: '暗场消融 · 文字入景', description: '标题与纪事落在同一片光影里，画面的边缘消隐，整页成为一个连贯的场景。', layout: 'dusk', short: '入景' },
  { name: '风景透页', english: 'LANDSCAPE ON PAPER', mood: '纸面渗透 · 图文相融', description: '风景从纸面浮现，标题穿过图像边界，正文留在光线柔和的空白里。', layout: 'vellum', short: '透页' },
  { name: '交叠构图', english: 'THE OVERPRINT', mood: '破框标题 · 共用负空间', description: '标题跨在画框上，正文嵌进画面的缺口。三个模块共用一个轮廓。', layout: 'overprint', short: '交叠' },
  { name: '画中悬注', english: 'ANNOTATED LANDSCAPE', mood: '竖题 · 画中批注', description: '标题沿风景生长，细线把纪事牵回画中。切换批注，逐段阅读这个地方。', layout: 'marginalia', short: '悬注' },
  { name: '叙事长镜', english: 'ONE CONTINUOUS TAKE', mood: '同场转叙 · 动态融合', description: '先让画面与标题占据视野，再在同一镜头里展开文字。观看与阅读之间不切场。', layout: 'longtake', short: '长镜' },
];

export function createFusionTemplates({ e, scene, escapeHTML, num, index, intro, picture, photoSwitch, navigation, locator, readButton, icon }) {
  const header = label => '<header class="fusion-header"><span class="wordmark">CELESTIAN <i>/</i> '+label+'</span><span class="fusion-header-right">留影 · 奥兰尼亚</span></header>';
  const takeText = () => {
    const paragraphs=scene().paragraphs, middle=Math.ceil(paragraphs.length/2);
    return [paragraphs.slice(0,middle),paragraphs.slice(middle)].map(group=>'<div>'+group.map(p=>'<p>'+escapeHTML(p)+'</p>').join('')+'</div>').join('');
  };
  const footer = () => '<footer class="fusion-footer">'+locator()+navigation()+'</footer>';
  return [
    () => '<section class="concept fusion dusk">'+header('IN THE SCENE')+'<div class="dusk-world">'+picture('fusion-image')+'<div class="dusk-light" aria-hidden="true"></div><div class="dusk-ink"><header class="title-block dusk-title"><span class="eyebrow">'+e('english')+'</span><h1>'+e('name')+'</h1><p class="subtitle">'+e('subtitle')+'</p></header><article class="dusk-story"><div class="prose">'+intro()+'</div>'+readButton('读完这段风景')+'</article></div><div class="dusk-view">'+photoSwitch()+'</div><span class="dusk-number" aria-hidden="true">'+num(index()+1)+'</span></div>'+footer()+'</section>',
    () => '<section class="concept fusion vellum">'+header('LANDSCAPE ON PAPER')+'<div class="vellum-world">'+picture('vellum-image')+'<div class="vellum-wash" aria-hidden="true"></div><div class="vellum-ink"><header class="title-block vellum-title"><span class="eyebrow">PLACES / '+num(index()+1)+'</span><h1>'+e('name')+'</h1><p class="vellum-english">'+e('english')+'</p></header><article class="vellum-story"><p class="subtitle">'+e('subtitle')+'</p><div class="prose">'+intro()+'</div>'+readButton('翻开这段纪事')+'</article></div><div class="vellum-note"><span class="vellum-rule"></span>'+photoSwitch()+'<span class="eyebrow">A LANDSCAPE, REMEMBERED.</span></div></div>'+footer()+'</section>',
    () => '<section class="concept fusion overprint">'+header('THE OVERPRINT')+'<div class="overprint-world">'+picture('overprint-image')+'<header class="title-block overprint-title"><span class="eyebrow">'+e('english')+'</span><h1>'+e('name')+'</h1></header><div class="overprint-subtitle">'+e('subtitle')+'</div><article class="overprint-story"><span class="tiny-label">CHRONICLE / '+num(index()+1)+'</span><div class="prose">'+intro()+'</div>'+readButton()+'</article><div class="overprint-view">'+photoSwitch()+'</div><span class="overprint-edition" aria-hidden="true">VOL. I</span></div>'+footer()+'</section>',
    () => '<section class="concept fusion marginalia">'+header('ANNOTATED LANDSCAPE')+'<div class="margin-world">'+picture('margin-image')+'<div class="margin-shade" aria-hidden="true"></div><header class="title-block margin-title"><span class="eyebrow">'+e('english')+'</span><h1>'+e('name')+'</h1></header><article class="margin-story"><p class="subtitle">'+e('subtitle')+'</p><div class="note-steps" aria-label="选择纪事段落">'+scene().paragraphs.map((_,i)=>'<button data-note="'+i+'" aria-label="纪事第'+(i+1)+'段" aria-pressed="'+(i===0)+'">'+num(i+1)+'</button>').join('')+'</div><p id="note-copy" class="prose" aria-live="polite">'+escapeHTML(scene().paragraphs[0]||'')+'</p>'+readButton('展开全部纪事')+'</article><div class="margin-view">'+photoSwitch()+'</div></div>'+footer()+'</section>',
    () => '<section class="concept fusion longtake">'+header('ONE CONTINUOUS TAKE')+'<div class="take-world">'+picture('take-image')+'<div class="take-shade" aria-hidden="true"></div><header class="title-block take-title"><span class="eyebrow">'+e('english')+'</span><h1>'+e('name')+'</h1><p class="subtitle">'+e('subtitle')+'</p><button class="take-trigger" data-action="take" aria-expanded="false" aria-controls="take-details"><span>走进这里</span>'+icon('arrow')+'</button></header><article id="take-details" class="take-details" inert aria-hidden="true"><div class="take-copy prose">'+takeText()+'</div>'+readButton('完整阅读')+'</article><span class="take-side-label" aria-hidden="true">A MOMENT HELD IN TIME</span><div class="take-view">'+photoSwitch()+'</div></div>'+footer()+'</section>',
  ];
}

export function handleFusionAction(button, stage, scene) {
  if (button.dataset.note !== undefined) {
    const i=Number(button.dataset.note);
    const copy=stage.querySelector('#note-copy');
    if (copy && scene.paragraphs[i]) {
      copy.textContent=scene.paragraphs[i];
      stage.querySelectorAll('[data-note]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.note)===i)));
    }
    return true;
  }
  if (button.dataset.action === 'take') {
    const world=stage.querySelector('.take-world');
    const details=stage.querySelector('#take-details');
    const open=world.classList.toggle('story-open');
    button.setAttribute('aria-expanded',String(open));
    button.querySelector('span').textContent=open?'收起纪事':'走进这里';
    details.inert=!open;
    details.setAttribute('aria-hidden',String(!open));
    return true;
  }
  return false;
}
