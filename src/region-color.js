// Golden-angle hues separate successive region IDs and stay stable on reload.
export function regionColor(number){
 const hue=(number*137.507764+23)%360,s=.55,l=.55
 const component=n=>{const k=(n+hue/30)%12,a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0')}
 return '#'+component(0)+component(8)+component(4)
}
