import {randomUUID,randomInt} from 'node:crypto';
import {move,blocked,floorAt,near,safe,clearLine,STATIONS,powerSolved,PORTAL,STORM_ROOFS} from './public/world.js';
export class Game{
 constructor(code,shared=false){this.shared=shared;this.code=code;this.players=[];this.enemies=[];this.time=0;this.state='lobby';this.winner=null;this.countdown=0;this.feed=[];this.shots=[];this.lastActive=Date.now();for(let i=0;i<24;i++)this.enemies.push({id:'e'+i,type:['hound','ribbon','lantern'][(i+Math.floor(i/3))%3],x:[0,-46,46][i%3]+(i%2)*5,z:(-38-Math.floor(i/3)*28)*2,y:0,hp:60,homeX:[0,-46,46][i%3]+(i%2)*5,homeZ:(-38-Math.floor(i/3)*28)*2,dead:0,attack:0});this.enemies=this.enemies.filter(e=>e.z>-334);for(let i=0;i<3;i++)this.enemies.push({id:'storm'+i,type:'ribbon',x:6-i*5,z:-390-i*40,y:14,hp:60,homeX:6-i*5,homeZ:-390-i*40,dead:0,attack:0});}
 add(name,look={}){if(this.state!=='lobby'&&!this.shared)throw Error('This delivery has started. Join after the crew returns to the lobby.');if(this.players.length>=8)throw Error('This room has eight couriers.');const p={id:randomUUID(),token:randomUUID(),waiting:this.state!=='lobby',portal:false,name:String(name||'Courier').replace(/[<>\x00-\x1f]/g,'').slice(0,18),look:{color:/^#[0-9a-f]{6}$/i.test(look.color)?look.color:'#de9764',skin:/^#[0-9a-f]{6}$/i.test(look.skin)?look.skin:'#c59070',hat:!!look.hat},x:(this.players.length%4-1.5)*2,z:22,y:0,vy:0,yaw:0,pitch:0,hp:100,ammo:12,stage:0,ready:false,online:true,lastSeen:Date.now(),input:{},respawn:0,shield:0,reload:0,shotAt:0,kills:0,defeats:0,finish:null,checkpoint:{x:0,z:-40},puzzle:null,symbols:Array.from({length:3},()=>randomInt(4)),pipes:[1,2,1,1,1,1,0,2,1],cooldown:0,jumpUntil:0,radio:'',radioUntil:0};this.players.push(p);return p;}
 resetRound(){this.state='lobby';this.time=0;this.winner=null;this.paused=false;this.feed=[];this.shots=[];for(const a of this.players){Object.assign(a,{x:0,z:22,y:0,vy:0,hp:100,ammo:12,stage:0,ready:false,returnVote:false,waiting:false,portal:false,reload:0,shotAt:0,cooldown:0,jumpUntil:0,groundedUntil:0,radioAt:0,radioUntil:0,finish:null,respawn:0,shield:0,puzzle:null,input:{},kills:0,defeats:0,checkpoint:{x:0,z:-40},symbols:Array.from({length:3},()=>randomInt(4))});}for(const e of this.enemies)Object.assign(e,{x:e.homeX,z:e.homeZ,hp:60,dead:0,attack:0});this.enemies=this.enemies.filter(e=>e.z>-334);for(let i=0;i<3;i++)this.enemies.push({id:'storm'+i,type:'ribbon',x:6-i*5,z:-390-i*40,y:14,hp:60,homeX:6-i*5,homeZ:-390-i*40,dead:0,attack:0});}
 note(text){this.feed.unshift(text);this.feed=this.feed.slice(0,5);}
 command(p,d){this.lastActive=Date.now();p.lastSeen=Date.now();p.online=true;
 if(d.type==='ready'&&this.state==='lobby'){p.ready=!p.ready;if(this.players.filter(x=>x.online).every(x=>x.ready)){this.state='countdown';this.countdown=3;}return;}
 if(d.type==='return'){p.returnVote=true;const voters=this.players.filter(x=>x.online&&!x.waiting);if(this.winner&&voters.every(x=>x.returnVote)){this.resetRound();}return;}
 if(d.type==='pause'){if(!this.shared&&this.players.length===1)this.paused=!!d.value;return;}
 if(d.type==='input'){p.input={f:clamp(d.f),s:clamp(d.s),run:!!d.run,crouch:!!d.crouch,jump:!!d.jump};p.yaw=finite(d.yaw);p.pitch=Math.max(-1.3,Math.min(1.3,finite(d.pitch)));return;}
 if(d.type==='radio'){if(this.time>=(p.radioAt||0)){p.radio=['Special delivery!','Behind you!','Taking the scenic route.','Meet you at the foundry!'][Number(d.index)%4]||'Special delivery!';p.radioUntil=this.time+4;p.radioAt=this.time+3;this.note(p.name+': '+p.radio);}return;}
 if(this.state!=='playing'||p.waiting||p.respawn>0||p.finish!==null)return;
 if(d.type==='jump'){p.jumpUntil=this.time+.25;return;}
 if(d.type==='interact'){
 if(p.stage===0&&near(p,STATIONS.dispatch,5)){p.stage=1;this.note(p.name+' accepted a dispatch.');}
 else if(p.stage===1&&near(p,STATIONS.parcel,5)){p.puzzle='parcel';p.input={};}
 else if(p.stage===2&&!p.portal&&near(p,PORTAL,6)){p.portal=true;p.x=0;p.z=-350;p.y=14;p.vy=0;p.input={};p.checkpoint={x:0,z:-350,y:14};this.note(p.name+' crossed the storm portal. Sprint + Space to jump the gaps.');}
 else if(p.stage===2&&p.portal&&near(p,STATIONS.gate,7)){p.puzzle='gate';p.input={};}
 else if(p.stage===3&&near(p,STATIONS.lift,5)){p.stage=4;p.y=18;p.z=-574;p.vy=0;}
 else if(p.stage===4&&near(p,STATIONS.recipient,4)&&p.y>17){p.stage=5;p.finish=this.time;if(!this.winner){this.winner=p.id;this.note(p.name+' delivered first!');}else this.note(p.name+' delivered.');}
 return;}
 if(d.type==='cancel'){p.puzzle=null;return;}
 if(d.type==='solve'&&p.puzzle&&this.time>=p.cooldown){let ok=false;if(p.puzzle==='parcel')ok=Array.isArray(d.answer)&&d.answer.length===3&&d.answer.every((v,i)=>v===p.symbols[i]);else ok=powerSolved(d.answer);if(ok){p.stage=p.puzzle==='parcel'?2:3;p.puzzle=null;if(p.stage===3){p.x=0;p.z=-538;p.y=0;}this.note(p.name+(p.stage===2?' collected their parcel.':' reached the foundry.'));}else p.cooldown=this.time+1;return;}
 if(d.type==='reload'&&!p.reload&&p.ammo<12)p.reload=this.time+1.3;
 if(d.type==='fire')this.fire(p);
 }
 fire(p){if(safe(p)||this.time<p.shotAt||p.reload||p.ammo<=0||p.finish!==null)return;p.shield=0;p.ammo--;p.shotAt=this.time+.22;const dir={x:-Math.sin(p.yaw)*Math.cos(p.pitch),z:-Math.cos(p.yaw)*Math.cos(p.pitch),y:Math.sin(p.pitch)};const eye={x:p.x,y:p.y+(p.input.crouch?.9:1.65),z:p.z};let target=null,dist=65;for(const q of [...this.enemies.filter(e=>!e.dead),...this.players.filter(q=>q!==p&&q.online&&!safe(q)&&q.shield<=this.time&&q.finish===null)]){const dy=q.y+(q.type==='ribbon'?2:q.input?.crouch?.65:q.type?1:1.3)-eye.y,dx=q.x-eye.x,dz=q.z-eye.z,t=dx*dir.x+dy*dir.y+dz*dir.z;const radius=q.type?1.05:.65;if(t>0&&t<dist&&Math.hypot(dx-t*dir.x,dy-t*dir.y,dz-t*dir.z)<radius&&clearLine(p,q)){target=q;dist=t;}}this.shots.push({id:randomUUID(),x:eye.x,y:eye.y,z:eye.z,tx:eye.x+dir.x*dist,ty:eye.y+dir.y*dist,tz:eye.z+dir.z*dist,at:this.time,owner:p.id});if(target){target.hp-=target.type?30:20;if(target.hp<=0){if(target.type){target.dead=this.time+22;p.kills++;}else this.defeat(target,p.name);}}}
 defeat(p,by='a spirit'){p.hp=0;p.respawn=3;p.defeats++;p.puzzle=null;p.input={};this.note(p.name+' was scattered by '+by+'. Returning to a checkpoint.');}
 tick(dt=.066){if(this.paused)return;this.time+=dt;for(const p of this.players)if(Date.now()-p.lastSeen>20000)p.online=false;if(this.shared&&this.state==='playing'&&!this.players.some(p=>p.online&&!p.waiting)){this.resetRound();return;}if(this.state==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.state='playing';this.time=0;this.note('Dispatch is open. Find the counter.');}return;}if(this.state!=='playing')return;
 for(const p of this.players){if(!p.online||p.waiting)continue;if(p.respawn>0){p.respawn-=dt;if(p.respawn<=0){p.respawn=0;p.x=p.checkpoint.x;p.z=p.checkpoint.z;p.y=p.checkpoint.y||0;p.vy=0;p.hp=100;p.ammo=12;p.shield=this.time+4;}continue;}if(p.reload&&this.time>=p.reload){p.ammo=12;p.reload=0;}if(p.finish!==null||p.puzzle)continue;const input=Date.now()-p.lastSeen<1000?p.input:{};const onGround=p.y<=floorAt(p.x,p.z,p.y)+.05;const wantsJump=input.jump||this.time<(p.jumpUntil||0);const norm=Math.max(1,Math.hypot(input.f||0,input.s||0)),speed=input.crouch&&onGround&&!wantsJump?2.7:input.run?7.5:4.8;move(p,(-Math.sin(p.yaw)*(input.f||0)+Math.cos(p.yaw)*(input.s||0))*speed*dt/norm,(-Math.cos(p.yaw)*(input.f||0)-Math.sin(p.yaw)*(input.s||0))*speed*dt/norm);const floor=floorAt(p.x,p.z,p.y);if(p.y<=floor+.05)p.groundedUntil=this.time+.2;if(wantsJump&&(p.y<=floor+.05||this.time<(p.groundedUntil||0))){p.vy=9.2;p.jumpUntil=0;p.groundedUntil=0;p.input.jump=false;}p.vy-=18*dt;p.y=Math.max(floor,p.y+p.vy*dt);if(p.y<=floor)p.vy=0;if(p.stage===2&&p.z<-216&&p.checkpoint.z>-200){p.checkpoint={x:0,z:-228};this.note(p.name+' reached Market Crossing.');}if(p.stage===2&&p.portal&&p.z<-334&&p.z>-500&&p.y<8){this.defeat(p,'the storm below the rooftops');continue;}if(safe(p))p.hp=Math.min(100,p.hp+dt*9);}
 for(const e of this.enemies){if(e.dead){if(this.time>=e.dead){e.dead=0;e.hp=60;e.x=e.homeX;e.z=e.homeZ;}continue;}const candidates=this.players.filter(p=>p.online&&!p.waiting&&p.respawn<=0&&!safe(p)&&p.shield<this.time&&p.finish===null&&(p.y<3||e.type==='ribbon')&&Math.hypot(p.x-e.x,p.z-e.z)<28&&clearLine(e,p));const p=candidates.sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];if(p){const d=Math.hypot(p.x-e.x,p.z-e.z);if(e.type==='ribbon')e.y+=(p.y-e.y)*Math.min(1,dt*2);if(d>(e.type==='hound'?3.05:12)){const speed=e.type==='hound'?8.2:4.5;const step=Math.min(speed*dt,d-(e.type==='hound'?3.05:12));const temp={...e,stage:2,portal:true};move(temp,(p.x-e.x)/d*step,(p.z-e.z)/d*step);e.x=temp.x;e.z=temp.z;}else if(this.time>e.attack){p.hp-=e.type==='hound'?17:12;e.attack=this.time+(e.type==='hound'?1.2:1.8);if(e.type!=='hound')this.shots.push({id:randomUUID(),x:e.x,y:e.y+1.5,z:e.z,tx:p.x,ty:p.y+1,tz:p.z,at:this.time,owner:e.id});if(p.hp<=0)this.defeat(p,'a '+e.type);}}else{const tx=e.homeX+Math.sin(this.time*.3+e.homeZ)*2,tz=e.homeZ+Math.cos(this.time*.3+e.homeZ)*2;const temp={...e,stage:2,portal:true};move(temp,(tx-e.x)*dt,(tz-e.z)*dt);e.x=temp.x;e.z=temp.z;}}
 for(const e of this.enemies)if(!e.dead)this.separateEnemy(e);
 this.shots=this.shots.filter(s=>this.time-s.at<.35);
 }
 separateEnemy(e){
 const radius=e.type==='hound'?2.8:3.4;
 const players=this.players.filter(p=>p.online&&!p.waiting&&p.respawn<=0&&p.finish===null&&Math.abs(p.y-e.y)<3);
 for(const p of players){
  if(Math.hypot(e.x-p.x,e.z-p.z)>=radius)continue;
  const angle=Math.atan2(e.z-p.z,e.x-p.x);
  let best=null,score=Infinity;
  for(let i=0;i<32;i++){
   const a=angle+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/16;
   const candidate={x:p.x+Math.cos(a)*(radius+.02),z:p.z+Math.sin(a)*(radius+.02),y:e.y};
   if(blocked(candidate.x,candidate.z,e.y,2,true)||!clearLine(e,candidate))continue;
   if(e.type!=='ribbon'&&Math.abs(floorAt(candidate.x,candidate.z,e.y)-e.y)>.5)continue;
   if(players.some(q=>Math.hypot(candidate.x-q.x,candidate.z-q.z)<radius-.001))continue;
   const d=Math.hypot(candidate.x-e.x,candidate.z-e.z);if(d<score){score=d;best=candidate;}
  }
  if(best){e.x=best.x;e.z=best.z;}
 }
 }
 snapshot(){return {shared:this.shared,code:this.code,state:this.state,time:this.time,countdown:this.countdown,winner:this.winner,feed:this.feed,enemies:this.enemies,shots:this.shots,players:this.players.map(({token,input,lastSeen,...p})=>({...p,crouch:!!input.crouch}))};}
}
const finite=v=>Number.isFinite(Number(v))?Number(v):0;const clamp=v=>Math.max(-1,Math.min(1,finite(v)));
