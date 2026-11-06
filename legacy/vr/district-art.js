import * as T from './vendor/three.module.js';
import {BLOCKS} from './world.js';
import {addArchitecture} from './architecture.js';

// Presentation only. All coordinates are world metres; collision stays in world.js.
export function buildDistrictArt(view) {
  const root = new T.Group(); root.name = 'Lantern district art'; view.scene.add(root);
  let seed = 9721;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  function surface(kind, base) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const c = canvas.getContext('2d'); c.fillStyle = base; c.fillRect(0,0,512,512);
    if (kind === 'stone') {
      for(let row=0;row<16;row++) for(let col=-1;col<9;col++) {
        const x=col*64+(row%2)*32, y=row*32, shade=122+Math.floor(random()*35);
        c.fillStyle=`rgb(${shade+15},${shade+10},${shade})`;c.beginPath();c.roundRect(x+2+(row%3),y+2,58-(col%3),27,5);c.fill();
        c.fillStyle='#ffffff18';c.fillRect(x+3,y+3,58,2);
        c.fillStyle='#24393335';c.fillRect(x+3,y+27,58,3);
      }
    } else if(kind === 'wood') {
      for(let i=0;i<520;i++) {c.strokeStyle=i%3?'#211b1828':'#e4ba791c';c.lineWidth=random()*2+.3;c.beginPath();const x=random()*512;c.moveTo(x,0);c.bezierCurveTo(x+18,160,x-12,340,x+3,512);c.stroke();}
      for(let x=0;x<512;x+=64){c.fillStyle='#1e201b66';c.fillRect(x,0,2,512);}
    } else {
      for(let i=0;i<18000;i++){c.fillStyle=i%2?'#fff3d416':'#6f634514';c.fillRect(random()*512,random()*512,random()*5+1,random()*3+1);}
    }
    const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    return map;
  }
  const plasterTex=surface('plaster','#e5ceb0'),woodTex=surface('wood','#816347'),stoneTex=surface('stone','#686e65');
  const plaster=new T.MeshStandardMaterial({map:plasterTex,color:0xf3e3c4,roughness:.94,bumpMap:plasterTex,bumpScale:.035});
  const wood=new T.MeshStandardMaterial({map:woodTex,color:0x9c7759,roughness:.84,bumpMap:woodTex,bumpScale:.035});
  const darkWood=new T.MeshStandardMaterial({map:woodTex,color:0x69534a,roughness:.86});
  const brass=new T.MeshStandardMaterial({color:0xc49d63,metalness:.65,roughness:.38});
  const jade=new T.MeshStandardMaterial({color:0x547c76,roughness:.72});
  const tile=new T.MeshStandardMaterial({color:0x627c78,roughness:.76});
  const red=new T.MeshStandardMaterial({color:0xa74f3d,roughness:.7});
  const paper=new T.MeshStandardMaterial({color:0xffd595,emissive:0xffaf54,emissiveIntensity:.5,roughness:.8});
  const paving=stoneTex.clone();paving.needsUpdate=true;paving.repeat.set(4,4);
  const stone=new T.MeshStandardMaterial({map:paving,bumpMap:paving,bumpScale:.035,roughness:.91});
  const glass=new T.MeshStandardMaterial({color:0x81998b,emissive:0xd6a36a,emissiveIntensity:.12,roughness:.28,metalness:.18});
  const architecture=addArchitecture(view,root,{wood,darkWood,plaster,brass,tile,glass});
  const unit=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8),tileGeo=new T.CylinderGeometry(1,1,1,8,1,false,0,Math.PI);
  const batches=new Map(),dummy=new T.Object3D();
  function instance(geometry,material,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
    let byMaterial=batches.get(geometry);if(!byMaterial)batches.set(geometry,byMaterial=new Map());
    let list=byMaterial.get(material);if(!list)byMaterial.set(material,list=[]);
    dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();list.push(dummy.matrix.clone());
  }
  const box=(x,y,z,w,h,d,m,rx=0,ry=0,rz=0)=>instance(unit,m,x,y,z,w,h,d,rx,ry,rz);
  function mesh(geometry,material,x,y,z){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
  const leaves=[0x526d49,0x75854f,0x9ca46a].map(color=>new T.MeshStandardMaterial({color,roughness:.95}));
  const flowers=[0xf1ba97,0xe4ce9d,0xb98686].map(color=>new T.MeshStandardMaterial({color,roughness:.9}));
  function planter(x,z,size=1){
    const pot=mesh(new T.CylinderGeometry(size*.62,size*.44,size*.8,12),red,x,size*.4,z);
    for(let i=0;i<19;i++){const a=random()*Math.PI*2,r=random()*size*.7;instance(sphere,leaves[i%3],x+Math.cos(a)*r,size*.85+random()*size*.8,z+Math.sin(a)*r,.18*size,.32*size,.14*size,random(),a);}
    for(let i=0;i<6;i++)instance(sphere,flowers[i%3],x+(random()-.5)*size,size*1.4+random()*.3,z+(random()-.5)*size,.12,.1,.12);
    return pot;
  }
  // Warm limewash replaces the untextured postal walls, with panels on BOTH sides.
  for(const b of BLOCKS.filter(b=>b.type==='wall'&&b.z>-40)) {
    box(b.x,b.h/2,b.z,b.w+.025,b.h,b.d+.025,plaster);
    if(b.w<b.d){
      for(let z=b.z-b.d/2+.4;z<=b.z+b.d/2;z+=7)box(b.x,4.5,z,1.09,9,.22,darkWood);
      for(const y of [.35,2.7,8.6])box(b.x,y,b.z,1.12,.2,b.d,darkWood);
    }else{
      for(let x=b.x-b.w/2+.5;x<b.x+b.w/2;x+=5)box(x,4.5,b.z,.25,9,b.d+.12,darkWood);
      for(const y of [.35,2.7,8.6])box(b.x,y,b.z,b.w,.2,b.d+.14,darkWood);
    }
  }
  // Inlaid parquet and a clear central runner to dispatch.
  const parquet=woodTex.clone();parquet.needsUpdate=true;parquet.repeat.set(12,16);
  box(0,.057,16,36.9,.014,81,new T.MeshStandardMaterial({map:parquet,color:0xc0a078,roughness:.7}));
  box(0,.075,-5,6,.018,42,jade);
  for(const x of [-2.85,2.85])box(x,.09,-5,.035,.01,42,brass);
  // Ceiling coffers, counter mouldings, parcel cubbies and suspended warm lamps.
  for(let z=-20;z<56;z+=9)box(0,8.7,z,37,.28,.32,darkWood);
  for(const x of [-12,0,12])box(x,8.66,16,.22,.25,80,wood);
  for(const x of [-3.7,-2.5,-1.25,0,1.25,2.5,3.7])box(x,.7,8.53,.07,1.15,.08,brass);
  box(0,1.32,7,8.3,.15,3.2,darkWood);box(0,.12,8.55,8.15,.2,.1,darkWood);
  for(let col=0;col<9;col++)for(let row=0;row<5;row++){
    const x=-16+col*.86,y=.7+row*.6;
    box(x,y,54.5,.81,.55,1.1,wood);box(x,y,53.93,.6,.32,.03,darkWood);box(x,y+.06,53.89,.17,.05,.035,brass);
  }
  view.sign('DEAD LETTERS / STILL LOVED',-12.5,4.2,53.7,8,.6,'#efdbb6','#514539',root);
  for(const z of [-12,15,40])for(const x of [-10,10]){
    box(x,7.7,z,.035,2,.035,brass);mesh(new T.SphereGeometry(.52,16,12),paper,x,6.6,z);
    mesh(new T.CylinderGeometry(.6,.48,.18,16),brass,x,7.03,z);
  }
  for(const z of [0,40]){const l=new T.PointLight(0xffcf8e,32,24,2);l.position.set(0,5,z);root.add(l);}
  // Front eave: a shallow curved profile above the doorway, never in the exit.
  function eave(x,y,z,width,depth=2.3){
    for(let row=0;row<5;row++){
      const t=row/4,zz=z-t*depth,yy=y+.6*(1-t)*(1-t);
      box(x,yy-.12,zz,width,.14,depth/4+.12,darkWood);
      for(let xx=-width/2;xx<width/2;xx+=.43)instance(tileGeo,tile,x+xx,yy,zz,.23,depth/4+.2,.23,Math.PI/2);
    }
    box(x,y+.65,z+.2,width+.2,.16,.16,jade);
  }
  eave(0,9,-26.2,40,3.7);architecture.postOffice();
  for(const x of [-17.8,-7.2,7.2,17.8]){
    box(x,4.4,-27.15,.32,8.8,.34,darkWood);box(x,.45,-27.15,.55,.9,.55,plaster);
    planter(x+(x<0?1.1:-1.1),-28.5,.9);
  }
  // Round postal seal and a red pillar box beside the entrance.
  const seal=mesh(new T.CylinderGeometry(1.1,1.1,.16,40),brass,0,7.95,-27.5);seal.rotation.x=Math.PI/2;
  view.sign('✦',0,7.97,-27.61,1.3,1.1,'#ecd1a0','#4c685e',root);
  mesh(new T.CylinderGeometry(.56,.64,1.65,20),red,-8.8,.825,-29.3);
  mesh(new T.SphereGeometry(.58,20,12,0,Math.PI*2,0,Math.PI/2),red,-8.8,1.65,-29.3);
  box(-8.8,1.48,-29.86,.62,.13,.045,darkWood);box(-8.8,.9,-29.88,.34,.37,.035,brass);
  // A partition of ground planes: no coplanar street/cross-street overlays.
  // Storm gap stays open; physics floor remains at y=0 everywhere else.
  for(const [near,far] of [[60,-334],[-498,-650]]){
    for(const [left,right,road] of [[-97.5,-53.5,false],[-53.5,-38.5,true],[-38.5,-11,false],[-11,11,true],[11,38.5,false],[38.5,53.5,true],[53.5,97.5,false]]){
      const tex=stoneTex.clone();tex.needsUpdate=true;tex.repeat.set((right-left)/5,(near-far)/5);
      const m=stone.clone();m.map=m.bumpMap=tex;m.color.set(road?0xc2b6a0:0x879381);
      const floor=mesh(new T.PlaneGeometry(right-left,near-far),m,(left+right)/2,0,(near+far)/2);
      floor.rotation.x=-Math.PI/2;floor.castShadow=false;floor.name='District ground';floor.userData.groundBounds={left,right,near,far};
    }
  }
  for(const x of [-11,11])box(x,.09,-174,.17,.18,280,plaster);
  for(const b of BLOCKS.filter(b=>b.type==='house')){
    // Only thin facade skins: original walls and all flat rooftop landings remain.
    architecture.house(b);
    for(const side of [-1,1]){
      const face=b.x+side*(b.w/2+.035);
      for(let z=b.z-b.d/2+.3;z<=b.z+b.d/2;z+=10)box(face,b.h/2,z,.1,b.h,.12,wood);
      for(const y of [.4,3,b.h-.3])box(face,y,b.z,.15,.12,b.d,wood);

    }
    for(const side of [-1,1]){
      const z=b.z+side*(b.d/2+.05);
      for(const dx of [-b.w/2+.2,0,b.w/2-.2])box(b.x+dx,b.h/2,z,.2,b.h,.18,darkWood);
      for(const y of [.4,3,b.h-.3])box(b.x,y,z,b.w,.18,.2,darkWood);
    }
    const shops=['MOTH & KETTLE','THE LOST HOUR','MOON THREADS','NIGHT NOODLES'];
    view.sign(shops[(Math.abs(Math.round(b.z/84))+(b.x>0?1:0))%4],b.x,3.05,b.z+b.d/2+1.15,b.w*.53,.6,'#e6cfaa','#4d655f',root);
    // Planters and climbing foliage hug the building, away from the centre lane.
    const inner=b.x-Math.sign(b.x)*(b.w/2+.9);
    for(const dz of [-b.d/2+2,b.d/2-2])planter(inner,b.z+dz,.8);
    for(let i=0;i<80;i++){
      const y=random()*(b.h-1)+.4,z=b.z+b.d/2-.7-random()*3;
      instance(sphere,leaves[i%3],b.x-Math.sign(b.x)*(b.w/2+.18),y,z,.12,.2,.23,random(),random());
    }
  }
  architecture.finish();
  // Small trees frame the entrance without covering the middle of the route.
  const canopies=[];
  for(const x of [-35,35]){
    mesh(new T.CylinderGeometry(.18,.36,5,10),wood,x,2.5,-40);
    const canopy=new T.Group();canopy.position.set(x,5,-40);root.add(canopy);
    for(let i=0;i<13;i++){
      const o=new T.Mesh(sphere,leaves[i%3]);o.position.set((random()-.5)*5,random()*2,(random()-.5)*4);o.scale.set(1.5,.9,1.25);o.castShadow=true;canopy.add(o);
    }canopies.push(canopy);
  }
  // Batch thousands of repeated tiles, leaves and trim pieces into few draw calls.
  for(const [geometry,materials] of batches)for(const [material,matrices] of materials){
    const batch=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>batch.setMatrixAt(i,m));batch.castShadow=true;batch.receiveShadow=true;batch.computeBoundingSphere();root.add(batch);
  }
  // Sky rendered inside a camera-centred sphere: soft cloud banks, peach horizon.
  const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{time:{value:0},storm:{value:0}},vertexShader:`varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    varying vec3 direction;uniform float time;uniform float storm;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 col=mix(vec3(.91,.70,.54),vec3(.27,.48,.51),smoothstep(0.,.65,h));
    vec2 p=d.xz/(h+.25)*1.7+vec2(time*.003,0.);float n=noise(p)*.58+noise(p*2.1)*.28+noise(p*4.3)*.14;
    float clouds=smoothstep(.47,.68,n)*smoothstep(0.,.16,h);col=mix(col,mix(vec3(.78,.64,.59),vec3(1.,.87,.7),n),clouds*.86);
    float glow=pow(max(dot(d,normalize(vec3(-.6,.24,-.7))),0.),28.);col+=vec3(.2,.12,.045)*glow;
    col=mix(col,vec3(.16,.23,.29),storm);gl_FragColor=vec4(col,1.);}`});
  const sky=new T.Mesh(new T.SphereGeometry(400,32,20),skyMaterial);sky.frustumCulled=false;sky.renderOrder=-10;view.scene.add(sky);
  view.sun.castShadow=true;view.sun.shadow.mapSize.set(2048,2048);Object.assign(view.sun.shadow.camera,{left:-65,right:65,top:80,bottom:-80,near:1,far:240});view.sun.shadow.bias=-.0006;view.sun.shadow.normalBias=.06;view.scene.add(view.sun.target);
  return {root,update(time,camera,zone,motion){
    sky.position.copy(camera.position);skyMaterial.uniforms.storm.value=zone>=3?1:zone===1?.35:0;if(motion)skyMaterial.uniforms.time.value=time;
    const step=130/2048,sx=Math.round(camera.position.x/step)*step,sz=Math.round(camera.position.z/step)*step;view.sun.position.set(sx-65,95,sz-50);view.sun.target.position.set(sx,0,sz);view.sun.castShadow=zone<3;
    if(motion)canopies.forEach((o,i)=>o.rotation.z=Math.sin(time*.6+i)*.018);
  }};
}
