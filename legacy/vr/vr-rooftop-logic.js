export const LIFT_DURATION=10;
export function liftFrame(seconds){
 const t=Math.max(0,Math.min(LIFT_DURATION,seconds)),u=Math.max(0,Math.min(1,(t-1.2)/7));
 const travel=u*u*u*(u*(u*6-15)+10);
 return {height:8+6*travel,frontOpen:Math.max(0,1-t/1.2),backOpen:Math.max(0,Math.min(1,(t-8.7)/1.3)),floor:Math.min(7,1+Math.floor(travel*6)),phase:t<1.2?'Closing doors':t<8.2?'Going up':t<8.7?'Floor 07':t<LIFT_DURATION?'Opening doors':'Floor 07',arrived:t>=LIFT_DURATION};
}
// All heights are world-space metres; supports are separate from horizontal bounds.
export const ROOFS=[[220,230],[231.4,241.4],[242.8,252.8],[254.2,266],[267.4,280]];
export function roofSupport(x,z){return Math.abs(x)<=3&&ROOFS.some(([a,b])=>z>=a&&z<=b)?8:null;}
export class RoofRun {
 constructor(){this.reset();}
 reset(){this.active=false;this.feet=8;this.velocity=0;this.grounded=true;this.coyote=.12;this.liftTime=0;this.fuses=[false,true,true];this.power=false;}
 enter(){this.reset();this.active=true;}
 jump(){if(!this.active||this.liftTime||!this.grounded&&this.coyote<=0)return false;this.velocity=4.8;this.grounded=false;this.coyote=0;return true;}
 toggle(i){if(this.power||![0,1,2].includes(i))return false;this.fuses[i]=!this.fuses[i];this.power=this.fuses[0]&&!this.fuses[1]&&this.fuses[2];return true;}
 walkable(x,z,stage){if(z>281&&z<285&&Math.abs(x)>1.3)return false;return Math.abs(x)<=2.8&&(stage==='recipient'||stage==='delivered'?z>=281&&z<=304:z>=220&&z<=(this.power?284:277));}
 support(x,z,stage){if(stage==='recipient'||stage==='delivered')return Math.abs(x)<=3&&z>=280&&z<=306?14:null;if(z>=267.4&&z<=286&&Math.abs(x)<=3)return 8;return roofSupport(x,z);}
 tick(dt,x,z,stage){
  if(!this.active)return {};
  if(stage==='elevator'){const before=this.liftTime;this.liftTime=Math.min(LIFT_DURATION,this.liftTime+dt);const f=liftFrame(this.liftTime);this.feet=f.height;this.velocity=0;this.grounded=true;return {arrived:f.arrived,doorOpen:before<8.7&&this.liftTime>=8.7,motorStart:before<1.2&&this.liftTime>=1.2,stop:before<8.2&&this.liftTime>=8.2};}
  const floor=this.support(x,z,stage);
  if(this.grounded&&floor===null){this.grounded=false;this.coyote=.12;}
  this.coyote=Math.max(0,this.coyote-dt);
  if(!this.grounded){this.velocity-=10*dt;this.feet+=this.velocity*dt;if(floor!==null&&this.feet<=floor&&this.velocity<=0&&this.feet>floor-.6){this.feet=floor;this.velocity=0;this.grounded=true;}}
  if(this.feet<4){this.feet=8;this.velocity=0;this.grounded=true;this.coyote=.12;return {fell:true};}
  return {};
 }
 land(x,z,stage){const y=this.support(x,z,stage);if(y===null)return false;this.feet=y;this.velocity=0;this.grounded=true;return true;}
}
