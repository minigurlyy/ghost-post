import {Magazine} from './vr-combat.js';
import * as T from './vendor/three.module.js';
import {roundedBlock,archShape,curvedRoof,mergeStaticMeshes} from './architecture.js';
import {View} from './view.js';
import {createPistol,createDispatcher} from './vr-props.js';
import {createFoundry} from './vr-foundry.js';
import {createDistrict} from './vr-district.js';
import {createLobby,bindLobby,WEAPONS} from './vr-lobby.js';
import {Dialogue} from './vr-dialogue.js';
import {LIFT_DURATION} from './vr-rooftop-logic.js';
import {PostAudio} from './vr-audio.js';
import {Shift,SEAL,walkable,moveXZ,deadzone,eyeOffset} from './vr-logic.js';

const $=id=>document.getElementById(id);
const ui={landing:$('landing'),enter:$('enter'),desktop:$('desktop'),status:$('status'),hud:$('desktopHud'),objective:$('objective'),hint:$('hint')};
const magazine=new Magazine();
let travelTip,travelTipTime=0;
let ammoLabel,guideRing,guideArrow,guideText,guideTrail=[];
const shift=new Shift(),clock=new T.Clock(),sound=new PostAudio();
let renderer,scene,camera,rig,room,toolkit,gun,parcel,parcelBadge,missionBoard,menu,teleportRing;
let mode='landing',paused=false,teleportMode=false,heightOffset=0,pendingHeight=false,running=false,time=0,pitch=0,turnLatch=false;
let lobby,weaponId="service",dialogue,subtitle;
let lastShot=0,renderFailure=false,stepDistance=0,stampAt=-10;
let sortingBoard,rangeBoard,completion,clerk,stampTool,passSeal;
const dynamic=[],shelfPairs=[],mailWings=[];
let exitSign,healthBars=[],selectedChapter=null;
let bellUntil=0,proximityHint,lastMuzzleTime=-10,district,foundry,deliveryStatus,lastDeliveryText='';
const keys=new Set(),controllers=[],targets=[],interactives=[],occluders=[],labels=[],lanterns=[],sparks=[];
const raycaster=new T.Raycaster(),matrix=new T.Matrix4(),v=new T.Vector3(),head=new T.Vector3(),direction=new T.Vector3();
const floorY=0;
function mesh(geometry,material,x,y,z,parent=room){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o;}
function mat(color,emissive=0){return new T.MeshStandardMaterial({color,roughness:.82,emissive,emissiveIntensity:.5,map:toolkit?.tex});}
const materials={};
function block(x,y,z,w,h,d,m,parent=room){return mesh(roundedBlock(w,h,d,.08),m,x,y,z,parent);}
function label(text,x,y,z,w=2.5,h=.42,parent=room,color='#ffe7b9',bg='#142f32'){
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*256);canvas.height=Math.ceil(h*256);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const o=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,transparent:true,depthWrite:false}),x,y,z,parent);
  o.userData.ink=color;o.userData.bg=bg;drawLabel(o,text);return o;
}
function glass(g,w,h){
 g.clearRect(0,0,w,h);const r=Math.min(22,h*.2);g.beginPath();g.roundRect(2,2,w-4,h-4,r);
 const sheen=g.createLinearGradient(0,0,w,h);sheen.addColorStop(0,'rgba(65,89,99,.86)');sheen.addColorStop(.5,'rgba(14,28,39,.78)');sheen.addColorStop(1,'rgba(31,47,55,.88)');g.fillStyle=sheen;g.fill();g.strokeStyle='rgba(239,207,151,.6)';g.lineWidth=2;g.stroke();
 g.fillStyle='rgba(255,228,175,.85)';g.fillRect(18,h*.24,3,h*.52);
}
function drawLabel(o,text){
  const c=o.material.map.image,g=c.getContext('2d'),w=c.width,h=c.height;
  glass(g,w,h);g.strokeStyle=o.userData.ink||'#ffe7b9';
  g.fillStyle=g.strokeStyle;g.textAlign='center';g.textBaseline='middle';
  let size=Math.floor(h*.37);g.font='bold '+size+'px Georgia';
  size=Math.min(size,Math.floor(size*(w-22)/Math.max(1,g.measureText(text).width)));g.font='bold '+size+'px Arial';g.fillText(text,w/2,h/2);
  o.userData.signText=text;o.userData.label=text;o.material.map.needsUpdate=true;
}
function glyph(o,symbol,lit=false){
  const c=o.material.map.image,g=c.getContext('2d'),w=c.width,h=c.height;
  g.fillStyle=lit?'#46786c':'#29464b';g.fillRect(0,0,w,h);g.strokeStyle=lit?'#b5ffe0':'#ffe7b9';g.fillStyle=g.strokeStyle;g.lineWidth=3;
  g.strokeRect(5,5,w-10,h-10);g.save();g.translate(w/2,h*.4);const r=h*.22;
  if(symbol==='MOON'){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();g.fillStyle=lit?'#46786c':'#29464b';g.beginPath();g.arc(r*.55,-r*.35,r*.85,0,Math.PI*2);g.fill();}
  if(symbol==='WAVE'){for(let j=-1;j<=1;j++){g.beginPath();for(let i=0;i<=30;i++){const x=(i/30-.5)*r*3,y=Math.sin(i/30*Math.PI*3)*r*.22+j*r*.42;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}}
  if(symbol==='LANTERN'){g.strokeRect(-r*.62,-r*.7,r*1.24,r*1.4);g.beginPath();g.moveTo(-r*.8,-r*.85);g.lineTo(r*.8,-r*.85);g.moveTo(0,-r*.85);g.lineTo(0,-r*1.2);g.moveTo(-r*.8,r*.85);g.lineTo(r*.8,r*.85);g.stroke();}
  g.restore();g.fillStyle=lit?'#b5ffe0':'#ffe7b9';g.textAlign='center';g.font='bold '+Math.floor(h*.13)+'px Arial';g.textBaseline='middle';g.fillText(symbol,w/2,h*.83);
  o.material.map.needsUpdate=true;
}
function button(text,x,y,z,w,h,action,parent=room){
  const plate=block(x,y,z,w+.06,h+.06,.07,new T.MeshStandardMaterial({color:0x283943,metalness:.35,roughness:.22,transparent:true,opacity:.65}),parent);
  const o=label(text,x,y,z+.041,w,h,parent);o.userData.plate=plate;o.userData.action=action;o.userData.label=text;interactives.push(o);labels.push(o);return {plate,o};
}
function panel(w,h){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,transparent:true,depthWrite:false}));
  o.userData.canvas=canvas;return o;
}
function paintPanel(o,title,lines,footer='GHOST POST / FIRST SHIFT'){
  const c=o.userData.canvas,g=c.getContext('2d'),w=c.width,h=c.height;glass(g,w,h);
  g.textAlign='left';g.textBaseline='middle';g.fillStyle='#d0b384';g.font=Math.floor(h*.065)+'px Arial';g.fillText(footer,32,h*.13,w-64);
  g.fillStyle='#fff0d0';g.font='bold '+Math.floor(h*.18)+'px Georgia';g.fillText(title,32,h*.34,w-64);
  const many=lines.length>2;g.font=Math.floor(h*(many?.085:.115))+'px Arial';lines.slice(0,4).forEach((line,i)=>{g.fillStyle='#f1ede1';g.fillText(line,32,h*(many?.52+i*.12:.62+i*.20),w-64);});o.material.map.needsUpdate=true;
}
function replaceLabel(o,text){if(o.userData.signText!==text)drawLabel(o,text);}
function init(){
  renderer=new T.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.setSize(innerWidth,innerHeight);
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFramebufferScaleFactor(.85);
  scene=new T.Scene();scene.background=new T.Color(0x667f81);scene.fog=new T.Fog(0x667f81,24,100);
  scene.add(new T.HemisphereLight(0xffe5bc,0x354f59,2.3));
  const sun=new T.DirectionalLight(0xffd09b,2.1);sun.position.set(-10,18,12);scene.add(sun);
  room=new T.Group();scene.add(room);rig=new T.Group();rig.position.set(0,0,5);scene.add(rig);
  camera=new T.PerspectiveCamera(70,innerWidth/innerHeight,.06,110);camera.position.y=1.65;rig.add(camera);
  toolkit={scene:room,camera,ambient:[]};
  for(const name of ['texture','mat','box','sphere','cyl','sign','spirit','makeGun'])toolkit[name]=View.prototype[name];
  toolkit.tex=toolkit.texture();
  Object.assign(materials,{wood:mat(0x7d604b),dark:mat(0x2b4449),plaster:mat(0xc7b394),teal:mat(0x447b76),brass:new T.MeshStandardMaterial({color:0xc6a367,metalness:.65,roughness:.42}),paper:mat(0xe5cba1),glow:mat(0xf4c575,0xffb85c)});
  buildRoom();buildMission();buildMenu();buildControllers();
  proximityHint=label('Walk a little closer',0,0,0,1.8,.25,scene);proximityHint.visible=false;
  gun=createPistol();camera.add(gun);gun.visible=false;
  parcelBadge=block(-.16,-.13,-.14,.12,.09,.085,materials.paper,camera);parcelBadge.visible=false;
  teleportRing=new T.Mesh(new T.RingGeometry(.27,.34,32),new T.MeshBasicMaterial({color:0x91f1cd,side:T.DoubleSide}));teleportRing.rotation.x=-Math.PI/2;teleportRing.visible=false;scene.add(teleportRing);
  // Static room geometry is merged by material to keep headset draw calls low.
  mergeStaticMeshes(room,new Set([...occluders,...interactives,...targets.flatMap(t=>[t.root]),...lanterns,parcel,missionBoard,...labels,menu,...dynamic]));
  district=createDistrict({scene,materials,label,button,interactives,occluders});
  foundry=createFoundry({scene,materials,label,button,occluders,replaceLabel,interactives});
  deliveryStatus=label('',0,-.10,.095,.14,.035,gun);deliveryStatus.visible=false;
  ammoLabel=label('8 / 8',0,-.06,.10,.18,.035,gun);
  buildGuidance();
  travelTip=panel(2.4,.6);travelTip.name='Travel controls reminder';travelTip.visible=false;travelTip.material.color.set(0xffdf9b);scene.add(travelTip);
  for(let i=0;i<3;i++){const b=mesh(new T.BoxGeometry(.035,.008,.004),new T.MeshBasicMaterial({color:0x9ae4b5}),-.045+i*.045,-.127,.099,gun);healthBars.push(b);}
  lobby=createLobby();bindLobby(lobby,equipWeapon);
  subtitle=panel(2.1,.64);subtitle.visible=false;scene.add(subtitle);subtitle.renderOrder=1100;subtitle.material.depthTest=false;subtitle.material.depthWrite=false;
  dialogue=new Dialogue(text=>{subtitle.visible=!!text;if(text){const [speaker,...words]=text.split('|');const content=words.join('|'),parts=content.match(/.{1,48}(?:\s|$)/g)||[content];paintPanel(subtitle,speaker,parts.slice(0,4),'GHOST POST');}if($('captions'))$('captions').textContent=text.replace('|',': ');});
  updateMission();
  renderer.xr.addEventListener('sessionend',()=>{mode='landing';paused=false;sound.setActive(false);keys.clear();ui.landing.hidden=false;ui.hud.hidden=true;ui.enter.disabled=false;ui.enter.textContent='Enter VR';camera.position.set(0,1.65,0);camera.rotation.set(0,0,0);rig.position.y=0;rig.add(gun);gun.visible=false;menu.visible=false;teleportRing.visible=false;ui.status.textContent='VR session ended. Enter again to continue your shift.';});
  addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
  document.addEventListener('keydown',e=>{if(mode!=='desktop')return;if(['KeyW','KeyA','KeyS','KeyD','KeyE','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyE'&&!e.repeat&&!paused)use(camera);if(e.code==='Space'&&!e.repeat&&!paused)jump();if(e.code==='KeyR'&&!e.repeat&&!paused)reload();});
  document.addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>{keys.clear();});
  document.addEventListener('mousemove',e=>{if(mode!=='desktop'||document.pointerLockElement!==renderer.domElement)return;rig.rotation.y-=e.movementX*.002;pitch=T.MathUtils.clamp(pitch-e.movementY*.002,-1.25,1.25);camera.rotation.x=pitch;});
  renderer.domElement.addEventListener('click',()=>{if(mode==='desktop'&&!paused&&document.pointerLockElement===renderer.domElement)use(camera);});
  document.addEventListener('pointerlockchange',()=>{if(mode!=='desktop')return;paused=!document.pointerLockElement;keys.clear();ui.landing.hidden=!paused;ui.hud.hidden=paused;if(paused){ui.desktop.textContent='Resume on this computer';ui.status.textContent='Paused. Resume to capture the mouse again.';}});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('Graphics paused. Reload this page to restart the VR prototype.');renderer.xr.getSession()?.end();});
  ui.desktop.onclick=startDesktop;ui.enter.onclick=startVR;
  $('musicVolume').oninput=()=>audioLevels(Number($('musicVolume').value),sound.effects);
  $('effectsVolume').oninput=()=>audioLevels(sound.music,Number($('effectsVolume').value));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.setActive(false);});
  clerk.userData.ready.finally(()=>{ui.desktop.disabled=false;checkVR();});renderer.setAnimationLoop(frame);
}
function buildRoom(){
  // One floor surface. Inlaid seams are raised enough to avoid depth flicker.
  block(0,-.16,-1.5,15,.3,17,materials.wood);
  for(let x=-6.5;x<7;x+=1){const line=block(x,.002,-1.5,.013,.004,16,materials.dark);}
  const walls=[[0,2.8,-10,15,5.6,.4],[-7.5,2.8,-1.5,.4,5.6,17],[7.5,2.8,-1.5,.4,5.6,17],[-5.5,2.8,7,4,5.6,.4],[5.5,2.8,7,4,5.6,.4]];
  for(const a of walls){const o=block(...a,materials.plaster);occluders.push(o);}
  const ceiling=mat(0x967b5d,0x40382b);ceiling.emissiveIntensity=.22;
  block(0,5.65,-1.5,15,.25,17,ceiling);
  for(let x=-6.5;x<=6.5;x+=1)block(x,5.5,-1.5,.025,.04,17,materials.wood);
  for(const [x,z] of [[-3,1],[4,-3]]){const light=new T.PointLight(0xffce8a,9,8,2);light.position.set(x,3.8,z);scene.add(light);}
  for(const z of [-8,-3,2,6]){block(0,5.2,z,15,.3,.3,materials.wood);for(const x of [-7,7])block(x,2.65,z,.3,5.3,.3,materials.wood);}
  label('G H O S T   P O S T',0,4.25,-9.73,6,.85);
  // Keep the range instructions separate from the overhead wordmark.
  for(const x of [-5,0,5])for(const z of [-6,2]){
    const swing=new T.Group();swing.position.set(x,5.1,z);room.add(swing);lanterns.push(swing);dynamic.push(swing);
    mesh(new T.CylinderGeometry(.013,.013,.8,8),materials.dark,0,-.4,0,swing);
    const bulb=mesh(new T.SphereGeometry(.3,16,12),materials.glow,0,-.95,0,swing);bulb.scale.y=1.35;
    for(const y of [-.55,-1.35])mesh(new T.CylinderGeometry(.2,.2,.065,12),materials.brass,0,y,0,swing);
    mesh(new T.CylinderGeometry(.009,.009,.2,6),materials.wood,0,-1.47,0,swing);
    mergeStaticMeshes(swing);
  }
  for(const x of [-7.1,7.1]){
    block(x,1.7,-2,.65,3.4,13,materials.wood);
    for(let z=-7;z<4;z+=1.2)for(let y=.6;y<3.4;y+=.9){
      block(x-Math.sign(x)*.38,y,z,.3,.7,1.04,materials.dark);
      const index=Math.round((z+7)/1.2)+Math.round(y*10);
      if(index%5===0)continue;
      const moving=index%5===4&&z<2.6;const parent=moving?new T.Group():room;
      if(moving){parent.position.set(x-Math.sign(x)*.55,y-.16,z);room.add(parent);dynamic.push(parent);shelfPairs.push({o:parent,x:parent.position.x,y:parent.position.y,z,side:Math.sign(x),phase:shelfPairs.length*2.7});}
      const px=moving?0:x-Math.sign(x)*.55,py=moving?0:y-.16,pz=moving?0:z;
      const p=block(px,py,pz,.25,.28+(index%3)*.09,.4+(index%4)*.12,index%3===0?materials.teal:materials.paper,parent);p.rotation.x=.08*Math.sin(z);
      block(px-Math.sign(x)*.14,py,pz,.025,.12,.17,materials.brass,parent);
    }
  }
  // Warm shoji screens and brass inlays tie the office to the district's visual language.
  for(const x of [-5.5,5.5]){block(x,3.6,-9.74,2.3,2,.045,materials.glow);for(let j=-3;j<=3;j++)block(x+j*.32,3.6,-9.7,.035,2,.04,materials.wood);for(const y of [2.95,3.6,4.25])block(x,y,-9.68,2.3,.035,.04,materials.wood);}
  for(const x of [-7.25,7.25])for(const y of [.3,4.7])block(x,y,-1.5,.1,.06,16,materials.brass);
  const desk=block(-3,.425,0,4,.85,1.2,materials.teal);occluders.push(desk);block(-3,.91,0,4.2,.12,1.4,materials.wood);
  const sorter=block(4,.425,-4,3,.85,1.2,materials.wood);occluders.push(sorter);block(4,.91,-4,3.2,.12,1.35,materials.teal);
  clerk=createDispatcher();clerk.position.set(-3,0,-1.15);room.add(clerk);dynamic.push(clerk);
  label('DISPATCH',-3,2.45,-1.5,1.4,.2);
  const bell=mesh(new T.SphereGeometry(.10,20,12,0,Math.PI*2,0,Math.PI/2),materials.brass,-4.3,1.035,.37);bell.userData.action='bell';bell.userData.label='Ring the desk bell';interactives.push(bell);
  mesh(new T.CylinderGeometry(.12,.13,.045,20),materials.dark,-4.3,.99,.37);mesh(new T.CylinderGeometry(.018,.018,.045,12),materials.brass,-4.3,1.14,.37);
  label('RING FOR DISPATCH',-4.3,1.22,.61,1.1,.16);
  for(let i=0;i<3;i++){const letter=new T.Group();letter.position.set(-5.7+i*.3,3.5,1+i*.5);room.add(letter);dynamic.push(letter);mailWings.push(letter);const paper=block(0,0,0,.23,.14,.012,materials.paper,letter);const seal=mesh(new T.SphereGeometry(.022,8,6),materials.teal,0,0,.013,letter);seal.scale.z=.18;}
  for(const [x,z,rx,rz] of [[-3,0,2.5,1.1],[4,-4,1.9,1],[-3,-1.15,.75,.5]])contactShadow(x,z,rx,rz);
  // An arched street opening with a small painted skyline outside the training boundary.
  const gate=new T.Group();gate.position.set(0,0,7.1);gate.rotation.y=Math.PI;room.add(gate);
  const arch=new T.Shape();arch.moveTo(-3.6,0);arch.lineTo(-3.6,5.4);arch.lineTo(3.6,5.4);arch.lineTo(3.6,0);arch.lineTo(3,0);arch.lineTo(3,2.3);arch.absarc(0,2.3,3,0,Math.PI,false);arch.lineTo(-3,0);
  mesh(new T.ExtrudeGeometry(arch,{depth:.22,bevelEnabled:false}),materials.wood,0,0,0,gate);
  exitSign=label('PICK UP YOUR PARCEL',0,3.7,6.25,3.5,.35);exitSign.rotation.y=Math.PI;dynamic.push(exitSign);
  // Drifting motes add motion without expensive real-time shadows or particle textures.
  const pos=[];for(let i=0;i<90;i++)pos.push(Math.sin(i*2.17)*6,(i*.173)%5,-8+(i*.387)%14);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  const dust=new T.Points(geometry,new T.PointsMaterial({color:0xffd58b,size:.025,transparent:true,opacity:.65}));scene.add(dust);scene.userData.dust=dust;
}
let dispatchButton,sealButtons=[];
function contactShadow(x,z,rx,rz){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gradient=g.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'rgba(18,30,26,.36)');gradient.addColorStop(1,'rgba(18,30,26,0)');g.fillStyle=gradient;g.fillRect(0,0,128,128);
  const texture=new T.CanvasTexture(c),o=mesh(new T.PlaneGeometry(rx*2,rz*2),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),x,.012,z);o.rotation.x=-Math.PI/2;
}
function buildMission(){
  dispatchButton=button('PICK UP A JOB',-3,1.13,.8,1.45,.28,'dispatch').o;
  // Guidance belongs beside each task, never between the player and the range.
  missionBoard=panel(1.7,.62);missionBoard.position.set(-5.45,1.65,.1);room.add(missionBoard);dynamic.push(missionBoard);occluders.push(missionBoard);
  sortingBoard=panel(2.6,.72);sortingBoard.position.set(4,2.05,-4.15);room.add(sortingBoard);dynamic.push(sortingBoard);occluders.push(sortingBoard);
  rangeBoard=panel(2.8,.68);rangeBoard.position.set(0,3.05,-9.5);room.add(rangeBoard);dynamic.push(rangeBoard);occluders.push(rangeBoard);
  for(let i=0;i<3;i++){
    const symbol=['LANTERN','MOON','WAVE'][i],o=button(symbol,3+i,1.27,-3.25,.75,.62,'seal:'+symbol).o;
    glyph(o,symbol);sealButtons.push(o);
  }
  parcel=block(5,1.32,-4,.7,.65,.55,materials.paper);parcel.userData.action='parcel';parcel.userData.label='Collect parcel';interactives.push(parcel);block(0,0,0,.09,.67,.57,materials.brass,parcel);
  // A clear central firing lane; masks are deliberately unlike the friendly clerk.
  for(let i=0;i<3;i++){
    const root=new T.Group();root.position.set(-1.6+i*1.6,1.35,-8.3);room.add(root);
    const mask=mesh(new T.SphereGeometry(.36,18,12),materials.paper,0,0,0,root);mask.scale.set(.8,1.25,.26);
    for(const side of [-1,1]){const eye=mesh(new T.SphereGeometry(.046,10,8),materials.teal,side*.12,.06,.092,root);eye.scale.y=.48;}
    mesh(new T.TorusGeometry(.64,.023,6,40),materials.glow,0,0,-.12,root);
    for(const side of [-1,1]){const ribbon=block(side*.12,-.57,-.02,.08,.45,.018,materials.teal,root);ribbon.rotation.z=side*.15;}
    const hitbox=new T.Mesh(new T.SphereGeometry(.52,12,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));root.add(hitbox);hitbox.userData.action='target:'+i;hitbox.userData.label='Paper spirit target';interactives.push(hitbox);targets.push({root,hitbox,base:1.35});
  }
  const line=block(0,.009,-5.6,4,.012,.045,materials.brass);label('PRACTICE LANE',0,.035,-5.5,2,.32).rotation.x=-Math.PI/2;
  completion=new T.Group();room.add(completion);dynamic.push(completion);completion.visible=false;
  button('START DELIVERY',-5.45,1.13,.13,1.8,.33,'begin',completion);
  const pass=label('COURIER PASS',-1.5,.984,.3,1.05,.55,room,'#385650','#efddb9');pass.rotation.x=-Math.PI/2;labels.push(pass);
  passSeal=label('CLEARED',-1.5,.989,.4,.72,.18,room,'#ae6553','#efddb9');passSeal.rotation.x=-Math.PI/2;dynamic.push(passSeal);passSeal.visible=false;
  stampTool=new T.Group();stampTool.position.set(-1.5,1.09,.3);room.add(stampTool);dynamic.push(stampTool);
  mesh(new T.CylinderGeometry(.12,.12,.06,16),materials.brass,0,-.09,0,stampTool);mesh(new T.CylinderGeometry(.045,.045,.15,12),materials.wood,0,.015,0,stampTool);mesh(new T.SphereGeometry(.085,12,8),materials.wood,0,.13,0,stampTool);
}
let movementButton,musicButton,effectsButton;
function buildMenu(){
  menu=new T.Group();scene.add(menu);menu.visible=false;
  const p=panel(2.2,1.1);p.position.set(0,.45,0);menu.add(p);paintPanel(p,'Delivery paused.',['Right trigger to select.','B / Y to keep going.'], 'GHOST POST / NIGHT SHIFT');
  button('RESUME',-.57,-.25,.01,1.02,.28,'resume',menu);
  button('RESTART SHIFT',.57,-.25,.01,1.02,.28,'restart',menu);
  movementButton=button('WALK / RUN',-.57,-.65,.01,1.02,.28,'movement',menu).o;
  button('RESET HEIGHT',.57,-.65,.01,1.02,.28,'height',menu);
  musicButton=button('MUSIC: LOW',-.57,-1.04,.01,1.02,.28,'music',menu).o;
  effectsButton=button('SFX: BALANCED',.57,-1.04,.01,1.02,.28,'effects',menu).o;
  label('LEFT: WALK + TURN · RIGHT: SNAP',0,-1.42,.01,2.16,.28,menu);
  button('EXIT VR',0,-1.8,.01,2.16,.28,'exit',menu);
  // A stable foreground panel prevents shelves and signs cutting through the menu.
  const backing=block(0,-.43,-.09,2.38,3.3,.06,materials.dark.clone(),menu);
  menu.scale.setScalar(.78);
  menu.traverse(o=>{if(o.isMesh){o.renderOrder=o===backing?1000:1001;const list=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?list.map(m=>m.clone()):o.material.clone();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.depthTest=false;m.depthWrite=false;});}});

}
function buildControllers(){
  for(let i=0;i<2;i++){
    const ray=renderer.xr.getController(i),grip=renderer.xr.getControllerGrip(i);rig.add(ray,grip);
    const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),new T.LineBasicMaterial({color:0x9df5dc,transparent:true,opacity:.75}));line.scale.z=5;ray.add(line);
    const handle=mesh(new T.CapsuleGeometry(.025,.09,4,8),materials.teal,0,0,0,grip);handle.rotation.x=Math.PI/2;
    const c={ray,grip,line,handle,source:null,teleport:false,menuHeld:false,runHeld:false};controllers.push(c);
    ray.addEventListener('connected',e=>{c.source=e.data;});
    ray.addEventListener('disconnected',()=>{c.source=null;c.teleport=false;});
    ray.addEventListener('selectstart',()=>{if(mode!=='vr')return;if(c.source?.handedness==='left'&&!paused)c.teleport=true;else use(ray,c);});
    ray.addEventListener('selectend',()=>{if(c.teleport&&!paused&&c.destination){teleportTo(c.destination);sound.play('teleport');}c.teleport=false;c.destination=null;});
  }
}
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
function aim(object){object.updateWorldMatrix(true,false);raycaster.ray.origin.setFromMatrixPosition(object.matrixWorld);matrix.extractRotation(object.matrixWorld);raycaster.ray.direction.set(0,0,-1).applyMatrix4(matrix);raycaster.near=0;raycaster.far=30;}
function hit(object){
  aim(object);const candidates=interactives.filter(o=>visible(o)&&o.userData.active!==false&&(!paused||menu.getObjectById(o.id)));
  const hits=raycaster.intersectObjects([...candidates,...(paused?[]:occluders.filter(visible))],false);
  return hits[0]?.object.userData.action?hits[0]:null;
}
function use(object,c){
  const h=hit(object);
  if(h){
    const action=h.object.userData.action;
    if(['resume','movement','height','music','effects','restart'].includes(action))sound.play('ui');
    if(action==='music'){audioLevels(sound.music===0?.08:sound.music<.1?.16:0,sound.effects);return;}
    if(action==='effects'){audioLevels(sound.music,sound.effects===0?.45:sound.effects<.6?.65:sound.effects<.75?.85:0);return;}
    if(action==='resume'){toggleMenu(false);return;}
    if(action==='exit'||action==='finish-menu'){dialogue.clear();sound.setActive(false);if(renderer.xr.getSession())renderer.xr.getSession().end();else{mode='landing';document.exitPointerLock();ui.landing.hidden=false;ui.hud.hidden=true;}return;}
    if(action==='height'){camera.getWorldPosition(head);heightOffset+=eyeOffset(head.y-(foundry.run.active?foundry.run.feet:0));rig.position.y=heightOffset+(foundry.run.active?foundry.run.feet:0);toggleMenu(false);return;}
    if(action==='movement'){teleportMode=!teleportMode;running=false;$('locomotion').value=teleportMode?'teleport':'walk';replaceLabel(movementButton,teleportMode?'TELEPORT':'WALK / RUN');return;}
    if(action==='restart'&&district.state.active){beginDelivery();toggleMenu(false);return;}
    if(action==='restart'){magazine.reset();shift.reset();stampAt=-10;rig.position.set(0,heightOffset,5);rig.rotation.y=0;toggleMenu(false);updateMission();return;}
    if(paused)return;
    if(action.startsWith('target:')||action.startsWith('spirit:')||action.startsWith('roofspirit:')){shoot(object,c,h);return;}
    if(h.distance>4.5){notify('Walk a little closer',h.point);return;}
    if(action==='begin'){beginDelivery();return;}
    if(action==='return'){magazine.reset();foundry.stop();district.stop();room.visible=true;scene.background.set(0x667f81);scene.fog.color.set(0x667f81);rig.position.set(0,heightOffset,5);rig.rotation.y=0;dialogue.clear();keys.clear();running=false;shift.mode='journey';shift.reset();selectedChapter='journey';$('chapter').value='journey';stampAt=-10;updateMission();return;}
    if(district.state.active){
      if(action.startsWith('fuse:')&&foundry.run.active&&district.state.stage==='rooftops'){if(foundry.run.toggle(Number(action.slice(5)))){sound.play(foundry.run.power?'unlock':'seal');foundry.refresh(district.state.stage);}return;}
      if(action==='lift'&&foundry.run.active&&foundry.run.power&&district.state.stage==='rooftops'){camera.getWorldPosition(head);if(!foundry.insideCabin(head.x,head.z)){notify('Step inside the lift first',h.point);return;}district.state.stage='elevator';rig.position.y=(mode==='desktop'?0:heightOffset)+8;sound.play('door');dialogue.say('lift');updateDelivery();return;}
      if(district.action(action)){if(action==='portal'){enterStorm();}if(action==='deliver'){dialogue.say('delivered');const d=district.state;drawLabel(foundry.receipt,`${Math.floor(d.elapsed/60)}m ${Math.floor(d.elapsed%60)}s · ${d.kills} spirits · ${d.respawns} respawns`);}sound.play(action==='deliver'?'stamp':district.state.unlocked?'unlock':'seal');pulse(c,.25);updateDelivery();}return;}
    if(action==='bell'){bellUntil=time+2.4;sound.play('bell');pulse(c,.2);return;}
    const ok=shift.act(action);pulse(c,ok?.3:.12);
    const event=!ok?'error':action==='dispatch'?(shift.stage==='done'?'stamp':'dispatch'):action==='parcel'?'parcel':shift.stage==='parcel'?'unlock':'seal';
    sound.play(event);if(ok&&action==='dispatch'&&shift.stage==='seal')dialogue.say('dispatch');if(ok&&action==='parcel'){magazine.reset();dialogue.say('parcel');}if(ok&&shift.stage==='done')stampAt=time;updateMission();
  }else if(!paused&&(['range','outbound'].includes(shift.stage)||district.state.active))shoot(object,c,null);
}
function equipWeapon(id){
  if(!WEAPONS[id]||id===weaponId)return;
  weaponId=id;const old=gun,parent=old.parent;gun=createPistol({variant:id});gun.position.copy(old.position);gun.rotation.copy(old.rotation);gun.visible=old.visible;
  gun.add(deliveryStatus,ammoLabel,...healthBars);if(parent){parent.remove(old);parent.add(gun);}
  const geometries=new Set(),materials=new Set();old.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
function shoot(object,c,h){
  if((!['range','outbound'].includes(shift.stage)&&!district.state.active)||district.state.stage==='delivered'&&district.state.active||performance.now()-lastShot<WEAPONS[weaponId].interval)return;
  if(!magazine.fire()){if(!magazine.remaining){sound.play('empty');notify('Empty · X / R to reload');}return;}
  lastShot=performance.now();lastMuzzleTime=time;aim(object);
  const wall=raycaster.intersectObjects(occluders.filter(visible),false)[0];
  const end=h?h.point:wall?wall.point:raycaster.ray.at(12,new T.Vector3());
  const beam=new T.Line(new T.BufferGeometry().setFromPoints([raycaster.ray.origin.clone(),end]),new T.LineBasicMaterial({color:WEAPONS[weaponId].color,transparent:true,opacity:.9}));scene.add(beam);sparks.push({o:beam,until:time+.08});sound.play('shot');pulse(c,.45);
  const result=h&&(district.state.active?(foundry.run.active?foundry.shoot(h.object.userData.action,WEAPONS[weaponId].damage):district.shoot(h.object.userData.action,WEAPONS[weaponId].damage)):shift.act(h.object.userData.action));if(result==='kill')district.state.kills++;
  if(result){burst(h.point);updateMission();sound.play('hit');}
}
function pulse(c,strength){const h=c?.source?.gamepad?.hapticActuators?.[0];try{h?.pulse(strength,45)?.catch(()=>{});}catch{}}
function burst(point){
  const values=[];for(let i=0;i<28;i++){const a=i*2.399,r=.1+(i%5)*.065;values.push(Math.cos(a)*r,Math.sin(a)*r,(i%3-1)*r);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(values,3));const o=new T.Points(g,new T.PointsMaterial({color:0xffe2a0,size:.045,transparent:true,opacity:1,depthWrite:false}));o.position.copy(point);scene.add(o);sparks.push({o,until:time+.6,born:time,burst:true});
}
function reload(){if(gun.visible&&magazine.reload()){sound.play('reload');pulse(controllers.find(c=>c.source?.handedness==='right'),.2);}}
function enableAudio(){sound.unlock().then(ok=>{if(ok)sound.setActive(mode!=='landing'&&!paused&&!document.hidden);});}
function audioLevels(music,effects){
  sound.setLevels(music,effects);$('musicVolume').value=String(sound.music);$('effectsVolume').value=String(sound.effects);
  replaceLabel(musicButton,'MUSIC: '+(sound.music===0?'OFF':sound.music<.1?'WHISPER':'LOW'));
  replaceLabel(effectsButton,'SFX: '+(sound.effects===0?'OFF':sound.effects<.6?'SOFT':sound.effects<.75?'BALANCED':'FULL'));
}
let hintUntil=0;
function notify(message,point){
  ui.hint.textContent=message;hintUntil=time+1.5;
  if(mode==='vr'&&shift.stage!=='done'&&point){proximityHint.position.copy(point);proximityHint.position.y+=.32;camera.getWorldPosition(head);proximityHint.lookAt(head);proximityHint.visible=true;}
}
function beginDelivery(seamless=false){
  magazine.reset();
  showTravelTip();
  dialogue?.clear();foundry.stop();rig.position.y=mode==='desktop'?0:heightOffset;district.start();room.visible=true;if(!seamless){keys.clear();running=false;paused=false;menu.visible=false;}
  if(!seamless){const p=district.spawn();rig.position.set(p.x,mode==='desktop'?0:heightOffset,p.z);rig.rotation.y=Math.PI;pitch=0;camera.rotation.set(0,0,0);}
  scene.background.set(0x526a76);scene.fog.color.set(0x526a76);sound.play('teleport');updateDelivery();
}
function jump(){if(foundry.run.active&&district.state.stage==='rooftops'&&foundry.run.jump()){sound.play('jump');}}
function placeFacingForward(p){
  if(mode==='desktop'){camera.rotation.set(0,0,0);pitch=0;rig.rotation.y=Math.PI;}else{camera.getWorldDirection(direction);if(Math.hypot(direction.x,direction.z)>.01)rig.rotation.y-=Math.atan2(direction.x,direction.z);}
  rig.position.y=(mode==='desktop'?0:heightOffset)+(p.y||0);camera.getWorldPosition(head);rig.position.x+=p.x-head.x;rig.position.z+=p.z-head.z;
}
function enterStorm(){
  showTravelTip();
  foundry.enter();placeFacingForward(foundry.spawn());keys.clear();
  district.root.visible=false;room.visible=false;scene.background.set(0x263542);scene.fog.color.set(0x263542);sound.play('teleport');
}
function updateDelivery(){
  const d=district.state;healthBars.forEach((b,i)=>{b.visible=true;b.material.color.set(i<d.health?0x9ae4b5:0x703b3a);});ui.objective.textContent=d.objective;gun.visible=!paused&&mode!=='landing';parcelBadge.visible=d.stage!=='delivered';deliveryStatus.visible=true;
  const text=d.stage==='delivered'?'DELIVERED':`SHIELD ${d.health}/3`;
  if(text!==lastDeliveryText){drawLabel(deliveryStatus,text);lastDeliveryText=text;}
}
function updateMission(){
  if(district?.state.active){updateDelivery();return;}if(deliveryStatus)deliveryStatus.visible=false;healthBars.forEach(b=>b.visible=false);
  if(exitSign)replaceLabel(exitSign,canLeaveOffice()?'TO LANTERN MILE →':'PICK UP YOUR PARCEL');
  if(district)district.root.visible=true;
  hintUntil=0;ui.hint.textContent='';if(proximityHint)proximityHint.visible=false;
  const s=shift.stage;
  paintPanel(missionBoard,s==='done'?'Delivery cleared.':s==='stamp'?'Stamp your pass.':'Your shift starts here.',s==='done'?['Your pass is stamped.','Start your first delivery below.']:s==='stamp'?['Your training is complete.','Confirm at the counter.']:['Point at PICK UP A JOB.','Press right trigger / click.']);
  paintPanel(sortingBoard,s==='parcel'?'Collect your parcel.':'Select the seals in this order.',s==='parcel'?['Point at the glowing parcel.','Right trigger to collect.']:['MOON → WAVE → LANTERN',`Right trigger / click · ${shift.sequence.length} of 3 selected`], 'PARCEL PICKUP');
  paintPanel(rangeBoard,s==='stamp'?'Return to dispatch.':'Clear all three targets.',s==='stamp'?['Return to dispatch for your stamp.']:[`${shift.hits.size} / 3 targets cleared`,'Aim with your right hand. Pull the trigger.'], 'TARGET PRACTICE');
  missionBoard.visible=['dispatch','stamp','done'].includes(s);sortingBoard.visible=['seal','parcel'].includes(s);if(s==='outbound')paintPanel(sortingBoard,'Parcel secured.',['Walk out through the front arch.','Your pistol is ready.']);rangeBoard.visible=['range','stamp'].includes(s);
  ui.objective.textContent=shift.message;
  replaceLabel(dispatchButton,s==='stamp'?'STAMP MY PASS':s==='done'?'SHIFT COMPLETE':s==='dispatch'?'PICK UP A JOB':s==='range'?'PRACTICE RANGE →':'SORTING DESK →');
  dispatchButton.visible=['dispatch','stamp','done'].includes(s);dispatchButton.userData.active=['dispatch','stamp'].includes(s);dispatchButton.material.color.set(dispatchButton.userData.active?0xffffff:0x93aaa0);
  completion.visible=s==='done';passSeal.visible=s==='done';
  parcel.visible=['dispatch','seal','parcel'].includes(s);parcel.userData.active=s==='parcel';parcel.material=s==='parcel'?materials.glow:materials.paper;parcel.position.z=s==='parcel'?-2.7:-4;
  sealButtons.forEach(b=>{b.visible=!['outbound','range','stamp','done'].includes(s);if(b.userData.plate)b.userData.plate.visible=b.visible;const symbol=b.userData.action.slice(5);b.userData.active=s==='seal';glyph(b,symbol,shift.sequence.includes(symbol));});
  targets.forEach((t,i)=>{t.root.visible=!shift.hits.has(i);t.hitbox.userData.active=s==='range';});
  parcelBadge.visible=['range','stamp','done','outbound'].includes(s);gun.visible=['range','stamp','done','outbound'].includes(s)&&!paused&&mode!=='landing';
}
function toggleMenu(value=!paused){
  paused=value;keys.clear();running=false;menu.visible=value;
  if(value){camera.getWorldPosition(head);camera.getWorldDirection(direction);direction.y=0;direction.normalize();menu.position.copy(head).addScaledVector(direction,2.3);menu.rotation.set(0,Math.atan2(direction.x,direction.z)+Math.PI,0);replaceLabel(movementButton,teleportMode?'TELEPORT':'WALK / RUN');}
  gun.visible=!value&&(district.state.active||['range','stamp','done','outbound'].includes(shift.stage))&&mode!=='landing';
}
function teleportTo(destination){
  if(foundry.run.active){if(!foundry.run.land(destination.x,destination.z,district.state.stage))return;rig.position.y=(mode==='desktop'?0:heightOffset)+foundry.run.feet;}
  camera.getWorldPosition(head);rig.position.x+=destination.x-head.x;rig.position.z+=destination.z-head.z;
}
function snapTurn(angle){
  camera.getWorldPosition(head);const dx=rig.position.x-head.x,dz=rig.position.z-head.z;
  rig.rotation.y+=angle;rig.position.x=head.x+dx*Math.cos(angle)+dz*Math.sin(angle);rig.position.z=head.z-dx*Math.sin(angle)+dz*Math.cos(angle);
}
function movePlayer(dx,dz){if(district.state.stage==='elevator'&&foundry.run.active)return;camera.getWorldPosition(head);const next=(district.state.active||canLeaveOffice())?journeyMove(head,dx,dz):moveXZ(head,dx,dz);stepDistance+=Math.hypot(next.x-head.x,next.z-head.z);rig.position.x+=next.x-head.x;rig.position.z+=next.z-head.z;if(stepDistance>.8){stepDistance=0;sound.play('step');}}
function updateControllers(dt){
  let turn=0,left=null,right=null;teleportRing.visible=false;
  for(const c of controllers){
    if(!c.source)continue;
    const gp=c.source.gamepad,axes=gp?.axes||[];
    const menuPressed=!!gp?.buttons?.[5]?.pressed;
    if(menuPressed&&!c.menuHeld)toggleMenu();c.menuHeld=menuPressed;
    if(c.source.handedness==='right'){right=c;const jumpPressed=!!gp?.buttons?.[4]?.pressed;if(jumpPressed&&!c.jumpHeld&&!paused)jump();c.jumpHeld=jumpPressed;c.handle.visible=!gun.visible;if(gun.parent!==c.ray){c.ray.add(gun);gun.position.set(0,-.025,-.045);gun.rotation.set(0,0,0);}}
    if(c.source.handedness==='left'){left=c;const reloadPressed=!!gp?.buttons?.[4]?.pressed;if(reloadPressed&&!c.reloadHeld&&!paused)reload();c.reloadHeld=reloadPressed;if(parcelBadge.parent!==c.grip){c.grip.add(parcelBadge);parcelBadge.position.set(0,.045,-.08);}}
    const h=hit(c.ray);c.line.scale.z=h?Math.min(h.distance,8):4;c.line.material.color.set(h?0xffd28c:0x98d4c1);
    c.destination=null;
    if(c.teleport&&!paused){
      aim(c.ray);const ray=raycaster.ray;
      if(ray.direction.y<-.07){const level=foundry.run.active?(['recipient','delivered'].includes(district.state.stage)?14:8):floorY;const t=(level-ray.origin.y)/ray.direction.y;const p=ray.at(t,new T.Vector3());
        const wall=raycaster.intersectObjects(occluders.filter(visible),false)[0];
        if(t>0&&t<12&&district.state.stage!=='elevator'&&playerWalkable(p.x,p.z)&&(!foundry.run.active||foundry.run.support(p.x,p.z,district.state.stage)!==null)&&(!wall||wall.distance>=t)){
          c.destination=p;teleportRing.visible=true;teleportRing.position.set(p.x,level+.016,p.z);c.line.scale.z=t;
        }
      }
    }
  }
  if(right){const a=right.source.gamepad?.axes||[];turn=a[2]??a[0]??0;}
  if(!paused&&left?.source.gamepad){const a=left.source.gamepad.axes;const smooth=deadzone(a[2]??a[0]??0);if(smooth)snapTurn(-smooth*dt*Math.PI*75/180);}
  if(Math.abs(turn)<.35)turnLatch=false;
  if(!paused&&Math.abs(turn)>.65&&!turnLatch){snapTurn(-Math.sign(turn)*Math.PI/6);turnLatch=true;}
  if(!paused&&!teleportMode&&left?.source.gamepad){
    const pad=left.source.gamepad,a=pad.axes,dx=0,dz=deadzone(a[3]??a[1]??0);
    camera.getWorldDirection(direction);direction.y=0;direction.normalize();const norm=Math.max(1,Math.hypot(dx,dz));
    const pressed=!!pad.buttons?.[3]?.pressed;
    if(pressed&&!left.runHeld)running=!running;left.runHeld=pressed;
    if(Math.hypot(dx,dz)<.01)running=false;
    const speed=running?3.6:2.1;
    movePlayer((-direction.z*dx-direction.x*dz)*dt*speed/norm,(direction.x*dx-direction.z*dz)*dt*speed/norm);
  }
}
async function checkVR(){
  try{const supported=!!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr');ui.enter.disabled=!supported;ui.enter.textContent=supported?'Enter VR →':'Open this link in your Quest browser';ui.status.textContent=supported?'Ready when you are. Controllers required.':'Play here on your computer, or open this page in Quest Browser for VR.';}catch{ui.enter.disabled=false;ui.enter.textContent='Try entering VR';ui.status.textContent='Could not check headset support. You can try entering VR.';}
}
function canLeaveOffice(){return shift.stage==='outbound'||shift.stage==='done';}
function playerWalkable(x,z){
  if(foundry.run.active)return foundry.run.walkable(x,z,district.state.stage);
  if(district.state.active||canLeaveOffice()){
    if(z>=7)return district.walkable(x,z);
    if(z>=5.8)return Math.abs(x)<=2.7;
  }
  return walkable(x,z);
}
function journeyMove(p,dx,dz){let {x,z}=p;const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));for(let i=0;i<n;i++){if(playerWalkable(x+dx/n,z))x+=dx/n;if(playerWalkable(x,z+dz/n))z+=dz/n;}return {x,z};}
function prepareChapter(){
  const chosen=$('chapter').value,changed=chosen!==selectedChapter;selectedChapter=chosen;
  if(chosen==='delivery'){if(!district.state.active)beginDelivery();return;}
  const next=chosen==='journey'?'journey':'training';
  if(changed&&(shift.mode!==next||district.state.active)){foundry.stop();district.stop();room.visible=true;shift.mode=next;shift.reset();rig.position.set(0,0,5);rig.rotation.y=0;scene.background.set(0x667f81);scene.fog.color.set(0x667f81);}
}
async function startVR(){
  prepareChapter();
  enableAudio();ui.enter.disabled=true;ui.status.textContent='Opening your headset…';let session;
  try{
    if(document.pointerLockElement)document.exitPointerLock();
    session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
    session.addEventListener('visibilitychange',()=>{keys.clear();if(session.visibilityState!=='visible')controllers.forEach(c=>{c.teleport=false;c.destination=null;});});
    heightOffset=0;pendingHeight=$('height').value!=='natural';running=false;teleportMode=$('locomotion').value==='teleport';
    if(foundry.run.active&&district.state.stage==='elevator'){district.state.stage='recipient';foundry.run.liftTime=LIFT_DURATION;}
    const spawn=foundry.run.active?(['recipient','delivered'].includes(district.state.stage)?{x:0,z:287,y:14}:foundry.spawn()):district.state.active?district.spawn():{x:0,z:5};if(foundry.run.active){foundry.run.feet=spawn.y;foundry.run.velocity=0;foundry.run.grounded=true;}rig.position.set(spawn.x,heightOffset+(spawn.y||0),spawn.z);rig.rotation.set(0,district.state.active?Math.PI:0,0);camera.position.set(0,0,0);camera.rotation.set(0,0,0);pitch=0;
    await renderer.xr.setSession(session);renderer.xr.setFoveation(1);mode='vr';paused=false;menu.visible=false;
    ui.landing.hidden=true;ui.hud.hidden=true;updateMission();
  }catch(err){if(session)await session.end().catch(()=>{});ui.enter.disabled=false;ui.enter.textContent='Try entering VR again';ui.status.textContent='Could not enter VR: '+(err?.message||'Headset permission was not granted.')+' Open the page directly in Quest Browser with controllers connected.';}
}
async function startDesktop(){
  prepareChapter();
  enableAudio();mode='desktop';paused=false;menu.visible=false;rig.position.y=foundry.run.active?foundry.run.feet:0;camera.position.set(0,1.65,0);camera.add(gun);camera.add(parcelBadge);parcelBadge.position.set(-.25,-.3,-.5);gun.position.set(.17,-.19,-.28);gun.rotation.set(0,0,0);ui.landing.hidden=true;ui.hud.hidden=false;updateMission();
  try{await renderer.domElement.requestPointerLock();}catch(err){paused=true;ui.landing.hidden=false;ui.hud.hidden=true;ui.status.textContent='Mouse capture was blocked. Click Explore again to retry, or open this page directly in a browser.';}
}
function frame(_timestamp,xrFrame){
  if(renderFailure)return;
  try{
    const dt=Math.min(clock.getDelta(),.05);time+=dt;
    sound.setActive(mode!=='landing'&&!document.hidden&&(mode!=='vr'||renderer.xr.getSession()?.visibilityState==='visible'));sound.setDucked(paused);sound.setZone(foundry.run.active?(district.state.stage==='elevator'?'lift':['recipient','delivered'].includes(district.state.stage)?'room':'storm'):district.state.active?'canal':'office');sound.tick();
    const speakingActive=mode!=='landing'&&!paused&&!document.hidden&&(mode!=='vr'||renderer.xr.getSession()?.visibilityState==='visible');
    dialogue.tick(dt,speakingActive,sound.effects);subtitle.visible=speakingActive&&!!dialogue.current&&mode==='vr';if(subtitle.visible){camera.getWorldPosition(head);camera.getWorldDirection(direction);subtitle.position.copy(head).addScaledVector(direction,2.5);subtitle.position.y-=.65;subtitle.lookAt(head);}

    if(hintUntil&&time>hintUntil){hintUntil=0;proximityHint.visible=false;ui.hint.textContent='';}
    camera.getWorldPosition(head);
    tickGuidance();
    if(speakingActive)travelTipTime=Math.max(0,travelTipTime-dt);
    travelTip.visible=speakingActive&&travelTipTime>0;
    if(travelTip.visible){camera.getWorldDirection(direction);travelTip.position.copy(head).addScaledVector(direction,2.7);travelTip.position.y-=.7;travelTip.lookAt(head);travelTip.material.opacity=Math.min(1,travelTipTime/.6,(5-travelTipTime)/.2);}
    if(speakingActive){magazine.tick(dt);replaceLabel(ammoLabel,magazine.remaining?'RELOADING…':magazine.rounds?'AMMO '+magazine.rounds+'/8':'X / R · RELOAD');gun.userData.slide.position.z=magazine.remaining?.025:0;}
    if(!district.state.active&&canLeaveOffice()&&head.z>=7.05&&mode!=='landing')beginDelivery(true);
    room.visible=!foundry.run.active&&(head.z<28||!district.state.active);district.root.visible=!foundry.run.active;
    if(district.state.active){
      camera.getWorldPosition(head);
      if(!paused&&mode!=='landing'&&!foundry.run.active&&district.atPortal(head.x,head.z)){if(district.action('portal')){enterStorm();camera.getWorldPosition(head);}}
      if(!paused&&mode!=='landing'&&!document.hidden&&(mode!=='vr'||renderer.xr.getSession()?.visibilityState==='visible')){
        const event=foundry.run.active?{}:district.tick(dt,time,head);
        if(foundry.run.active){district.state.tick(dt);const shot=foundry.combat(dt,time,head,district.state.stage);event.fired=shot.fired;if(shot.hit&&district.state.invulnerable===0){event.hurt=true;event.respawn=district.state.damage();}const result=foundry.tick(dt,time,head,district.state.stage);
          if(result.fell){district.state.respawns++;const p=foundry.spawn();rig.position.x+=p.x-head.x;rig.position.z+=p.z-head.z;notify('Portal checkpoint · parcel safe',new T.Vector3(0,9.7,227));sound.play('teleport');}
          if(result.motorStart)sound.play('lift');if(result.stop)sound.play('liftstop');if(result.doorOpen)sound.play('door');if(result.arrived){district.state.stage='recipient';foundry.refresh('recipient');sound.play('arrival');dialogue.say('arrival');}
          rig.position.y=(mode==='desktop'?0:heightOffset)+foundry.run.feet;
        }
        if(event.checkpoint){sound.play('unlock');notify('Sanctuary reached · parcel checkpoint',head.clone().add(new T.Vector3(0,0,2)));}
        if(event.fired)sound.play('enemyshot');
        if(event.hurt){notify('Hit! Move sideways to dodge.',head.clone().add(new T.Vector3(0,0,2)));sound.play('error');pulse(controllers.find(c=>c.source?.handedness==='right'),.6);}
        if(event.respawn){magazine.reset();const p=foundry.run.active?foundry.spawn():district.spawn();if(foundry.run.active){foundry.run.feet=8;foundry.run.velocity=0;foundry.run.grounded=true;foundry.clearShots();rig.position.y=(mode==='desktop'?0:heightOffset)+8;}rig.position.x+=p.x-head.x;rig.position.z+=p.z-head.z;notify('Shield restored · parcel safe',new T.Vector3(p.x,1.7,p.z+2));sound.play('teleport');}
        updateDelivery();
      }
    }
    if(!district.state.active&&!paused)district.tick(0,time,head);
    const stampAge=time-stampAt;passSeal.visible=shift.stage==='done'&&stampAge>.55;stampTool.position.y=1.09+(stampAge>=0&&stampAge<.65?Math.sin(stampAge/.65*Math.PI)*.2:0);clerk.rotation.x=stampAge>=0&&stampAge<1.2?Math.sin(stampAge/1.2*Math.PI)*.055:0;
    camera.getWorldPosition(head);clerk.userData.update(dt,head);
    const recoil=Math.max(0,1-(time-lastMuzzleTime)/.13);gun.userData.slide.position.z=magazine.remaining?.025:recoil*.025;gun.userData.flash.visible=time-lastMuzzleTime<.035&&gun.visible;
    if(mode==='vr'&&pendingHeight&&xrFrame){
      const pose=xrFrame.getViewerPose(renderer.xr.getReferenceSpace());
      if(pose&&Number.isFinite(pose.transform.position.y)){heightOffset=eyeOffset(pose.transform.position.y);rig.position.y=heightOffset+(foundry.run.active?foundry.run.feet:0);pendingHeight=false;}
    }
    if(mode==='desktop'&&!paused){
      const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?4.2:2.6;const dx=Number(keys.has('KeyD'))-Number(keys.has('KeyA')),dz=Number(keys.has('KeyS'))-Number(keys.has('KeyW')),a=rig.rotation.y,n=Math.max(1,Math.hypot(dx,dz));
      movePlayer((dx*Math.cos(a)+dz*Math.sin(a))*dt*speed/n,(-dx*Math.sin(a)+dz*Math.cos(a))*dt*speed/n);
      const h=hit(camera);if(time>hintUntil)ui.hint.textContent=h?((h.distance>4.5&&!/^(target|spirit|roofspirit):/.test(h.object.userData.action))?'Move closer · ':'Click · ')+h.object.userData.label:'';
    }
    if(mode==='vr'&&renderer.xr.getSession()?.visibilityState==='visible')updateControllers(dt);
    if(mode==='landing'){camera.rotation.set(-.05,0,0);}
    lanterns.forEach((o,i)=>{const ring=Math.max(0,bellUntil-time)*.025;o.rotation.z=Math.sin(time*.85+i*.8)*(.065+ring);o.rotation.x=Math.sin(time*.63+i)*.035;});
    shelfPairs.forEach(a=>{const clock=time+a.phase,leg=Math.floor(clock/16)%2,u=Math.min(1,(clock%16)/5),p=u*u*(3-2*u),lift=Math.sin(p*Math.PI);a.o.position.set(a.x-a.side*.4*lift,a.y+.12*lift,a.z+1.2*(leg?1-p:p));a.o.rotation.y=-a.side*.15*lift;});
    mailWings.forEach((o,i)=>{const t=time*.32+i*2.1;o.position.set(-5.7+Math.sin(t)*.42,3.4+Math.sin(t*1.7)*.2,1+i*.8+Math.cos(t)*.5);o.rotation.set(Math.sin(t*3)*.15,Math.sin(t)*.4,Math.cos(t*2)*.12);});
    targets.forEach((t,i)=>{t.root.position.y=t.base+Math.sin(time*1.3+i)*.12;t.root.rotation.y=Math.sin(time*.6+i)*.12;t.root.userData.wings?.forEach((w,k)=>w.rotation.y=Math.sin(time*2)*(k?1:-1)*.2);});
    scene.userData.dust.position.y=Math.sin(time*.3)*.08;
    for(let i=sparks.length-1;i>=0;i--){const item=sparks[i],o=item.o;if(item.burst){o.scale.setScalar(1+(time-item.born)*2);o.material.opacity=Math.max(0,(item.until-time)/.6);}if(time>item.until){scene.remove(o);o.geometry.dispose();o.material.dispose();sparks.splice(i,1);}}
    if(mode==='landing'||(mode==='desktop'&&paused)){const view=lobby.tick(dt,time,innerWidth/innerHeight,typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);renderer.render(view.scene,view.camera);}else renderer.render(scene,camera);
  }catch(err){fail('The prototype hit a graphics error: '+err.message);}
}
function fail(message){renderFailure=true;ui.landing.hidden=false;ui.hud.hidden=true;ui.status.textContent=message;ui.enter.disabled=true;ui.desktop.disabled=true;}
try{init();}catch(err){fail('The post office could not load: '+err.message+' Please reload in a browser with WebGL enabled.');}

