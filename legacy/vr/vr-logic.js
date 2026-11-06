// Browser-independent prototype rules and locomotion, shared with the tests.
export const SEAL = ['MOON', 'WAVE', 'LANTERN'];
export const OBSTACLES = [
  {x:-3,z:-.65,w:4,d:2.5}, {x:4,z:-4,w:3,d:1.2},
  {x:7.25,z:-2,w:.8,d:13}, {x:-7.25,z:-2,w:.8,d:13},
];
export function walkable(x,z,r=.3){
  return x>=-6.7+r&&x<=6.7-r&&z>=-9.3+r&&z<=6.3-r&&
    !OBSTACLES.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);
}
export function moveXZ(p,dx,dz){
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
  let x=p.x,z=p.z;
  for(let i=0;i<n;i++){if(walkable(x+dx/n,z))x+=dx/n;if(walkable(x,z+dz/n))z+=dz/n;}
  return {x,z};
}
export function deadzone(value,threshold=.18){return Math.abs(value)<threshold?0:Math.sign(value)*(Math.abs(value)-threshold)/(1-threshold);}
export class Shift {
  constructor(mode='training'){this.mode=mode;this.reset();}
  reset(){this.stage='dispatch';this.sequence=[];this.hits=new Set();this.message='Follow the glowing trail to dispatch. Point at PICK UP A JOB and press right trigger / click.';}
  act(action){
    if(action==='restart'){this.reset();return true;}
    if(action==='dispatch'&&this.stage==='dispatch'){this.stage='seal';this.message='Sorting desk → Copy the seal: MOON • WAVE • LANTERN.';return true;}
    if(action.startsWith('seal:')&&this.stage==='seal'){
      const symbol=action.slice(5);
      if(symbol!==SEAL[this.sequence.length]){this.sequence=[];this.message='The seal reset. Try MOON, then WAVE, then LANTERN.';return false;}
      this.sequence.push(symbol);
      if(this.sequence.length===3){this.stage='parcel';this.message='Seal open. Point at the golden parcel to collect it.';}
      else this.message=`${this.sequence.length}/3 seals lit. Next: ${SEAL[this.sequence.length]}.`;
      return true;
    }
    if(action==='parcel'&&this.stage==='parcel'&&this.mode==='journey'){this.stage='outbound';this.message='Parcel secured. Walk through the front arch to Lantern Mile.';return true;}
    if(action==='parcel'&&this.stage==='parcel'){this.stage='range';this.message='Parcel secured. Shoot the three floating practice spirits at the back.';return true;}
    if(action.startsWith('target:')&&this.stage==='range'){
      const id=Number(action.slice(7));if(![0,1,2].includes(id)||this.hits.has(id))return false;
      this.hits.add(id);this.message=`${this.hits.size}/3 spirits cleared.`;
      if(this.hits.size===3){this.stage='stamp';this.message='Range clear. Return to dispatch and stamp your courier pass.';}
      return true;
    }
    if(action==='dispatch'&&this.stage==='stamp'){this.stage='done';this.message='First shift complete. Your parcel is ready for the district.';return true;}
    return false;
  }
}

// Normalize initial eye level while preserving subsequent physical crouching.
export function eyeOffset(trackedY){return Number.isFinite(trackedY)?1.65-trackedY:0;}
