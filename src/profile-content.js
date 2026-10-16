// Retain authored emphasis while discarding editor styles and executable markup.
export function richText(markup){
  const parsed=new DOMParser().parseFromString(String(markup||'').replace(/\\"/g,'"'),'text/html')
  function clean(node){
    if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.textContent)
    const fragment=document.createDocumentFragment()
    if(node.nodeType!==Node.ELEMENT_NODE)return fragment
    if(['SCRIPT','STYLE','IFRAME','OBJECT','TEMPLATE'].includes(node.tagName))return fragment
    const tags={B:'strong',STRONG:'strong',I:'em',EM:'em',BR:'br',FONT:'span',SPAN:'span'}
    const result=tags[node.tagName]?document.createElement(tags[node.tagName]):fragment
    if(['FONT','SPAN'].includes(node.tagName))result.className='lore-emphasis'
    for(const child of node.childNodes)result.append(clean(child))
    return result
  }
  const result=document.createDocumentFragment()
  for(const child of parsed.body.childNodes)result.append(clean(child))
  return result
}

export function plainText(value){
  return richText(value).textContent.replace(/\u00a0/g,' ').trim()
}


function highlightStoryTerms(root){
  const ranges=[...root.textContent.matchAll(/「[^「」]*」/g)]
    .map(match=>[match.index,match.index+match[0].length])
  if(!ranges.length)return
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
  const nodes=[]
  while(walker.nextNode())nodes.push(walker.currentNode)
  let offset=0
  for(const node of nodes){
    const text=node.textContent,start=offset
    offset+=text.length
    const fragment=document.createDocumentFragment()
    let cursor=0
    for(const [from,to] of ranges){
      const a=Math.max(0,from-start),b=Math.min(text.length,to-start)
      if(a>=b)continue
      fragment.append(document.createTextNode(text.slice(cursor,a)))
      const term=document.createElement('span')
      term.className='lore-emphasis'
      term.textContent=text.slice(a,b)
      fragment.append(term)
      cursor=b
    }
    if(!cursor)continue
    fragment.append(document.createTextNode(text.slice(cursor)))
    node.replaceWith(fragment)
  }
}

export function renderDossier(entry){
  const facts=document.querySelector('#facts')
  const story=document.querySelector('#story')
  facts.replaceChildren()
  story.replaceChildren()
  for(const block of entry.blocks){
    if(block.type==='key-value'&&block.key){
      const row=document.createElement('div')
      const label=document.createElement('dt')
      label.textContent=['名字','全名','姓名'].includes(block.key)?'姓名':plainText(block.key)
      const value=document.createElement('dd')
      value.append(richText(String(block.value||'').replace(/^(?:\s|&nbsp;)+/g,'')))
      row.append(label,value)
      facts.append(row)
    }else if(['paragraph','quote'].includes(block.type)&&plainText(block.content)){
      const text=plainText(block.content)
      const isQuote=block.type==='quote'||/^“[\s\S]*”$/.test(text)
      const paragraph=document.createElement('p')
      paragraph.append(richText(block.content))
      highlightStoryTerms(paragraph)
      if(isQuote){
        const quote=document.createElement('blockquote')
        quote.append(paragraph)
        if(block.author){const author=document.createElement('cite');author.textContent=`—— ${plainText(block.author)}`;quote.append(author)}
        story.append(quote)
      }else story.append(paragraph)
    }else if(block.type==='image'&&/^https?:\/\//.test(block.url||'')){
      const figure=document.createElement('figure')
      const image=document.createElement('img')
      image.src=block.url
      image.alt=plainText(block.caption)
      image.loading='lazy'
      figure.append(image)
      if(block.caption){const caption=document.createElement('figcaption');caption.textContent=plainText(block.caption);figure.append(caption)}
      story.append(figure)
    }
  }
  if(!story.children.length){const empty=document.createElement('p');empty.textContent='此人的故事，尚待记录。';story.append(empty)}
  story.scrollTop=0
}