function buildGuidance(){
 const glow=new T.MeshBasicMaterial({color:0xffd987,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false});
 guideRing=new T.Mesh(new T.TorusGeometry(.48,.025,6,32),glow);scene.add(guideRing);
 guideArrow=new T.Mesh(new T.ConeGeometry(.12,.22,3),glow);scene.add(guideArrow);
 guideText=label('',0,0,0,2.8,.28,scene);
 for(let i=0;i<7;i++){const a=new T.Mesh(new T.ConeGeometry(.09,.2,3),glow);a.rotation.x=-Math.PI/2;scene.add(a);guideTrail.push(a);}
}
function tickGuidance(){
 let target=null,text='',s=shift.stage;
 if(!district.state.active&&mode!=='landing'&&!paused){
  if(s==='dispatch'||s==='stamp'){target=dispatchButton.getWorldPosition(new T.Vector3());text=s==='dispatch'?'1 · Point here. Press right trigger / click.':'Confirm your training at the counter.';}
  if(s==='seal'){target=sealButtons.find(b=>b.userData.action==='seal:'+SEAL[shift.sequence.length])?.getWorldPosition(new T.Vector3());text='2 · Select '+SEAL[shift.sequence.length]+' · right trigger / click';}
  if(s==='parcel'){target=parcel.getWorldPosition(new T.Vector3());text='3 · Pick up the glowing parcel.';}
  if(s==='outbound'){target=new T.Vector3(0,1.4,6.8);text='4 · Follow the trail outside. Left stick walks + turns.';}
 }
 guideRing.visible=guideArrow.visible=guideText.visible=!!target;guideTrail.forEach(a=>a.visible=!!target);if(!target)return;
 guideRing.position.copy(target);guideRing.scale.setScalar(1+Math.sin(time*3)*.07);guideRing.lookAt(head);
 guideArrow.position.copy(target).add(new T.Vector3(0,.7+Math.sin(time*3)*.05,0));guideArrow.rotation.z=Math.PI;
 replaceLabel(guideText,text);guideText.position.copy(target).add(new T.Vector3(0,1.02,0));guideText.lookAt(head);
 // Two legs route players through the clear centre aisle, around both desks.
 const end=target.clone();end.z+=s==='outbound'?-.5:1.2;end.y=.04;const start=new T.Vector3(head.x,.04,head.z),via=new T.Vector3(.5,.04,head.z),l1=start.distanceTo(via),l2=via.distanceTo(end),length=l1+l2;
 guideTrail.forEach((a,i)=>{const d=Math.min(length,(i+1)*length/8);a.position.copy(d<l1?start.clone().lerp(via,d/Math.max(l1,.001)):via.clone().lerp(end,(d-l1)/Math.max(l2,.001)));a.rotation.set(-Math.PI/2,0,d<l1?-Math.PI/2:Math.atan2(end.x-via.x,end.z-via.z));a.visible=walkable(a.position.x,a.position.z)||s==='outbound'&&a.position.z>5;});
}

function showTravelTip(){travelTipTime=5;paintPanel(travelTip,'Go at your own pace.',mode==='desktop'?['Hold Shift to run.','Space to jump on rooftops.']:['Click left stick to run. Stop to walk again.','Teleport: hold left trigger, aim down, release.'],'ON THE MOVE');}
