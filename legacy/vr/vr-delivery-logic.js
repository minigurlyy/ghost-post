// Solo delivery rules, independent of rendering and headset APIs.
export const ROUTE=[[0,0],[0,25],[10,45],[10,65],[-8,85],[-8,105],[0,125],[0,145]];
export function streetX(z){for(let i=1;i<ROUTE.length;i++){const [x,b]=ROUTE[i], [px,a]=ROUTE[i-1];if(z<=b)return px+(x-px)*Math.max(0,(z-a)/(b-a));}return 0;}
export function streetWalkable(x,z,unlocked=false){return z>=0&&z<=(unlocked?147:118)&&Math.abs(x-streetX(z))<=3.05;}
export function streetMove(p,dx,dz,unlocked=false){let {x,z}=p;const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));for(let i=0;i<n;i++){if(streetWalkable(x+dx/n,z,unlocked))x+=dx/n;if(streetWalkable(x,z+dz/n,unlocked))z+=dz/n;}return {x,z};}
export class Delivery {
 constructor(){this.reset();}
 reset(){this.active=false;this.stage='street';this.health=3;this.checkpoint=4;this.dials=[0,2,1];this.respawns=0;this.kills=0;this.elapsed=0;this.invulnerable=0;}
 start(){this.reset();this.active=true;}
 get unlocked(){return ['portal','rooftops','elevator','recipient','delivered'].includes(this.stage);}
 progress(z){if(z>=70&&this.checkpoint<70){this.checkpoint=70;return true;}return false;}
 turn(i){if(!this.active||this.unlocked||![0,1,2].includes(i))return false;this.stage='gate';this.dials[i]=(this.dials[i]+1)%4;if(this.dials.every(v=>v===1))this.stage='portal';return true;}
 deliver(){if(this.stage!=='recipient')return false;this.stage='delivered';return true;}
 damage(){if(!this.active||this.stage==='delivered'||this.invulnerable>0)return false;this.health--;this.invulnerable=1.8;if(this.health>0)return false;this.health=3;this.invulnerable=4;this.respawns++;return true;}
 tick(dt){this.invulnerable=Math.max(0,this.invulnerable-dt);if(this.active&&this.stage!=='delivered')this.elapsed+=dt;}
 get objective(){return ({street:'Follow the gold lamps · Keep your parcel safe.',gate:'Safe zone · Turn all three arrows UP.',portal:'Ward open · Enter the storm portal at the end of the canal.',rooftops:'Cross the lit rooftops · A / Space to jump · Reach the foundry lift.',elevator:'Lift rising · Room 07 · Wait for the doors to open.',recipient:'Room 07 · Deliver the parcel to Major Ash.',delivered:'Delivery complete · Major Ash has received the last ember.'})[this.stage];}
}

// Local canal coordinates: enter the opening by walking or teleporting into it.
export function insidePortal(x,z){return Math.abs(x)<1.45&&z>=144.2&&z<=147;}
