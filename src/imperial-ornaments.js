// Reusable vector fittings for the five knightly standards.
import { BANNER, tailEdges, fringeRoots } from './imperial-banner-shape.js';
export const ornamentDefs = `
<linearGradient id="SILVER" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eee9d9"/><stop offset=".28" stop-color="#9e9b8e"/><stop offset=".55" stop-color="#f7f1db"/><stop offset=".8" stop-color="#a9a18b"/><stop offset="1" stop-color="#d7d0bb"/></linearGradient>
<linearGradient id="BRONZE"><stop stop-color="#5a4528"/><stop offset=".35" stop-color="#baa070"/><stop offset=".52" stop-color="#ebd8a0"/><stop offset=".72" stop-color="#b0935e"/><stop offset="1" stop-color="#635039"/></linearGradient>
<pattern id="BRAID" width="6" height="12" patternUnits="userSpaceOnUse"><rect width="6" height="12" fill="#665030"/><path d="M0-3 6 3 0 9 6 15M6-3 0 3 6 9 0 15" stroke="#e0c891" stroke-width="1.15" fill="none"/><path d="M0-1 6 5M0 11 6 17" stroke="#fff1c9" stroke-width=".35" opacity=".6"/></pattern>
<g id="ROSETTE"><circle r="5.5" fill="url(#BRONZE)" stroke="#3e3524" stroke-width=".65"/><path d="M0-4V4M-4 0H4M-2.8-2.8 2.8 2.8M2.8-2.8-2.8 2.8" stroke="#f1dfb0" stroke-width=".7"/><circle r="1.6" fill="#c6a867" stroke="#f5e2b6" stroke-width=".6"/></g>
<g id="LEAFSCROLL" fill="url(#GOLD)" stroke="#625033" stroke-width=".45">
 <path d="M0-44C-16-58-26-42-20-32C-17-25-9-28-11-34C-12-38-17-38-17-33C-21-45-10-48-5-38C-1-30-8-24-13-18C-23-8-27 5-21 18C-29 9-34 1-30-9C-39 2-34 18-23 26C-13 34-10 43-16 52C-4 49-2 40-8 30C-20 14-13 2-7-4C-11 5-9 13-2 16C-7 4 2-4 4-15C8-28 2-35 0-44Z"/>
 <path d="M-19-10C-36-25-34-39-28-43C-44-34-40-18-28-11C-36-13-41-8-42-3C-33-6-28 2-26 9Z"/>
 <path d="M-15 25C-26 29-31 25-35 19C-34 36-21 42-13 36L-12 40C-25 50-21 60-15 64C-20 52-4 52-4 43Z"/>
 <path d="M-6-42C-2-31-10-18-17-6C-26 10-19 25-12 36" stroke="#f4e1a9" stroke-width=".8" fill="none"/>
</g>
<g id="CORNER" fill="none" stroke="url(#GOLD)" stroke-width=".8"><path d="M0 33V0H34M4 26V4H27M8 18C28 15 17-6 11 6C6 16 17 24 28 20M4 32C14 30 22 28 25 17"/><path d="M9 16C12 7 20 8 20 8C18 17 9 16 9 16ZM22 24C24 14 31 12 31 12C31 22 22 24 22 24Z" fill="url(#GOLD)" stroke="none"/><circle cx="4" cy="4" r="1.6" fill="url(#SILVER)"/></g>`;

