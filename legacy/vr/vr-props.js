import * as T from './vendor/three.module.js';
import {mergeStaticMeshes} from './architecture.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const add=(parent,g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
function bevel(w,h,d,r=.003){
  const shape=new T.Shape();shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const g=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r*.4,bevelThickness:r,curveSegments:4});g.translate(0,0,-d/2+r);return g;
}
// Fictional service pistol at approximately real handheld scale; visual asset only.
export function createPistol({variant="service",hand=true}={}){
  const root=new T.Group();root.name='Courier service pistol';
  const steel=new T.MeshStandardMaterial({color:0x68737a,metalness:.82,roughness:.32});
  const dark=new T.MeshStandardMaterial({color:0x303536,metalness:.28,roughness:.63});
  const rubber=new T.MeshStandardMaterial({color:0x292929,roughness:.96});
  const brass=new T.MeshStandardMaterial({color:0xc6a16b,metalness:.65,roughness:.4});
  const slide=new T.Group();root.add(slide);
  add(slide,bevel(.036,.041,.178),steel,0,.032,-.06);
  add(root,bevel(.033,.025,.147),dark,0,.002,-.047);
  // Round barrel, recessed bore, slide serrations and contrasting sights.
  const barrel=add(root,new T.CylinderGeometry(.008,.008,.15,24),steel,0,.026,-.087);barrel.rotation.x=Math.PI/2;
  const bore=add(root,new T.CircleGeometry(.0057,24),new T.MeshBasicMaterial({color:0x070909}),0,.026,-.163);bore.rotation.y=Math.PI;
  add(root,new T.TorusGeometry(.0068,.0014,8,24),steel,0,.026,-.163).rotation.y=Math.PI;
  for(const side of [-1,1])for(let i=0;i<7;i++)add(slide,bevel(.001,.026,.0016,.0003),dark,side*.019,.032,-.003+i*.0035);
  add(slide,bevel(.005,.006,.007,.001),dark,0,.055,-.134);
  for(const side of [-1,1])add(slide,bevel(.004,.006,.006,.001),dark,side*.009,.055,.014);
  add(slide,new T.SphereGeometry(.0016,8,6),new T.MeshBasicMaterial({color:0xc8ead0}),0,.057,-.13);
  // Separate ejection-port inset and a subtly curved grip.
  add(slide,bevel(.022,.001,.033,.001),dark,.005,.053,-.064);
  const grip=new T.Group();grip.position.set(0,-.047,.001);grip.rotation.x=-.2;root.add(grip);
  add(grip,bevel(.031,.086,.035,.005),rubber);
  for(const side of [-1,1]){add(grip,bevel(.002,.064,.025,.002),dark,side*.016,0,0);for(let i=0;i<9;i++)add(grip,bevel(.001,.0018,.022,.0003),steel,side*.017,-.03+i*.0065,0);}
  add(grip,bevel(.035,.007,.042,.002),dark,0,-.047,0);
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,-.008,-.02),new T.Vector3(0,-.043,-.026),new T.Vector3(0,-.043,-.067),new T.Vector3(0,-.009,-.075)]);
  add(root,new T.TubeGeometry(curve,24,.003,8,false),dark);
  const trigger=add(root,new T.TorusGeometry(.014,.002,6,18,Math.PI*.6),steel,0,-.018,-.035);trigger.rotation.y=Math.PI/2;trigger.rotation.x=.5;
  add(root,bevel(.002,.008,.022,.001),steel,-.019,.005,-.003);
  add(root,new T.SphereGeometry(.0025,10,8),brass,-.019,-.001,.009);
  // Compact glove around the grip, keeping the upper slide and sights unobstructed.
  if(hand){
  const glove=new T.MeshStandardMaterial({color:0x665a49,roughness:.98});
  const palm=add(root,new T.SphereGeometry(.026,16,12),glove,.018,-.043,.004);palm.scale.set(.7,1.35,.82);
  for(let i=0;i<3;i++){const finger=add(root,new T.CapsuleGeometry(.005,.023,4,10),glove,-.004,-.027-i*.012,-.014);finger.rotation.z=Math.PI/2;}
  const sleeve=add(root,new T.CylinderGeometry(.027,.032,.08,16),new T.MeshStandardMaterial({color:0x817663,roughness:.9}),.012,-.097,.047);sleeve.rotation.x=-.65;
  }
  if(variant==='warden'){
    steel.color.set(0x3d6664);brass.color.set(0xe3b878);
    add(slide,bevel(.045,.012,.18),brass,0,.059,-.06);
    const shroud=add(root,new T.CylinderGeometry(.022,.022,.065,8),steel,0,.026,-.163);shroud.rotation.x=Math.PI/2;
    add(root,new T.TorusGeometry(.018,.003,8,32),brass,0,.026,-.197);
    add(root,new T.CircleGeometry(.012,24),new T.MeshBasicMaterial({color:0x091717}),0,.026,-.198).rotation.y=Math.PI;
    for(const side of [-1,1]){add(slide,bevel(.003,.017,.07),brass,side*.023,.029,-.045);add(slide,new T.SphereGeometry(.007,12,8),new T.MeshBasicMaterial({color:0xa3f4d6}),side*.026,.03,-.042);}
  }
  root.userData.variant=variant;
  const flash=add(root,new T.SphereGeometry(.012,10,6),new T.MeshBasicMaterial({color:0xffd494,transparent:true,opacity:.8}),0,.026,variant==='warden'?-.205:-.17);flash.scale.set(.6,.6,1.6);flash.visible=false;
  mergeStaticMeshes(slide);mergeStaticMeshes(root,new Set([slide,flash]));
  root.userData.slide=slide;root.userData.flash=flash;return root;
}
// One complete textured human rig: no transplanted head, cropped neck or altered anatomy.
export function assembleDispatcher(gltf,{supernatural=false}={}){
  const root=new T.Group(),body=gltf.scene;root.name='Human military dispatcher';root.add(body);
  body.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(body),height=bounds.max.y-bounds.min.y;
  body.scale.multiplyScalar(2.02/height);body.position.y-=bounds.min.y*2.02/height;root.updateMatrixWorld(true);
  if(supernatural){
    body.traverse(o=>{if(o.isMesh){const list=Array.isArray(o.material)?o.material:[o.material];const changed=list.map(m=>{const c=m.clone();c.color.multiply(new T.Color(o.name.toLowerCase().includes('head')?0xb2c8c4:0x728a87));c.emissive=new T.Color(0x14312d);c.emissiveIntensity=.18;return c;});o.material=Array.isArray(o.material)?changed:changed[0];}});
    const halo=add(root,new T.TorusGeometry(.31,.012,8,48),new T.MeshBasicMaterial({color:0x9ee8cf,transparent:true,opacity:.65}),0,1.78,-.24);halo.name='Spectral insignia';
    add(root,new T.SphereGeometry(.026,12,8),new T.MeshBasicMaterial({color:0xa8ffdb}),0,1.43,.19);
  }
  const bone=name=>body.getObjectByName('mixamorig'+name);
  function pointBone(name,childName,desired){
    const b=bone(name),child=bone(childName);if(!b||!child)return;
    root.updateMatrixWorld(true);
    const from=child.getWorldPosition(new T.Vector3()).sub(b.getWorldPosition(new T.Vector3())).normalize();
    const delta=new T.Quaternion().setFromUnitVectors(from,desired.normalize());
    const world=b.getWorldQuaternion(new T.Quaternion()).premultiply(delta);
    b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(world));
  }
  for(const [side,sign] of [['Left',1],['Right',-1]]){
    pointBone(side+'Arm',side+'ForeArm',new T.Vector3(sign*.16,-.97,.12));
    pointBone(side+'ForeArm',side+'Hand',new T.Vector3(sign*.04,-.96,.24));
  }
  const spine=bone('Spine2'),head=bone('Head'),spineRest=spine?.quaternion.clone(),headRest=head?.quaternion.clone();let age=0,yaw=0;
  root.userData.update=(dt,viewer)=>{
    age+=dt;
    if(spine)spine.quaternion.copy(spineRest).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.sin(age*1.1)*.008));
    if(head){head.quaternion.copy(headRest);root.updateMatrixWorld(true);
      if(viewer){const local=root.worldToLocal(viewer.clone());yaw=T.MathUtils.lerp(yaw,T.MathUtils.clamp(Math.atan2(local.x,local.z),-.32,.32),Math.min(1,dt*2));
        const q=head.getWorldQuaternion(new T.Quaternion());q.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw));head.quaternion.copy(head.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));}
    }
  };
  root.userData.update(0);return root;
}
export function createDispatcher(options={}){
  const root=new T.Group();root.name='Dispatch officer';let officer;
  root.userData.ready=new GLTFLoader().loadAsync('/assets/vr/dispatch-officer.glb').then(gltf=>{officer=assembleDispatcher(gltf,options);root.add(officer);root.userData.loaded=true;}).catch(()=>{root.userData.loaded=false;});
  root.userData.update=(dt,viewer)=>officer?.userData.update(dt,viewer);return root;
}
