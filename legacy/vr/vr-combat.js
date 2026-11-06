import * as T from './vendor/three.module.js';
import {mergeStaticMeshes} from './architecture.js';
export class Magazine {
 constructor(){this.reset();}
 reset(){this.capacity=8;this.rounds=8;this.remaining=0;}
 reload(){if(this.remaining||this.rounds===this.capacity)return false;this.remaining=1.4;return true;}
 fire(){if(this.remaining||!this.rounds)return false;this.rounds--;return true;}
 tick(dt){if(this.remaining){this.remaining=Math.max(0,this.remaining-dt);if(!this.remaining)this.rounds=this.capacity;}}
}
export function segmentDistance(p,a,b){const x=b.x-a.x,y=b.y-a.y,z=b.z-a.z,d=x*x+y*y+z*z,t=d?Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y+(p.z-a.z)*z)/d)):0;return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y,p.z-a.z-t*z);}
// Fixed-size projectile pool: warning, aimed shot, then recovery. Shots never home in.
export function createEnemyFire({root,enemies,occluders}){
 const amber=new T.MeshBasicMaterial({color:0xffad67,toneMapped:false}),steel=new T.MeshStandardMaterial({color:0x344955,metalness:.6,roughness:.4});
 const bolts=Array.from({length:12},()=>{const o=new T.Mesh(new T.SphereGeometry(.095,8,6),amber);o.visible=false;root.add(o);return {o,v:new T.Vector3(),life:0};});
 for(const e of enemies){const weapon=new T.Group();weapon.position.set(.27,.04,.3);e.root.add(weapon);for(const [x,y,z,w,h,d] of [[0,0,.12,.12,.13,.55],[0,-.12,-.04,.09,.23,.12]]){const o=new T.Mesh(new T.BoxGeometry(w,h,d),steel);o.position.set(x,y,z);weapon.add(o);}mergeStaticMeshes(weapon);e.charge=new T.Mesh(new T.SphereGeometry(.10,10,8),amber);e.charge.position.set(.27,.04,.72);e.root.add(e.charge);e.fireTime=1.5;e.charge.visible=false;}
 const ray=new T.Raycaster(),a=new T.Vector3(),b=new T.Vector3(),worldA=new T.Vector3(),worldB=new T.Vector3();
 function blocked(from,to){root.updateWorldMatrix(true,false);worldA.copy(from);worldB.copy(to);root.localToWorld(worldA);root.localToWorld(worldB);const delta=worldB.clone().sub(worldA),distance=delta.length();ray.set(worldA,delta.normalize());ray.far=distance;return ray.intersectObjects(occluders.filter(o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true;}),false).some(h=>h.distance<distance-.05);}
 function clear(){bolts.forEach(p=>{p.life=0;p.o.visible=false;});enemies.forEach((e,i)=>{e.fireTime=1.5+i*.18;e.charge.visible=false;});}
 function tick(dt,player,safe){let hit=false,fired=false;for(const e of enemies){const d=Math.hypot(player.x-e.root.position.x,player.z-e.root.position.z);if(safe||e.hp<=0||d>14){e.charge.visible=false;e.fireTime=Math.max(1.2,e.fireTime);continue;}e.fireTime-=dt;e.charge.visible=e.fireTime<.85;e.charge.scale.setScalar(.5+Math.max(0,.85-e.fireTime)*1.5);if(e.fireTime<=0){e.fireTime=3.1; e.root.updateWorldMatrix(true,false);a.copy(e.charge.position);e.root.localToWorld(a);root.worldToLocal(a);b.set(player.x,player.y-.35,player.z);if(!blocked(a,b)){const p=bolts.find(p=>!p.life);if(p){p.o.position.copy(a);p.v.copy(b).sub(a).normalize().multiplyScalar(5);p.life=3.5;p.o.visible=true;fired=true;}}}}
 for(const p of bolts){if(!p.life)continue;a.copy(p.o.position);b.copy(a).addScaledVector(p.v,dt);p.life=Math.max(0,p.life-dt);if(safe||blocked(a,b))p.life=0;else if(segmentDistance({x:player.x,y:player.y-.35,z:player.z},a,b)<.38){hit=true;p.life=0;}p.o.position.copy(b);p.o.visible=p.life>0;}
 return {hit,fired};}
 return {tick,clear};
}