export function bannerBorder(bottom, notch) {
 // Dense overlock stitches follow the perimeter, including both sloping tail edges.
 const points=[[24.7,78],[24.7,bottom-.9],[110-BANNER.shoulder,notch],[110,notch+BANNER.tongue],[110+BANNER.shoulder,notch],[195.3,bottom-.9],[195.3,78]];
 const outline=points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join('');
 const stitches=['',''];
 let count=0;
 for(let segment=0;segment<points.length-1;segment++){
   const [x,y]=points[segment], [endX,endY]=points[segment+1];
   const length=Math.hypot(endX-x,endY-y);
   const tx=(endX-x)/length,ty=(endY-y)/length,nx=ty,ny=-tx;
   for(let s=.25;s<length;s+=.86){
     const point=(across,along)=>`${(x+tx*(s+along)+nx*across).toFixed(2)} ${(y+ty*(s+along)+ny*across).toFixed(2)}`;
     stitches[count++%2]+=`M${point(-.95,-.23)}C${point(-.5,-.45)} ${point(.58,.04)} ${point(.97,.28)}`;
   }
 }
 return `<g class="banner-embroidery" pointer-events="none">
 <g data-textile-binding="true" fill="none" stroke-linejoin="round" stroke-linecap="round">
 <path d="${outline}" stroke="#635c49" stroke-width="2.7" opacity=".25"/>
 <path d="${outline}" stroke="#a99d81" stroke-width="2.05"/>
 <path d="${stitches[0]}" stroke="#ddd3ba" stroke-width=".36"/>
 <path d="${stitches[1]}" stroke="#c2b496" stroke-width=".36"/>
 <path d="${outline}" stroke="#e8dfc8" stroke-width=".18" opacity=".42"/>
 </g>
 ${lowerHem()}
 ${tasselFallback(bottom)}
 </g>`;
}

function lowerHem() {
 const edges=tailEdges.map(([a,b])=>`M${a.join(' ')}L${b.join(' ')}`).join('');
 const knots=fringeRoots.map(([x,y])=>`M${(x-.5).toFixed(2)} ${(y-.45).toFixed(2)}l1 .9`).join('');
 const fibres=fringeRoots.map(([x,y],i)=>`<path d="M${x} ${y}q.15 3.5 ${.3*Math.sin(i)} ${7.2+.6*Math.sin(i*2.7)}" stroke="${i%3?'#c3a164':'#e4ce94'}"/>`).join('');
 return `<g class="lower-hem" fill="none" stroke-linecap="round">
 <g class="svg-hem-fringe" stroke-width=".4">${fibres}</g>
 <path d="${edges}" stroke="#604b2c" stroke-width="2.6"/>
 <path d="${edges}" stroke="url(#GOLD)" stroke-width="2.1"/>
 <path d="${knots}" stroke="#f1dba0" stroke-width=".45"/>
 <path d="${edges}" stroke="#a2834c" stroke-width=".35"/>
 </g>`;
}

function tasselFallback(bottom) {
 return [25,195].map(x=>`<g class="svg-tassel" transform="translate(${x} ${bottom})">
 <path d="M0-.8V4" stroke="#b8a075" stroke-width=".65"/>
 <ellipse cy="5" rx="2.15" ry="1.85" fill="#bda576"/>
 <path d="M-1.8 4H1.8M-2.1 5H2.1M-2.1 6.4H2.1" stroke="#e3cea1" stroke-width=".4"/>
 <g fill="none" stroke-linecap="round">${Array.from({length:33},(_,i)=>{
   const start=(i-16)*.12, end=(i-16)*.14, length=23+Math.sin(i*7.3)*1.1;
   return `<path d="M${start} 6.5Q${end-.25} 14 ${end} ${length}" stroke="${['#dcc798','#b6a078','#cbb88c'][i%3]}" stroke-width=".24"/>`;
 }).join('')}</g></g>`).join('');
}

