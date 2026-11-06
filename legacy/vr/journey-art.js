import * as T from './vendor/three.module.js';
import {roundedBlock,curvedRoof,archShape,mergeStaticMeshes} from './architecture.js';
import {STORM_ROOFS} from './world.js';

// All added objects are scenic; the centre of each landing and every doorway stay clear.
export function buildJourneyArt(view){
  const root=new T.Group();root.name='Canal, storm district and foundry';view.scene.add(root);
  const materials={};
  for(const [name,color,metalness,roughness] of [
    ['iron',0x394f59,.65,.52],['copper',0x997153,.65,.55],['stone',0x85918d,0,.94],
    ['jade',0x506d68,.25,.62],['wood',0x62544b,0,.88],['plaster',0xa4aba0,0,.92],['gold',0xc8a36b,.6,.36]
  ])materials[name]=new T.MeshStandardMaterial({color,metalness,roughness});
  const {iron,copper,stone,jade,wood,plaster,gold}=materials;
  const amber=new T.MeshStandardMaterial({color:0xe7bd81,emissive:0xd3964e,emissiveIntensity:.5,roughness:.45});
  const blue=new T.MeshStandardMaterial({color:0x8bbab8,emissive:0x3f858f,emissiveIntensity:.38,roughness:.4});
  const add=(g,m,x,y,z,parent=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o;};
  const box=(x,y,z,w,h,d,m,parent=root)=>add(roundedBlock(w,h,d,.08),m,x,y,z,parent);
  const cyl=(x,y,z,r,h,m,parent=root)=>add(new T.CylinderGeometry(r,r,h,20),m,x,y,z,parent);
  const pipe=(points,r,m,parent=root)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false),m,0,0,0,parent);
  const ring=(x,y,z,r,thickness,m,parent=root)=>{const o=add(new T.TorusGeometry(r,thickness,8,28),m,x,y,z,parent);o.rotation.x=Math.PI/2;return o;};
  function window(x,y,z,w,h,material,parent=root){
    add(new T.ExtrudeGeometry(archShape(w+.2,h+.18),{depth:.16,bevelEnabled:false,curveSegments:12}),iron,x,y-.08,z,parent);
    add(new T.ShapeGeometry(archShape(w,h),12),material,x,y,z+.2,parent);
    box(x,y+h*.4,z+.23,.07,h*.78,.07,copper,parent);box(x,y+h*.46,z+.24,w,.07,.07,copper,parent);
  }
  const moving=[];
  function fan(x,y,z,r){
    const frame=add(new T.TorusGeometry(r,.12,8,24),copper,x,y,z);
    const blades=new T.Group();blades.position.copy(frame.position);root.add(blades);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5,o=box(Math.cos(a)*r*.43,Math.sin(a)*r*.43,0,r*.75,r*.2,.09,iron,blades);o.rotation.z=a+.35;}
    add(new T.SphereGeometry(.16,12,8),gold,0,0,.08,blades);moving.push({o:blades,kind:'fan'});
  }
  // Canal district: bowed pipes, garden walls, hanging baskets and a slower visual rhythm.
  for(let i=0;i<5;i++){
    const z=-185-i*26,x=i%2?-57:57;
    pipe([[x,0,z],[x,3,z],[x+2,4,z],[x+4,3,z]],.18,copper);
    cyl(x,3,z,.3,.2,iron);box(x,1,z+1,1.1,2,.3,wood);
    for(let j=0;j<3;j++){const lamp=add(new T.SphereGeometry(.28,14,10),amber,x+Math.sin(j)*1.2,4+j*.3,z+Math.cos(j));moving.push({o:lamp,kind:'lantern',base:lamp.position.y,seed:i+j});}
    if(i<3){view.sign(['CANAL WALK','THE LAST TEAHOUSE','STORM DISTRICT →'][i],x,3.2,z+1.3,5,.7,'#e5d3aa','#3e5c59',root);}
  }
  // Portal carved rim, anchoring feet and copper arcs; opening remains unobstructed.
  for(const side of [-1,1]){
    cyl(side*3.35,1.5,-330,.45,3,stone);cyl(side*3.35,.2,-330,.7,.4,iron);
    pipe([[side*3.4,3,-330],[side*3.7,5,-330],[side*2.5,6.6,-330],[side*.1,7,-330]],.18,copper);
  }
  // Rooftop structures: details hug the outside edges, with no extra floor overlays.
  STORM_ROOFS.forEach((r,i)=>{
    const side=i%2?1:-1,x=r.x+side*(r.w/2-.9);
    box(x,14.15,r.z,.55,.3,r.d-2,iron);
    for(const end of [-1,1]){
      // Downspouts end beneath the landing instead of crossing jump edges.
      pipe([[r.x+side*(r.w/2+.12),13.6,r.z+end*(r.d/2-1)],
        [r.x+side*(r.w/2+.4),11,r.z+end*(r.d/2-1)],
        [r.x+side*(r.w/2+.4),3,r.z+end*(r.d/2-1)]],.12,copper);
    }
    cyl(x,14.8,r.z+2,.45,1.6,iron);ring(x,15.4,r.z+2,.5,.08,copper);
    const hood=add(new T.SphereGeometry(.65,18,10,0,Math.PI*2,0,Math.PI/2),jade,x,15.6,r.z+2);hood.scale.y=.55;
    const face=new T.Group();face.position.set(r.x,0,r.z+r.d/2+.12);root.add(face);
    for(const xx of [-5,0,5])for(const y of [3,7.5])window(xx,y,0,2.4,3.3,(i+xx)%2?amber:blue,face);
    for(const y of [2,7,12])box(r.x,y,r.z+r.d/2+.12,r.w,.15,.22,copper);
    // Small side rails identify the perimeter without hiding the next gap.
    for(const flank of [-1,1]){
      const xx=r.x+flank*(r.w/2-.18);
      for(const dz of [-5,0,5])cyl(xx,14.5,r.z+dz,.055,1,iron);
      pipe([[xx,15,r.z-6],[xx,15.05,r.z],[xx,15,r.z+6]],.045,copper);
    }
  });
  // Distant industrial silhouettes, rooflines, tanks and suspended service pipes.
  for(let i=0;i<10;i++){
    const side=i%2?1:-1,x=side*(30+(i%3)*9),z=-352-i*15,h=16+i%4*3;
    box(x,h/2,z,10,h,12,plaster);
    const roof=add(curvedRoof(12,14,2.8),jade,x,h,z);roof.material.side=T.DoubleSide;
    cyl(x+side*3,h+4,z,1.1,8,iron);for(const y of [h+1,h+5,h+7.5])ring(x+side*3,y,z,1.16,.09,copper);
    if(i%2===0){cyl(x-side*7,6,z,2.2,12,copper);add(new T.SphereGeometry(2.2,20,12,0,Math.PI*2,0,Math.PI/2),iron,x-side*7,12,z);}
    const sideFacade=new T.Group();sideFacade.position.set(x,0,z+6.1);root.add(sideFacade);
    for(const xx of [-2.8,2.8])window(xx,h-6,0,1.8,3,amber,sideFacade);
    fan(x,h-3,z+6.3,1.1);
    if(i<8)pipe([[x,8,z],[x+side*4,10,z-6],[x+side*4,10,z-16]],.4,iron);
  }
  // Readable instruction placards at the portal landing, offset from the sightline.
  box(5.5,15.3,-354,.12,2.6,.12,copper);
  view.sign('SPACE · JUMP',5.5,17,-354,3.5,.65,'#f4dfb5','#2a4953',root);
  view.sign('SHIFT · RUN',5.5,16.3,-354,3.5,.65,'#f4dfb5','#2a4953',root);
  // Foundry facade: monumental arch, riveted piers and curved copper entrance roof.
  const front=-516.7;
  for(const side of [-1,1]){
    for(const x of [side*7.5,side*19.7]){cyl(x,11.8,front,.55,23.6,iron);for(const y of [1,8,16,23])ring(x,y,front,.62,.12,copper);}
    for(const x of [side*11,side*16]){window(x,7,front,3.1,7,amber);window(x,17,front,3.1,5,blue);}
    fan(side*14,4,front+.3,1.1);
  }
  const arch=[];for(let i=0;i<=36;i++){const a=i/36*Math.PI;arch.push([Math.cos(a)*7.3,6+Math.sin(a)*4,front+.25]);}pipe(arch,.3,copper);
  for(const side of [-1,1])cyl(side*7.3,3,front+.25,.3,6,copper);
  const entryRoof=add(curvedRoof(16,5,2.5),jade,0,10,front);entryRoof.material.side=T.DoubleSide;
  for(const side of [-1,1])pipe([[side*23,3,-530],[side*25,10,-530],[side*25,23,-540],[side*22,25,-546]],.65,copper);
  // Eighth-floor delivery salon: arches, curved elevator casing and mail reliquaries.
  for(const z of [-552,-578,-602]){
    for(const x of [-17,17]){cyl(x,21,z,.22,6,iron);cyl(x,18.2,z,.42,.4,copper);}
    pipe([[-17,23,z],[-12,24,z],[0,24,z],[12,24,z],[17,23,z]],.16,copper);
  }
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const x=side*18.5,z=-554-i*10;
    box(x,19,z,1.8,2,2.5,wood);box(x,20.08,z,2,.16,2.7,copper);
    const vase=add(new T.LatheGeometry([new T.Vector2(.2,0),new T.Vector2(.48,.25),new T.Vector2(.42,.65),new T.Vector2(.18,.9),new T.Vector2(.25,1.05)],20),jade,x,20.2,z);
    add(new T.SphereGeometry(.2,14,10),blue,x,21.35,z);
  }
  // Open elevator cabin: rounded jambs, recessed walls and a lit interior.
  const enamel=new T.MeshStandardMaterial({color:0x597876,roughness:.66,metalness:.18,map:view.tex});
  const cabinDark=new T.MeshStandardMaterial({color:0x283c43,roughness:.74,map:view.tex});
  box(-2.05,2.2,-572,.3,4.4,6,enamel);box(2.05,2.2,-572,.3,4.4,6,enamel);
  box(0,2.2,-575,4.3,4.4,.3,cabinDark);box(0,4.35,-572,4.5,.3,6.3,enamel);
  box(0,.1,-572,4,.08,5.8,iron);
  for(const x of [-1.8,1.8]){
    cyl(x,2.05,-568.9,.15,4.1,copper);
    box(x,2.1,-569.15,.055,3.7,.045,blue);
    // Doors are visibly retracted into side pockets.
    box(x*1.06,2,-569.2,.2,3.9,.16,iron);
    pipe([[x,1.1,-570],[x,1.1,-574]],.045,gold);
  }
  const top=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;top.push([Math.cos(a)*1.8,3.6+Math.sin(a)*.65,-568.9]);}pipe(top,.14,copper);
  box(0,4.03,-572,2.6,.06,3,amber);
  for(const x of [-1.2,-.6,0,.6,1.2])box(x,2.1,-574.79,.035,3.5,.04,copper);
  box(1.48,1.5,-574.7,.45,.85,.09,copper);
  const button=add(new T.SphereGeometry(.095,16,10),amber,1.48,1.55,-574.61);button.scale.z=.3;
  view.sign('8',0,3.35,-574.7,.7,.6,'#f4dbac','#293d44',root);
  view.sign('E · FLOOR 8',0,4.75,-568.85,3.4,.6,'#efd4a0','#354f53',root);
  const cabinLight=new T.PointLight(0xffd4a0,14,8,2);cabinLight.position.set(0,3.6,-572);root.add(cabinLight);
  // A circular halo-like wall ornament behind the dragon recipient, above eye level.
  const medallion=add(new T.TorusGeometry(2,.12,10,48),gold,10,21,-612.2);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;add(new T.SphereGeometry(.12,10,8),blue,10+Math.cos(a)*2,21+Math.sin(a)*2,-612.05);}
  const pendant=new T.PointLight(0x91c9be,20,16,2);pendant.position.set(10,22,-607);root.add(pendant);
  // Translucent steam stays well outside the playable lane.
  const steamMat=new T.MeshBasicMaterial({color:0xafbec0,transparent:true,opacity:.09,depthWrite:false});
  for(let i=0;i<24;i++){
    const x=(i%2?1:-1)*(26+i%3*4),z=-355-(i%8)*20,y=15+(i%4)*2;
    const puff=add(new T.SphereGeometry(1,10,8),steamMat,x,y,z);puff.scale.set(1.2,1.7,1.2);moving.push({o:puff,kind:'steam',base:y,seed:i});
  }
  mergeStaticMeshes(root,new Set(moving.map(a=>a.o)));
  return {root,update(t,motion){if(!motion)return;for(const a of moving){
    if(a.kind==='fan')a.o.rotation.z=t*.45;
    if(a.kind==='steam'){a.o.position.y=a.base+(t*.6+a.seed)%4;a.o.scale.setScalar(1+(t*.15+a.seed)%1);}
    if(a.kind==='lantern')a.o.position.y=a.base+Math.sin(t*.8+a.seed)*.07;
  }}};
}
