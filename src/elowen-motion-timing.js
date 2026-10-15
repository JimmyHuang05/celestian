const TAU=Math.PI*2
export const MOTION_DURATION=12
export const BREATH_DURATION=4

// Quiet, single blinks with unequal gaps. Closure is quicker than reopening;
// all events finish before the 12-second seam, which stays fully open.
const blinkStarts=[2.2,6.1,10.35]
const smooth=value=>{const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x)}
export function blinkAt(seconds){
  const t=((seconds%MOTION_DURATION)+MOTION_DURATION)%MOTION_DURATION
  for(const start of blinkStarts){
    const age=t-start
    if(age<0||age>.26)continue
    if(age<.075)return smooth(age/.075)
    if(age<.11)return 1
    return 1-smooth((age-.11)/.15)
  }
  return 0
}

export function breathingPhaseAt(seconds){
  return ((seconds%BREATH_DURATION)+BREATH_DURATION)%BREATH_DURATION/BREATH_DURATION*TAU
}

// One rise/fall drives the whole connected rig: inhale for the first half,
// exhale for the second. Chest and torso turn together at both endpoints.
// Only free hair/cloth ends may follow slightly later, never on another clock.
export function breathingAt(seconds){
  const phase=breathingPhaseAt(seconds),lift=-Math.cos(phase)
  return {
    ribcage:lift,
    chest:lift,
    fabric:-Math.cos(phase-.12*TAU/BREATH_DURATION),
  }
}

// Spatial freedom controls follow-through, expressed in seconds so every
// character shares both the breathing period and the maximum settling delay.
export const breathingRigGLSL=`
uniform float u_breathPhase;
float followBreath(float delaySeconds){
  return -cos(u_breathPhase-clamp(delaySeconds,0.0,.22)*${TAU/BREATH_DURATION});
}
`