export function shieldSurround(center, imperial) {
 const chain=Array.from({length:19},(_,i)=>{
   const t=Math.PI*.07+i*Math.PI*.86/18;
   const x=110+61*Math.cos(t),y=center+27+88*Math.sin(t);
   const angle=Math.atan2(88*Math.cos(t),-61*Math.sin(t))*180/Math.PI;
   return `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="3.6" ry="2" transform="rotate(${angle.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})" fill="none" stroke="url(#${i%2?'SILVER':'GOLD'})" stroke-width="1.15"/>`;
 }).join('');
 return `<g class="shield-surround" pointer-events="none">
 <use href="#LEAFSCROLL" transform="translate(61 ${center+5}) scale(.63 ${imperial?1.05:'.94'})"/>
 <use href="#LEAFSCROLL" transform="translate(159 ${center+5}) scale(-.63 ${imperial?1.05:'.94'})"/>
 ${imperial?`<g>${chain}</g><g transform="translate(110 ${center+126})"><path d="M-4-12H4L3-4 10-5V3L3 2 4 10H-4L-3 2-10 3V-5L-3-4Z" fill="url(#GOLD)" stroke="#735d36" stroke-width=".6"/><circle cy="-1" r="2.3" fill="#4c2521" stroke="#ead29a" stroke-width=".7"/></g>`:`<path d="M78 ${center+81}Q110 ${center+109} 142 ${center+81}" stroke="url(#GOLD)" stroke-width="1" fill="none"/><use href="#ROSETTE" transform="translate(110 ${center+106}) scale(.7)"/>`}
 </g>`;
}

export function crown(center, imperial) {
 if(!imperial)return `<g transform="translate(110 ${center-63})"><path d="M-23 6Q-11-7 0-3Q11-7 23 6M-17 2Q-12-13-5-6M17 2Q12-13 5-6" fill="none" stroke="url(#GOLD)" stroke-width="1"/><use href="#ROSETTE" transform="scale(.75)"/><path d="M0-14 3-8 0-3-3-8Z" fill="url(#GOLD)"/></g>`;
 return `<g transform="translate(110 ${center-66})" stroke="#725632" stroke-width=".55">
 <path d="M-22 9-28-9-16-2-14-15-4-5 0-22 4-5 14-15 16-2 28-9 22 9Z" fill="url(#GOLD)"/>
 <path d="M-18 1Q-14-16 0-17Q14-16 18 1" fill="none" stroke="url(#SILVER)" stroke-width="2"/>
 <path d="M-23 7Q0 12 23 7L22 14Q0 18-22 14Z" fill="url(#BRONZE)"/>
 <path d="M-22 9Q0 14 22 9M-21 13Q0 17 21 13" stroke="#f1dfac" fill="none"/>
 <path d="M0-31V-23M-4-27H4" fill="none" stroke="url(#GOLD)" stroke-width="2"/>
 <circle cy="-21" r="2.5" fill="url(#SILVER)"/>
 ${[-27,-14,0,14,27].map((x,i)=>`<circle cx="${x}" cy="${[-10,-16,-22,-16,-10][i]}" r="1.7" fill="#f5ebd0"/>`).join('')}
 <path d="M0 9 3 12 0 15-3 12Z" fill="#73382b"/><circle cx="-13" cy="11" r="1.4" fill="#e9dfc5"/><circle cx="13" cy="11" r="1.4" fill="#e9dfc5"/>
 </g>`;
}

export function finial(center, notch, imperial) {
 const y=(center+112+notch-18)/2;
 return `<g transform="translate(110 ${y}) scale(${imperial?'.85':'.45'})" opacity="${imperial?'.92':'.75'}" fill="none" stroke="url(#GOLD)" stroke-width=".8">
 <path d="M0-23V26M0-10C-22-31-26-5-12-7C-5-8-10-18-15-12M0-10C22-31 26-5 12-7C5-8 10-18 15-12M0 10C-18-1-25 17-12 16M0 10C18-1 25 17 12 16M-12 19Q0 27 12 19"/>
 <path d="M0-27 3-20 0-14-3-20ZM0 22 4 29 0 39-4 29Z" fill="url(#GOLD)" stroke="none"/>
 <circle r="2.1" fill="url(#SILVER)"/>
 </g>`;
}

