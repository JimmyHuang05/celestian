// An original ornamental SVG frame: cast metal, carved acanthus, and inset gems.
// The central illustration is supplied separately so character portraits can replace it.
export function renderTarotCard(entry, index, illustration) {
  const p = `tarot-${index}`
  const gold = `url(#${p}-gold)`, darkGold = `url(#${p}-bronze)`
  const edge = `url(#${p}-edge)`, jewel = `url(#${p}-gem)`
  const window = 'M41 322V104C41 78 57 68 78 65Q110 62 130 48Q150 62 182 65C203 68 219 78 219 104V322Q218 338 202 341H58Q42 338 41 322Z'
  const body = 'M25 322V99Q24 62 61 50Q108 44 130 25Q152 44 199 50Q236 62 235 99V322Q234 354 205 358H55Q26 354 25 322Z'
  const leaf = (x,y,angle,scale=1) => `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})"><path d="M0 0C-13 -3 -19 -18 -12 -31C-13 -19 -2 -21 -3 -36C7 -26 3 -21 9 -18C17 -25 17 -30 15 -34C25 -21 17 -6 0 0Z" fill="${gold}" stroke="#594324" stroke-width=".55"/><path d="M0 -2Q-1 -16 5 -28M0 -7Q-9 -12 -11 -22M1 -14L12 -20M-1 -4L-12 -12" fill="none" stroke="#e8c98d" stroke-width=".6" opacity=".75"/><path d="M1 -3Q3 -14 6 -23" fill="none" stroke="#4f371c" stroke-width="1" opacity=".8"/></g>`
  const corner = `<g>
    <path d="M32 111C8 99 2 69 18 51C28 41 39 46 37 56C35 67 22 65 23 58C14 65 20 81 31 81C43 80 47 63 41 53C34 39 20 38 15 42C25 21 46 32 53 42C61 30 78 27 92 32C73 35 66 42 69 49C77 56 88 45 93 36C96 56 84 70 67 64C47 56 38 70 41 88L32 111Z" fill="${gold}" stroke="#503a20" stroke-width=".9"/>
    <path d="M32 104C14 93 11 71 19 58M24 50Q35 47 32 56M45 44Q54 59 43 72M52 49Q67 31 82 35M63 57Q82 64 89 46" fill="none" stroke="#f2d29a" stroke-width="1" opacity=".8"/>
    <path d="M33 98Q25 88 25 77M43 58Q45 66 39 75M60 48Q72 47 77 40" fill="none" stroke="#51391f" stroke-width="1.2"/>
    ${leaf(49,53,-52,.62)}${leaf(25,72,-34,.65)}${leaf(69,46,74,.52)}
    <path d="M13 61Q-2 51 8 37Q13 30 20 35Q25 41 19 43Q14 43 14 39M57 39Q51 25 59 19Q64 16 69 20" fill="none" stroke="${edge}" stroke-width="2"/>
    <path d="M32 83L41 92L32 105L23 92Z" fill="${darkGold}" stroke="#c1a06b" stroke-width=".8"/><path d="M32 87L37 93L32 101L27 93Z" fill="${jewel}" stroke="#e1bf82" stroke-width=".5"/>
  </g>`
  const side = `<g>
    <path d="M27 101C36 127 12 144 19 169C23 185 32 194 26 214C22 228 17 245 28 263C34 277 28 299 22 311" fill="none" stroke="#49341d" stroke-width="5.5"/>
    <path d="M27 101C36 127 12 144 19 169C23 185 32 194 26 214C22 228 17 245 28 263C34 277 28 299 22 311" fill="none" stroke="${gold}" stroke-width="3.4"/>
    ${leaf(23,142,-22,.58)}${leaf(25,181,155,.47)}${leaf(25,222,-28,.53)}${leaf(28,264,154,.52)}${leaf(24,300,-25,.48)}
    <path d="M22 148C5 151 2 169 12 175C22 179 26 168 19 164M23 236C6 232 1 249 11 255C18 260 26 252 21 246" fill="none" stroke="${gold}" stroke-width="1.6"/>
    <path d="M17 182Q8 187 13 196Q18 200 24 193M19 257Q10 265 15 272" fill="none" stroke="#e3c18a" stroke-width=".65"/>
    <path d="M23 185L32 202L23 220L13 202Z" fill="${darkGold}" stroke="#a88a54"/><path d="M23 193L28 202L23 212L18 202Z" fill="${jewel}" stroke="#dfbe86" stroke-width=".7"/>
    <circle cx="23" cy="185" r="1.6" fill="#e2c794"/><circle cx="23" cy="220" r="1.6" fill="#bfa372"/>
  </g>`
  const lower = `<g transform="translate(0 0)">
    <path d="M27 292C10 297 2 310 9 325C13 334 24 335 27 326C30 318 20 315 17 322C11 315 17 303 26 308C39 316 32 337 47 345C58 352 71 346 73 339C80 356 60 371 44 362C32 355 29 344 17 347C5 350 4 360 10 366C-5 362 -3 344 10 339C-2 324 0 302 12 295Z" fill="${gold}" stroke="#563c22" stroke-width=".8"/>
    <path d="M21 300Q6 309 13 322M32 330Q39 350 56 354Q67 355 69 348M10 344Q22 340 29 350" fill="none" stroke="#e2c58f" stroke-width="1"/>
    ${leaf(42,347,-55,.69)}${leaf(22,336,135,.53)}
  </g>`
  return `<svg viewBox="0 -14 260 430" class="tarot-card" aria-hidden="true"><defs>
    <linearGradient id="${p}-gold" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#574024"/><stop offset=".18" stop-color="#b9995e"/><stop offset=".32" stop-color="#e3c793"/><stop offset=".47" stop-color="#9b7844"/><stop offset=".64" stop-color="#6c4e2b"/><stop offset=".8" stop-color="#c2a06a"/><stop offset="1" stop-color="#81603a"/></linearGradient>
    <linearGradient id="${p}-bronze" x2="1" y2="1"><stop stop-color="#a0804c"/><stop offset=".3" stop-color="#342a24"/><stop offset=".7" stop-color="#55412c"/><stop offset="1" stop-color="#b28f53"/></linearGradient>
    <linearGradient id="${p}-edge" x2="1" y2="1"><stop stop-color="#e6c98f"/><stop offset=".5" stop-color="#7a5e35"/><stop offset="1" stop-color="#d0b07a"/></linearGradient>
    <radialGradient id="${p}-gem" cx="28%" cy="20%"><stop stop-color="#f0e5d8"/><stop offset=".17" stop-color="${entry.color}"/><stop offset=".6" stop-color="${entry.deep}"/><stop offset="1" stop-color="#070d18"/></radialGradient>
    <radialGradient id="${p}-sky" cx="50%" cy="36%" r="70%"><stop stop-color="${entry.color}" stop-opacity=".28"/><stop offset=".55" stop-color="${entry.deep}"/><stop offset="1" stop-color="#080e19"/></radialGradient>
    <radialGradient id="${p}-aura"><stop stop-color="${entry.color}" stop-opacity=".18"/><stop offset="1" stop-color="${entry.color}" stop-opacity="0"/></radialGradient>
    <clipPath id="${p}-window"><path d="${window}"/></clipPath>
  </defs>
  <ellipse class="aura" cx="130" cy="193" rx="175" ry="223" fill="url(#${p}-aura)"/>
  <path d="${body}" transform="translate(0 3)" fill="#04070e" stroke="#04070e" stroke-width="8"/>
  <path d="${body}" fill="${darkGold}" stroke="${edge}" stroke-width="1.3"/>
  <path d="M32 322V103Q32 68 66 57Q109 50 130 34Q151 50 194 57Q228 68 228 103V322Q227 347 203 350H57Q33 347 32 322Z" fill="#131922" stroke="${gold}" stroke-width="3.2"/>
  <path d="${window}" fill="url(#${p}-sky)" stroke="#b09361" stroke-width="1"/>
  <g clip-path="url(#${p}-window)">
    ${Array.from({length:55},(_,j)=>`<circle cx="${48+j*43%164}" cy="${86+j*67%235}" r="${j%8===0?.8:.35}" fill="#c7b694" opacity="${.1+j%5*.065}"/>`).join('')}
    <g fill="none" stroke="#bea477" opacity=".13" stroke-width=".6"><circle cx="130" cy="185" r="79"/><circle cx="130" cy="185" r="75" stroke-dasharray="1 6"/><path d="M52 185H208M130 106V264"/></g>
    <g transform="translate(0 5)">${illustration}</g>
    <path d="M40 312Q130 280 220 312V345H40Z" fill="#080d18" opacity=".5"/>
  </g>
  <g fill="none" stroke="${edge}" stroke-width=".65"><path d="M45 312V104Q45 82 65 74M215 312V104Q215 82 195 74"/>${Array.from({length:29},(_,j)=>`<path d="M35 ${111+j*6.5}h3M222 ${111+j*6.5}h3" opacity=".6"/>`).join('')}</g>
  ${side}<g transform="translate(260 0) scale(-1 1)">${side}</g>
  ${corner}<g transform="translate(260 0) scale(-1 1)">${corner}</g>
  ${lower}<g transform="translate(260 0) scale(-1 1)">${lower}</g>
  <g class="tarot-crown">
    <path d="M83 42Q101 37 106 20L115 31L119 13L130 -4L141 13L145 31L154 20Q159 37 177 42L161 53H99Z" fill="${gold}" stroke="#503a23"/>
    <path d="M93 43Q106 42 112 33L118 39L124 17L130 6L136 17L142 39L148 33Q154 42 167 43" fill="none" stroke="#f0d29b" stroke-width=".8"/>
    <path d="M115 38L130 13L145 38L130 58Z" fill="${darkGold}" stroke="#dfbb7d" stroke-width="1.2"/>
    <path d="M121 37L130 22L139 37L130 49Z" fill="${jewel}" stroke="#e7c38b" stroke-width=".6"/>
    <path d="M130 22V49L121 37L139 37Z" fill="#e5d3f3" opacity=".12"/>
    ${leaf(101,42,-65,.52)}<g transform="translate(260 0) scale(-1 1)">${leaf(101,42,-65,.52)}</g>
    <circle cx="130" cy="-5" r="2.1" fill="#dfc28a"/>
  </g>
  <g fill="none" stroke="#c4a272" stroke-width=".7"><path d="M92 64Q130 89 168 64"/>${Array.from({length:11},(_,j)=>{const x=95+j*7,y=65+12*Math.sin(j/10*Math.PI);return `<circle cx="${x}" cy="${y}" r="1.1" fill="#cab182"/>`}).join('')}</g>
  <text x="130" y="95" text-anchor="middle" font-family="Cinzel,serif" font-size="7" letter-spacing="2.5" fill="#c4ad88">${entry.sign}</text>
  <g class="tarot-nameplate">
    <path d="M39 334L52 330L45 354L25 361L32 347L25 338Z" fill="${darkGold}" stroke="#b28d58" stroke-width=".7"/>
    <path d="M221 334L208 330L215 354L235 361L228 347L235 338Z" fill="${darkGold}" stroke="#b28d58" stroke-width=".7"/>
    <path d="M49 326Q130 312 211 326L203 356Q130 365 57 356Z" fill="${gold}" stroke="#4f391f" stroke-width="1.2"/>
    <path d="M58 331Q130 320 202 331L196 350Q130 360 64 350Z" fill="#151821" stroke="#d4b985" stroke-width=".7"/>
    <path d="M60 328Q130 318 200 328M61 354Q130 363 199 354" fill="none" stroke="#eed09c" stroke-width=".6"/>
    <text x="130" y="346" text-anchor="middle" font-family="Noto Serif SC,serif" font-size="14" letter-spacing="6" fill="#e8d8b7">${entry.name}</text>
  </g>
  <g fill="none" stroke="${gold}" stroke-width="2"><path d="M66 363C78 382 111 365 130 383C149 365 182 382 194 363M92 369Q99 389 116 378M168 369Q161 389 144 378"/></g>
  <path d="M130 369Q145 381 130 403Q115 381 130 369Z" fill="${gold}" stroke="#513b22"/>
  <path d="M130 377L135 385L130 395L125 385Z" fill="${jewel}" stroke="#d6b983" stroke-width=".6"/>
  <path class="focus-ring" d="${body}" fill="none" stroke="#f1d6a4" stroke-width="1.5"/>
  </svg>`
}
