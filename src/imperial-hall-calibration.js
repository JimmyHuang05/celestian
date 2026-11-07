import {homography, project} from './imperial-perspective-geometry.js';

// Approved in imperial-perspective-study.html and read from its live controls
// on 2026-10-18. Keep this snapshot independent of subsequent browser drafts.
export const hallCalibration = [
  {id:'lion',wall:[[130,300],[290,300],[285.5,687],[118,686.5]],pin:[221.5,243],wallAspect:153/369,panel:{center:.565,size:.82,top:-.045}},
  {id:'bear',wall:[[399,301],[554,301],[549.5,690],[390.5,689]],pin:[478.5,243],wallAspect:150/369,panel:{center:.52,size:.82,top:-.045}},
  {id:'imperial',wall:[[698,210],[973,210],[974,673],[696,673]],pin:[836,117],wallAspect:276.5/463,panel:{center:.51,size:.84,top:-.065}},
  {id:'lynx',wall:[[1124,302],[1273,302],[1277.5,690],[1126,688]],pin:[1191.5,242],wallAspect:150/368,panel:{center:.47,size:.82,top:-.035}},
  {id:'wolf',wall:[[1379,301],[1544,301],[1553.5,690],[1386.5,690]],pin:[1451.5,242],wallAspect:162.5/369,panel:{center:.445,size:.82,top:-.045}},
];

// Chapter standards have a common cloth width, rather than occupying the same
// percentage of differently sized niches. Preserve the approved wall and pin.
// Re-estimate the local metric after the user moved the wall's lower corners;
// the study's original aspect estimates predate those edits.
export const hallFlagCalibration=hallCalibration.map(arch=>{
  if(arch.id==='imperial')return arch;
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const [a,b,c,d]=arch.wall;
  const wall=homography(arch.wall);
  const span=distance(project(wall,0,arch.panel.top),project(wall,1,arch.panel.top));
  return {...arch,wallAspect:(distance(a,b)+distance(d,c))/(distance(a,d)+distance(b,c)),
    panel:{...arch.panel,size:132/span}};
});

// Inscribed areas on the dark plinth faces, in the same 1672 × 941 artboard.
// These are wall coordinates, independent of the cloth and its suspension pin.
// The principal inscription occupies the opening beneath the swallowtail.
export const hallInscriptionCalibration = [
  {id:'lion',quad:[[134,700],[278,701],[274,778],[133,777]],ink:'#9c9480',lip:'#d2c5a97a'},
  {id:'bear',quad:[[403,701],[548,702],[546,779],[402,777]],ink:'#918b79',lip:'#c5bda56b'},
  {id:'imperial',quad:[[760,703],[913,703],[914,779],[759,779]],ink:'#a59a80',lip:'#d5c6a47a'},
  {id:'lynx',quad:[[1132,702],[1269,703],[1271,779],[1133,777]],ink:'#878575',lip:'#b7b6a35c'},
  {id:'wolf',quad:[[1391,702],[1541,702],[1543,779],[1392,779]],ink:'#7d8074',lip:'#afb4a352'},
];