export function headerFitting(field = '#262928') {
 // Embroidered velvet heading with a small jewelled clasp, supported by a concealed rod.
 const scroll = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
 <path d="M17 0C25-7 34-5 34 0C34 5 25 6 24 2C23-2 29-4 30 0M34 0C43-7 52-5 52 0C52 5 43 6 42 2C41-2 47-4 48 0M52 0C61-7 70-5 70 0C70 5 61 6 60 2C59-2 65-4 66 0" stroke="#aa8b50" stroke-width=".85"/>
 <path d="M18-.4Q26-7 32-2M36-.4Q44-7 50-2M54-.4Q62-7 68-2" stroke="#e3ce91" stroke-width=".38"/>
 <g fill="#bea16a" stroke="#e0c993" stroke-width=".22">
 <path d="M22-2Q18-6 16-4Q17 0 22-2ZM35-1Q35-7 39-6Q40-2 35-1ZM40 2Q35 7 33 4Q35 1 40 2ZM53-1Q53-7 57-6Q58-2 53-1ZM58 2Q53 7 51 4Q53 1 58 2ZM71-1Q71-7 75-6Q76-2 71-1Z"/>
 </g><path d="M20 5H73" stroke="#a48a55" stroke-width=".35" stroke-dasharray=".5 1.5"/>
 </g>`;
 const tips=[30,190].map(x=>`<g transform="translate(${x} 75)">
 <path d="M0-10C-5-7-6-2-5 4L0 10 5 4C6-2 5-7 0-10Z" fill="#655234" stroke="#c7ab72" stroke-width=".6"/>
 <path d="M0-8C-4-5-4 2 0 7C4 2 4-5 0-8ZM0-5V5" fill="none" stroke="#ddc58d" stroke-width=".65"/>
 <path d="M-3 2Q0-2 3 2" fill="none" stroke="#917342" stroke-width=".5"/>
 </g>`).join('');
 const stitches=Array.from({length:81},(_,i)=>`<path d="M${29+i*2} 66.6l.8 1.1M${29+i*2} 83.2l.8 1.1"/>`).join('');
 return `<g class="header-fitting" pointer-events="none">
 <path d="M24 64.5H196V85Q153 86 110 86Q67 86 24 85Z" fill="${field}" stroke="#362e20" stroke-width="1"/>
 <path d="M24 64.5H196V85Q110 87 24 85Z" fill="#060b0b" opacity=".48"/>
 <path d="M25 65.5H195M25 84.8Q110 86.8 195 84.8" fill="none" stroke="#c5aa70" stroke-width="1.15"/>
 <path d="M26 68.7H194M26 82.2Q110 84.2 194 82.2" fill="none" stroke="#816b42" stroke-width=".45"/>
 <g stroke="#e0c890" stroke-width=".35" opacity=".8">${stitches}</g>
 <g transform="translate(110 75)">${scroll}<g transform="scale(-1 1)">${scroll}</g></g>
 ${tips}
 <g transform="translate(110 75)">
 <path d="M0-11C3-7 8-9 9-5L11 0 8 6Q3 6 0 12Q-3 6-8 6L-11 0-9-5C-8-9-3-7 0-11Z" fill="#7b653d" stroke="#d3b77a" stroke-width=".7"/>
 <path d="M0-9 6-4 8 0 5 5 0 9-5 5-8 0-6-4Z" fill="#252920" stroke="#b59b64" stroke-width=".5"/>
 <path d="M-2-6H2L1.4-1.5 5-2V2L1.4 1.5 2 6H-2L-1.4 1.5-5 2V-2L-1.4-1.5Z" fill="#c8ac6e" stroke="#e0c991" stroke-width=".3"/>
 <path d="M0-2.4 2 .2 0 2.5-2 .2Z" fill="#783c2f" stroke="#b78d56" stroke-width=".4"/>
 <path d="M0-2.1-.9-.1.1-.8Z" fill="#c98464" opacity=".7"/>
 <path d="M0 12V15M-2 16 0 13 2 16 0 19Z" fill="#bea16a" stroke="#d9c18c" stroke-width=".4"/>
 </g></g>`;
}
