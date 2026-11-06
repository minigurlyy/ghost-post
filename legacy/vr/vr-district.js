import {createEnemyFire} from './vr-combat.js';
import {dismissPanel} from './vr-panel-fx.js';
import * as T from './vendor/three.module.js';
import {roundedBlock,curvedRoof,mergeStaticMeshes} from './architecture.js';
import {Delivery,streetX,streetMove,streetWalkable,insidePortal} from './vr-delivery-logic.js';
export function createDistrict({scene,materials:m,label,button,interactives,occluders}){
 const root=new T.Group();root.name='Lantern Mile';root.position.z=7;scene.add(root);root.visible=true;
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const gg=glowCanvas.getContext('2d'),gr=gg.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,231,165,.85)');gr.addColorStop(.25,'rgba(255,183,77,.36)');gr.addColorStop(1,'rgba(255,154,55,0)');gg.fillStyle=gr;gg.fillRect(0,0,64,64);const haloMap=new T.CanvasTexture(glowCanvas);const halos=[];
 const lanternPaper=new T.MeshBasicMaterial({color:0xffd98a,toneMapped:false});
 const state=new Delivery(),animated=[],enemies=[],signs=[];
 const add=(g,mat,x,y,z,parent=root)=>{const o=new T.Mesh(g,mat);o.position.set(x,y,z);parent.add(o);return o;};
 const box=(x,y,z,w,h,d,mat,parent=root)=>add(roundedBlock(w,h,d,.12),mat,x,y,z,parent);
 const stone=new T.MeshStandardMaterial({color:0x526064,roughness:.95}),water=new T.MeshStandardMaterial({color:0x1d5357,metalness:.55,roughness:.3});
 const red=new T.MeshStandardMaterial({color:0x814e45,roughness:.8}),jade=new T.MeshStandardMaterial({color:0x6e9e8c,roughness:.65});
 const ink=new T.MeshStandardMaterial({color:0x202c36,roughness:.9}),eyes=new T.MeshBasicMaterial({color:0xffc37d});
 // Wide canal under a winding, continuous promenade; no artificial camera movement.
 box(0,-.55,75,85,.3,170,water);
 for(let z=0;z<=146;z+=2){const x=streetX(z);for(const side of [-1,1]){box(x+side*3.55,.23,z,.24,.6,2.5,m.dark);if(z%4===0)box(x+side*3.55,.65,z,.16,.9,.16,m.brass);}}
 // A continuous stone promenade follows the route; the joins share vertices.
 const pathPositions=[],pathIndices=[];
 for(let z=0;z<=148;z+=2){const x=streetX(Math.min(z,145));pathPositions.push(x-4,-.02,z,x+4,-.02,z);if(z>0){const i=z;pathIndices.push(i-2,i,i-1,i-1,i,i+1);}}
 const pathGeometry=new T.BufferGeometry();pathGeometry.setAttribute('position',new T.Float32BufferAttribute(pathPositions,3));pathGeometry.setIndex(pathIndices);pathGeometry.computeVertexNormals();add(pathGeometry,stone,0,0,0);
 // Narrow stone inlays sit above the walkway, avoiding overlapping floor surfaces.
 for(let z=4;z<146;z+=4)box(streetX(z),-.005,z,6.8,.012,.025,m.brass);
 // Layered shop fronts, timber frames, swept eaves and balconies.
 for(let z=9,i=0;z<145;z+=10,i++)for(const side of [-1,1]){
  const x=streetX(z)+side*8,h=5+(i%3)*1.3,wall=i%3===0?red:i%3===1?m.plaster:m.teal;
  box(x,h/2,z,6,h,7,wall);for(const y of [h,h*.58]){const roof=add(curvedRoof(7.5,8,1.4),m.dark,x,y,z);roof.material.side=T.DoubleSide;}
  for(const dz of [-2.3,0,2.3]){box(x-side*3.04,2.7,z+dz,.08,1.6,1.3,m.glow);box(x-side*3.12,2.7,z+dz,.1,1.7,.07,m.wood);}
  // Shoji bars, carved eave brackets, and cloth door panels give each facade depth.
  for(const dz of [-2.3,0,2.3]){for(let j=-2;j<=2;j++)box(x-side*3.16,2.7,z+dz+j*.22,.07,1.6,.025,m.wood);box(x-side*3.17,2.7,z+dz,.08,.025,1.3,m.wood);}
  for(const dz of [-2.8,-1,1,2.8])box(x-side*3.5,h*.58-.5,z+dz,.7,.1,.12,m.brass);
  for(let j=0;j<4;j++)box(x-side*3.2,1.5,z-1+j*.65,.04,.65,.58,i%2?m.teal:m.paper);
  box(x-side*3.45,.4,z+2.8,.6,.8,.65,m.wood);
  // Organic planted silhouettes sit outside the walkable corridor.
  if(i%3===1){const tx=x-side*3.8,tz=z-3;add(new T.CylinderGeometry(.06,.12,2.3,10),m.wood,tx,1.15,tz);for(let j=0;j<4;j++){const crown=add(new T.SphereGeometry(.6,12,8),jade,tx+Math.sin(j*2.1)*.4,2.1+j*.17,tz+Math.cos(j*2.1)*.3);crown.scale.set(1.2,.48,1);}}
  for(const dz of [-3.3,3.3])box(x-side*3.1,h/2,z+dz,.18,h,.18,m.wood);
  box(x-side*3.65,h*.58-.2,z,1.2,.25,7.2,m.wood);
  // Lanterns swing on a short suspension, grouped per material.
  const lantern=new T.Group();lantern.position.set(streetX(z)+side*2.9,3.3,z);root.add(lantern);animated.push(lantern);
  add(new T.CylinderGeometry(.018,.018,.65,6),m.brass,0,-.3,0,lantern);
  const bulb=add(new T.SphereGeometry(.24,12,10),lanternPaper,0,-.8,0,lantern);bulb.scale.y=1.4;
  add(new T.CylinderGeometry(.17,.17,.055,12),m.brass,0,-1.13,0,lantern);mergeStaticMeshes(lantern);const halo=new T.Sprite(new T.SpriteMaterial({map:haloMap,color:0xffcc87,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.position.set(0,-.8,0);halo.scale.set(1.7,2.1,1);lantern.add(halo);halos.push(halo);
 }
 // Arch silhouettes make the next bend readable from a distance.
 for(const z of [26,70,116]){const x=streetX(z);for(const side of [-1,1])add(new T.CylinderGeometry(.18,.24,4,12),red,x+side*3.3,2,z);box(x,4,z,7.6,.22,.45,m.wood);add(curvedRoof(8.2,1.3,.6),m.dark,x,4.15,z);}
 function sign(text,x,y,z,w=3,h=.36){const o=label(text,x,y,z,w,h,root);o.rotation.y=Math.PI;signs.push(o);return o;}
 sign('LANTERN MILE',0,4.3,9,3,.32);
 sign('FOLLOW THE GOLD LAMPS',2.5,2,11,2,.25);
 sign('Right trigger / click: shoot',2.5,1.6,11,2,.22);
 sign('X / R: reload · 8 rounds',2.5,1.25,11,2,.22);
 sign('Glowing muzzle? Move to dodge.',2.5,.9,11,2,.22);
 sign('CHECKPOINT',streetX(70),3.55,70,2.2,.25);

 const gate=box(streetX(120),1.65,120,7,3.3,.18,m.teal);occluders.push(gate);
 const gatePanel=new T.Group();gatePanel.position.set(streetX(116),0,116);gatePanel.rotation.y=Math.PI;root.add(gatePanel);
 label('OPEN THE GATE',0,3.45,0,3.6,.4,gatePanel);const instructions=label('Click each arrow until it points UP',0,2.15,0,2.8,.38,gatePanel);signs.push(instructions);label('VR: point and press the right trigger',0,2.65,0,2.8,.28,gatePanel);
 const dialButtons=[];for(let i=0;i<3;i++)dialButtons.push(button('',-1+i,1.5,.04,.65,.65,'dial:'+i,gatePanel).o);
 const dialArrows=[];for(let i=0;i<3;i++){const a=new T.Group();a.position.set(-1+i,1.5,.095);gatePanel.add(a);box(0,0,0,.045,.27,.018,m.glow,a);const tip=add(new T.ConeGeometry(.105,.13,3),m.glow,0,.17,0,a);tip.rotation.y=Math.PI/2;dialArrows.push(a);}
 sign('SAFE ZONE',streetX(115)+2.5,1,115,1.25,.2);
 // The canal ends at the storm portal; final delivery is upstairs in the foundry.
 const portal=new T.Group();portal.position.set(0,2,145);root.add(portal);
 const ring=add(new T.TorusGeometry(1.7,.11,12,64),m.brass,0,0,0,portal);
 const veil=add(new T.CircleGeometry(1.58,48),new T.MeshBasicMaterial({color:0x73b4c8,transparent:true,opacity:.45,side:T.DoubleSide}),0,0,0,portal);
 sign('NEXT STOP · THE ROOFTOPS',0,4.25,145,4.2,.4);
 const portalPanel=new T.Group();portalPanel.position.set(2.55,0,142);portalPanel.rotation.y=Math.PI;root.add(portalPanel);
 const portalButton=button('ENTER PORTAL',0,1.25,0,1.6,.3,'portal',portalPanel).o;
 sign('Walk through the ring',0,3.95,145,2.6,.28);
 for(let i=0;i<6;i++){
  const z=21+i*16,x=streetX(z)+(i%2?1.7:-1.7),g=new T.Group();g.position.set(x,1.4,z);root.add(g);
  const silhouette=[new T.Vector2(.43,-.8),new T.Vector2(.36,-.5),new T.Vector2(.31,-.2),new T.Vector2(.4,.15),new T.Vector2(.24,.43),new T.Vector2(.12,.58)];const cloak=add(new T.LatheGeometry(silhouette,20),ink,0,-.15,0,g);cloak.material.side=T.DoubleSide;
  const face=add(new T.SphereGeometry(.23,14,10),m.paper,0,.4,.1,g);face.scale.set(.85,1.2,.5);
  for(const side of [-1,1])add(new T.SphereGeometry(.035,8,6),eyes,side*.09,.43,.2,g);
  mergeStaticMeshes(g);
  const hitbox=add(new T.SphereGeometry(.65,10,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,.05,0,g);hitbox.userData.action='spirit:'+i;hitbox.userData.label='Hollow spirit';interactives.push(hitbox);
  enemies.push({root:g,hitbox,x,z,hp:2,cooldown:1});
 }
 const mistGeometry=new T.BufferGeometry(),points=[];for(let i=0;i<180;i++)points.push(streetX(i%146)+Math.sin(i*2.4)*3, .4+(i*.23)%4,i%146);mistGeometry.setAttribute('position',new T.Float32BufferAttribute(points,3));const motes=add(mistGeometry,new T.PointsMaterial({color:0xd7cba1,size:.045,transparent:true,opacity:.5}),0,0,0);root.remove(motes);const particles=new T.Points(mistGeometry,motes.material);root.add(particles);
 const exclusions=new Set([...animated,...signs,gate,gatePanel,portal,portalPanel,particles,...enemies.map(e=>e.root)]);mergeStaticMeshes(root,exclusions);
 const fire=createEnemyFire({root,enemies,occluders});
 function refresh(){dialArrows.forEach((o,i)=>o.rotation.z=(state.dials[i]-1)*Math.PI/2);dialButtons.forEach(o=>{o.userData.active=!state.unlocked;});gate.visible=!state.unlocked;portalButton.userData.active=state.stage==='portal';}
 function start(){state.start();fire.clear();dismissPanel(gatePanel,false,0);root.visible=true;enemies.forEach(e=>{e.hp=2;e.root.visible=true;e.root.position.set(e.x,1.4,e.z);e.cooldown=1;});refresh();}
 function action(a){let ok=false;if(a.startsWith('dial:'))ok=state.turn(Number(a.slice(5)));if(a==='portal'&&state.stage==='portal'){state.stage='rooftops';ok=true;}if(a==='deliver')ok=state.deliver();refresh();return ok;}
 function shoot(a,damage=1){const e=enemies[Number(a.split(':')[1])];if(!e||e.hp<=0||!a.startsWith('spirit:'))return false;if((e.hp=Math.max(0,e.hp-damage))===0){e.root.visible=false;state.kills++;}return true;}
 function tick(dt,time,worldPlayer){
  dismissPanel(gatePanel,state.unlocked,dt);const player={x:worldPlayer.x,z:worldPlayer.z-root.position.z};state.tick(dt);const checkpoint=state.active&&state.progress(player.z);let hurt=false,respawn=false;
  halos.forEach((o,i)=>o.material.opacity=.57+Math.sin(time*1.4+i)*.09);animated.forEach((o,i)=>o.rotation.z=Math.sin(time*.8+i)*.06);particles.position.y=Math.sin(time*.4)*.1;ring.rotation.z=time*.1;veil.material.opacity=.35+Math.sin(time*.8)*.1;
  for(const e of enemies){if(e.hp<=0)continue;e.cooldown=Math.max(0,e.cooldown-dt);const dx=player.x-e.root.position.x,dz=player.z-e.root.position.z,d=Math.hypot(dx,dz);e.root.position.y=1.4+Math.sin(time*.9+e.z)*.09;e.root.rotation.y=Math.atan2(dx,dz);if(d>=9||!state.active){const blend=Math.min(1,dt*.5);e.root.position.x+=(e.x+Math.sin(time*.38+e.z)*.18-e.root.position.x)*blend;e.root.position.z+=(e.z+Math.cos(time*.29+e.z)*.16-e.root.position.z)*blend;}
   const safe=!state.active||player.z<10||Math.abs(player.z-70)<4||player.z>112||state.stage==='delivered';
   if(d<9&&!safe){if(d<1.45&&d>.001){const x=player.x-dx/d*1.45,z=player.z-dz/d*1.45;if(streetWalkable(x,z,true)){e.root.position.x=x;e.root.position.z=z;}}if(d>1.65){const next=streetMove(e.root.position,dx/d*dt*.32,dz/d*dt*.32,true);e.root.position.x=next.x;e.root.position.z=next.z;}else if(!e.cooldown&&state.invulnerable===0){respawn=state.damage();hurt=true;e.cooldown=2.5;if(respawn){enemies.forEach(q=>{q.root.position.set(q.x,1.4,q.z);q.cooldown=2;});break;}}}
  }
  const shot=fire.tick(dt,{...player,y:worldPlayer.y},!state.active||player.z<10||Math.abs(player.z-70)<4||player.z>112||respawn);if(shot.hit&&state.invulnerable===0){respawn=state.damage();hurt=true;}if(respawn)fire.clear();
  return {checkpoint,hurt,respawn,fired:shot.fired};
 }
 return {root,state,atPortal:(x,z)=>state.stage==='portal'&&insidePortal(x,z-root.position.z),start,refresh,action,shoot,tick,enemies,walkable:(x,z)=>streetWalkable(x,z-root.position.z,state.unlocked),move:(p,dx,dz)=>{const q=streetMove({x:p.x,z:p.z-root.position.z},dx,dz,state.unlocked);return {x:q.x,z:q.z+root.position.z};},spawn:()=>({x:streetX(state.checkpoint),z:state.checkpoint+root.position.z}),stop(){fire.clear();root.visible=false;state.active=false;}};
}
