import {hasLabelCurve} from '../map-curved-sea-label.js'
export default function MapCurveControls({row,value,onChange}){
 const curvature=hasLabelCurve({...row,curve:value}) ? (value?.curvature ?? Math.max(-100,Math.min(100,(value?.bend??3)*15))) : 0
 return <fieldset><legend>曲率</legend><input aria-label="文字曲率" type="range" min="-100" max="100" step="1" value={curvature} onChange={e=>{const n=Number(e.target.value);onChange({enabled:n!==0,curvature:n})}}/><div style={{display:'flex',justifyContent:'space-between'}}><span>向下弯</span><button type="button" onClick={()=>onChange({enabled:false,curvature:0})}>直排</button><span>向上弯</span></div><p>字距和双语间距自动调整。</p></fieldset>
}
