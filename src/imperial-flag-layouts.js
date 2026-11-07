const descriptions = {
  depth: '01 · 双头鹰旗完整居前，两翼逐级缩小并上移；约露出 3/5，形成仪仗队般的纵深。',
  equal: '02 · 五旗等高、完整并列，彼此不遮挡，强调同盟的平等关系。',
  arch: '03 · 中央旗高挂，两侧依次降低，形成宫廷悬旗的拱形轮廓。',
  fan: '04 · 中央竖直，两侧向外倾斜 4°、8°，呈现更鲜明的战阵感。',
  layers: '05 · 双头鹰、狮旗与狼旗在前，熊旗与猞猁旗从后方露出，形成三前两后的层次。',
}
const frame = document.querySelector('#layout-preview')
const buttons = [...document.querySelectorAll('[data-layout]')]
let selected = descriptions[location.hash.slice(1)] ? location.hash.slice(1) : 'depth'

// Preview overrides live only inside this comparison's iframe.
const previewStyle = `
.faction-banner-group img{height:auto;object-fit:contain;transform:translate(-50%,-9%);transform-origin:50% 9%}
.faction-banner-group[data-arrangement="depth"] img:nth-child(1){left:17.8%;width:27%;top:6%;z-index:1}
.faction-banner-group[data-arrangement="depth"] img:nth-child(2){left:32.7%;width:31%;top:10%;z-index:2}
.faction-banner-group[data-arrangement="depth"] img:nth-child(3){left:50%;width:36%;top:14%;z-index:3}
.faction-banner-group[data-arrangement="depth"] img:nth-child(4){left:67.3%;width:31%;top:10%;z-index:2}
.faction-banner-group[data-arrangement="depth"] img:nth-child(5){left:82.2%;width:27%;top:6%;z-index:1}
.faction-banner-group[data-arrangement="equal"] img{width:auto;height:52%;top:23%;z-index:1}
.faction-banner-group[data-arrangement="equal"] img:nth-child(1){left:10%}
.faction-banner-group[data-arrangement="equal"] img:nth-child(2){left:30%}
.faction-banner-group[data-arrangement="equal"] img:nth-child(3){left:50%}
.faction-banner-group[data-arrangement="equal"] img:nth-child(4){left:70%}
.faction-banner-group[data-arrangement="equal"] img:nth-child(5){left:90%}
.faction-banner-group[data-arrangement="arch"] img:nth-child(1){left:17.8%;width:27%;top:24%;z-index:1}
.faction-banner-group[data-arrangement="arch"] img:nth-child(2){left:32.7%;width:31%;top:15%;z-index:2}
.faction-banner-group[data-arrangement="arch"] img:nth-child(3){left:50%;width:36%;top:6%;z-index:3}
.faction-banner-group[data-arrangement="arch"] img:nth-child(4){left:67.3%;width:31%;top:15%;z-index:2}
.faction-banner-group[data-arrangement="arch"] img:nth-child(5){left:82.2%;width:27%;top:24%;z-index:1}
.faction-banner-group[data-arrangement="fan"] img:nth-child(1){left:24%;width:25%;top:12%;z-index:1;transform:translate(-50%,-9%) rotate(8deg)}
.faction-banner-group[data-arrangement="fan"] img:nth-child(2){left:36%;width:30%;top:10%;z-index:2;transform:translate(-50%,-9%) rotate(4deg)}
.faction-banner-group[data-arrangement="fan"] img:nth-child(3){left:50%;width:36%;top:8%;z-index:3}
.faction-banner-group[data-arrangement="fan"] img:nth-child(4){left:64%;width:30%;top:10%;z-index:2;transform:translate(-50%,-9%) rotate(-4deg)}
.faction-banner-group[data-arrangement="fan"] img:nth-child(5){left:76%;width:25%;top:12%;z-index:1;transform:translate(-50%,-9%) rotate(-8deg)}
.faction-banner-group[data-arrangement="layers"] img:nth-child(1){left:20%;width:29%;top:23%;z-index:3}
.faction-banner-group[data-arrangement="layers"] img:nth-child(2){left:35%;width:29%;top:6%;z-index:1}
.faction-banner-group[data-arrangement="layers"] img:nth-child(3){left:50%;width:34%;top:23%;z-index:4}
.faction-banner-group[data-arrangement="layers"] img:nth-child(4){left:65%;width:29%;top:6%;z-index:1}
.faction-banner-group[data-arrangement="layers"] img:nth-child(5){left:80%;width:29%;top:23%;z-index:3}
.faction-archive .page-action--close{display:none}
`
function applyLayout() {
  const documentInFrame = frame.contentDocument
  if (!documentInFrame) return
  if (!documentInFrame.querySelector('#arrangement-preview-style')) {
    const style = documentInFrame.createElement('style')
    style.id = 'arrangement-preview-style'
    style.textContent = previewStyle
    documentInFrame.head.append(style)
  }
  const group = documentInFrame.querySelector('.faction-banner-group')
  if (group) group.dataset.arrangement = selected
}
function selectLayout(value) {
  selected = value
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layout === selected)))
  buttons.find(button => button.dataset.layout === selected)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  document.querySelector('#layout-description').textContent = descriptions[selected]
  history.replaceState(null, '', '#' + selected)
  applyLayout()
}
buttons.forEach(button => button.addEventListener('click', () => selectLayout(button.dataset.layout)))
frame.addEventListener('load', () => {
  applyLayout()
  if (frame.contentDocument.querySelector('.faction-banner-group')) return
  // The template may finish its data request after the iframe load event.
  const observer = new MutationObserver(() => {
    applyLayout()
    if (frame.contentDocument.querySelector('.faction-banner-group')) observer.disconnect()
  })
  observer.observe(frame.contentDocument.body, { childList: true, subtree: true })
})
window.addEventListener('hashchange', () => {
  const value = location.hash.slice(1)
  if (descriptions[value]) selectLayout(value)
})
selectLayout(selected)
