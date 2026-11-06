import * as T from './vendor/three.module.js';
import {roundedBlock,curvedRoof,mergeStaticMeshes} from './architecture.js';
import {createPistol} from './vr-props.js';
export const WEAPONS={service:{name:'Service pistol',interval:200,damage:1,color:0xb5ffe0,description:'A reliable sidearm for a long night. Fire quickly and keep moving.'},warden:{name:'Warden pistol',interval:500,damage:2,color:0xffd69c,description:'A heavier sidearm with a spectral core. One clean hit clears a spirit. Make each shot count.'}};
export function createLobby(){
 const scene=new T.Scene();scene.background=new T.Color(0x213e47);scene.fog=new T.FogExp2(0x213e47,.018);
 const camera=new T.PerspectiveCamera(48,1,.1,130);camera.position.set(1.4,2.8,18);camera.lookAt(-.4,3,-18);
 scene.add(new T.HemisphereLight(0xffdfac,0x23464e,2.4));const sun=new T.DirectionalLight(0xffc482,2.6);sun.position.set(-12,18,8);scene.add(sun);
 const root=new T.Group();scene.add(root);const animated=[];
 const material=(color,metalness=0,roughness=.8)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const wood=material(0x52443b),teal=material(0x34615d),dark=material(0x233c43),paper=material(0xc7b493),red=material(0x915c4e),gold=material(0xc49c64,.5,.35),stone=material(0x53696c),glow=new T.MeshBasicMaterial({color:0xffcf8c});
 const add=(g,m,x,y,z,p=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;};
 const box=(x,y,z,w,h,d,m,p=root)=>add(roundedBlock(w,h,d,.07),m,x,y,z,p);
 box(0,-.5,-14,110,.3,110,material(0x1c5156,.6,.24));box(0,-.18,0,8,.3,70,stone);
 for(let z=-28;z<20;z+=2){for(const x of [-3.7,3.7]){box(x,.7,z,.13,1.4,.13,wood);box(x,.65,z,.12,.08,2,gold);box(x,1.25,z,.15,.12,2,wood);}}
 for(let z=-24,i=0;z<12;z+=10,i++)for(const side of [-1,1]){const x=side*9,h=6+(i%2)*2;
  box(x,h/2,z,7,h,8,i%2?teal:red);
  for(const y of [h*.53,h]){add(curvedRoof(8.6,9.3,1.5),dark,x,y,z).material.side=T.DoubleSide;box(x,y-.25,z,7.4,.15,8.5,gold);}
  for(const dz of [-3,0,3]){box(x-side*3.55,h*.35,z+dz,.08,2,1.5,glow);for(let j=-2;j<=2;j++)box(x-side*3.61,h*.35,z+dz+j*.26,.08,2,.035,wood);box(x-side*3.62,h*.35,z+dz,.08,.035,1.5,wood);}
  for(const dz of [-3.9,3.9])box(x-side*3.6,h/2,z+dz,.22,h,.22,wood);
  // Shop curtains and eave brackets produce a detailed silhouette from the street.
  for(let j=0;j<5;j++)box(x-side*3.8,2.2,z-1.3+j*.65,.055,.65,.55,j%2?paper:teal);
  for(const dz of [-3,-1,1,3])box(x-side*3.9,h*.53-.55,z+dz,.75,.15,.16,wood);
  const lantern=new T.Group();lantern.position.set(side*3,4,z+1);root.add(lantern);animated.push(lantern);
  add(new T.CylinderGeometry(.018,.018,1,8),gold,0,-.5,0,lantern);const bulb=add(new T.SphereGeometry(.36,16,12),glow,0,-1.3,0,lantern);bulb.scale.y=1.4;
  for(const y of [-.82,-1.78])add(new T.CylinderGeometry(.23,.23,.06,12),gold,0,y,0,lantern);
  for(let j=0;j<8;j++){const a=j*Math.PI/4;const rib=add(new T.TorusGeometry(.36,.008,4,28),gold,0,-1.3,0,lantern);rib.rotation.y=a;rib.scale.y=1.4;}mergeStaticMeshes(lantern);
 }
 // A distant gate and layered skyline frame the canal rather than a flat backdrop.
 for(const z of [-14,-30]){for(const x of [-3.5,3.5])add(new T.CylinderGeometry(.2,.28,5,16),red,x,2.5,z);box(0,4.85,z,8.4,.3,.55,wood);add(curvedRoof(9,1.8,.8),dark,0,5,z);}
 for(let i=0;i<12;i++){const x=-40+i*7,h=10+(i%4)*3;box(x,h/2,-47,6,h,7,i%2?dark:teal);add(curvedRoof(8,9,2),dark,x,h,-47);}
 add(new T.SphereGeometry(3.8,32,24),new T.MeshBasicMaterial({color:0xe4d9b9}),-12,23,-65);
 const points=[];for(let i=0;i<100;i++)points.push(Math.sin(i*2.4)*5,.8+(i*.17)%5,-28+(i*.73)%48);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));const motes=new T.Points(geo,new T.PointsMaterial({color:0xffd58b,size:.035,transparent:true,opacity:.65,depthWrite:false}));root.add(motes);
 mergeStaticMeshes(root,new Set([...animated,motes]));
 const armory=new T.Scene();armory.background=new T.Color(0x173638);armory.fog=new T.Fog(0x173638,12,45);armory.add(new T.HemisphereLight(0xffe9c2,0x275a60,3));const key=new T.DirectionalLight(0xffd698,4);key.position.set(3,5,5);armory.add(key);const rim=new T.DirectionalLight(0x84d6d0,3);rim.position.set(-3,2,-4);armory.add(rim);
 const previewCamera=new T.PerspectiveCamera(42,1,.01,50);previewCamera.position.set(0,1.8,6);previewCamera.lookAt(0,1,0);
 const mount=new T.Group();armory.add(mount);mount.position.set(1.65,1.45,0);let model;
 const pedestal=add(new T.CylinderGeometry(1,1.12,.16,64),dark,1.65,.45,0,armory);add(new T.TorusGeometry(.94,.012,8,64),gold,1.65,.54,0,armory).rotation.x=Math.PI/2;
 let weapon='service',screen='home',spin=true,angle=35;
 function select(id){weapon=WEAPONS[id]?id:'service';if(model){mount.remove(model);const gs=new Set(),ms=new Set();model.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}model=createPistol({variant:weapon,hand:false});model.scale.setScalar(8);model.position.set(0,.25,.3);mount.add(model);}
 select('service');
 return {scene,camera,armory,previewCamera,get weapon(){return weapon;},select,setScreen(s){screen=s;},get screen(){return screen;},rotate(value){angle=Number(value);spin=false;},setSpin(v){spin=v;},get spinning(){return spin;},tick(dt,t,aspect,reduced=false){camera.aspect=previewCamera.aspect=aspect;camera.updateProjectionMatrix();previewCamera.updateProjectionMatrix();animated.forEach((a,i)=>a.rotation.z=reduced?0:Math.sin(t*.7+i)*.045);motes.position.y=reduced?0:Math.sin(t*.3)*.1;if(spin&&!reduced)angle+=dt*14;mount.rotation.y=angle*Math.PI/180;mount.rotation.z=-.1;const narrow=aspect<1;mount.position.set(narrow?0:1.65,narrow?.15:1.45,0);pedestal.visible=!narrow;return screen==='armory'?{scene:armory,camera:previewCamera}:{scene,camera};}};
}
export function bindLobby(lobby,equip){
 if(!document.querySelectorAll)return;
 const $=id=>document.getElementById(id);let selected=lobby.weapon;
 const summary=()=>{$('loadoutSummary').textContent=WEAPONS[lobby.weapon].name+' · '+({journey:'Full journey',delivery:'Canal',training:'Practice'}[$('chapter').value]||'Full journey');};
 function home(){lobby.setScreen('home');$('homeScreen').hidden=false;$('armoryScreen').hidden=true;$('armoryOpen').focus();}
 $('armoryOpen').onclick=()=>{selected=lobby.weapon;showWeapon(selected);lobby.setScreen('armory');$('homeScreen').hidden=true;$('armoryScreen').hidden=false;$('armoryBack').focus();};
 $('armoryBack').onclick=()=>{lobby.select(selected);home();};
 $('equipWeapon').onclick=()=>{equip(lobby.weapon);selected=lobby.weapon;summary();home();};
 function showWeapon(id){lobby.select(id);const w=WEAPONS[id];$('weaponName').textContent=w.name;$('weaponDescription').textContent=w.description;$('weaponHits').textContent=String(2/w.damage);$('weaponRate').textContent=w.interval/1000+'s';document.querySelectorAll('[data-weapon]').forEach(b=>{const on=b.dataset.weapon===id;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
 document.querySelectorAll('[data-weapon]').forEach(b=>b.onclick=()=>showWeapon(b.dataset.weapon));
 $('weaponRotate').oninput=()=>{lobby.rotate($('weaponRotate').value);$('autoRotate').textContent='Auto-rotate: off';$('autoRotate').setAttribute('aria-pressed','false');};
 $('autoRotate').onclick=()=>{lobby.setSpin(!lobby.spinning);$('autoRotate').textContent='Auto-rotate: '+(lobby.spinning?'on':'off');$('autoRotate').setAttribute('aria-pressed',String(lobby.spinning));};
 for(const name of ['route','settings','controls'])$(name+'Open').onclick=()=>$(name+'Dialog').showModal();
 document.querySelectorAll('dialog').forEach(d=>{d.querySelectorAll('.close-dialog,.close-action').forEach(b=>b.onclick=()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
 document.querySelectorAll('input[name="route"]').forEach(input=>input.onchange=()=>{$('chapter').value=input.value;summary();});
 document.querySelectorAll('[data-controls]').forEach(b=>b.onclick=()=>{const quest=b.dataset.controls==='quest';$('questControls').hidden=!quest;$('computerControls').hidden=quest;document.querySelectorAll('[data-controls]').forEach(a=>a.classList.toggle('selected',a===b));});
 summary();
}
