import * as T from './vendor/three.module.js';

// Authored curved meshes, independent of the simple server collision hulls.
export function roundedBlock(width,height,depth,radius=.16) {
  const w=width/2,d=depth/2,r=Math.min(radius,w*.3,d*.3),s=new T.Shape();
  s.moveTo(-w+r,-d);s.lineTo(w-r,-d);s.quadraticCurveTo(w,-d,w,-d+r);
  s.lineTo(w,d-r);s.quadraticCurveTo(w,d,w-r,d);s.lineTo(-w+r,d);
  s.quadraticCurveTo(-w,d,-w,d-r);s.lineTo(-w,-d+r);s.quadraticCurveTo(-w,-d,-w+r,-d);
  const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:5});
  g.rotateX(-Math.PI/2);g.translate(0,-height/2,0);g.computeVertexNormals();return g;
}

export function archShape(width,height) {
  const r=width/2,s=new T.Shape();s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,height-r);
  s.absarc(0,height-r,r,0,Math.PI,false);s.lineTo(-r,0);return s;
}

// Surface of a swept roof with an upturned eave. Ridge runs in local Z.
export function curvedRoof(width,depth,rise) {
  const positions=[],uv=[],indices=[],nx=24,nz=12;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/nz,a=Math.abs(u*2-1),end=Math.pow(Math.abs(v*2-1),5);
    positions.push((u-.5)*width,rise*Math.pow(1-a,1.45)+.42*Math.pow(a,9)+end*.18,(v-.5)*depth);
    uv.push(u*width/2,v*depth/2);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1;indices.push(a,c,b,b,c,c+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function addArchitecture(view,root,materials) {
  const architectureRoot=new T.Group();architectureRoot.name='Curved architecture';root.add(architectureRoot);root=architectureRoot;
  const {wood,darkWood,plaster,brass,tile,glass}=materials;
  const add=(g,m,x,y,z,parent=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
  const bar=(x,y,z,w,h,d,m,parent=root)=>add(roundedBlock(w,h,d,.07),m,x,y,z,parent);
  function tube(points,r,m,parent=root){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,6,false),m,0,0,0,parent);}
  function archedWindow(x,y,z,width,height,parent=root){
    add(new T.ExtrudeGeometry(archShape(width+.24,height+.18),{depth:.15,bevelEnabled:true,bevelSize:.06,bevelThickness:.05,bevelSegments:2,steps:1,curveSegments:16}),wood,x,y-.06,z,parent);
    add(new T.ShapeGeometry(archShape(width,height),20),glass,x,y,z+.22,parent);
    for(const dx of [-width*.28,0,width*.28])bar(x+dx,y+height*.38,z+.25,.055,height*.74,.045,brass,parent);
    bar(x,y+height*.48,z+.26,width,.06,.05,wood,parent);
    bar(x,y-.08,z+.18,width+.4,.14,.46,wood,parent);
  }
  function canopy(x,y,z,width,depth,parent=root){
    const roof=curvedRoof(width,depth,1.3);const o=add(roof,tile,x,y,z,parent);o.material.side=T.DoubleSide;
    const points=[];for(let i=0;i<=24;i++){const a=Math.abs(i/12-1);points.push([(i/24-.5)*width,1.3*Math.pow(1-a,1.45)+.42*Math.pow(a,9)+.18,depth/2]);}
    const edge=tube(points,.11,wood,parent);edge.position.set(x,y,z);
  }
  function facade(b){
    const z=b.z+b.d/2+.18;
    // A projected central shop bay breaks up the long flat front wall.
    const bay=new T.Group();bay.position.set(b.x,0,z);root.add(bay);
    bar(0,1.65,.25,b.w*.69,3.3,.48,wood,bay);
    for(const dx of [-b.w*.23,0,b.w*.23])archedWindow(dx,.35,.52,2.6,2.7,bay);
    canopy(0,3.5,.95,b.w*.82,3.8,bay);
    for(const dx of [-b.w*.37,b.w*.37]){
      add(new T.CylinderGeometry(.11,.16,3.65,12),wood,dx,1.82,2.3,bay);
      tube([[dx,2.8,2.3],[dx,3.35,2.1],[dx,3.7,1.3]],.1,wood,bay);
    }
    // Rounded bay windows higher up, with a small swept roof and curved sill.
    for(const dx of [-b.w*.28,b.w*.28]){
      bar(dx,5.6,.28,3.5,2.6,1.05,plaster,bay);archedWindow(dx,4.55,.86,2.5,2.2,bay);
      canopy(dx,7,.42,4.3,2.6,bay);
    }
    // Lattice side windows and curved balcony rails face the street.
    const side=new T.Group();side.position.set(b.x-Math.sign(b.x)*(b.w/2+.1),0,b.z);side.rotation.y=-Math.sign(b.x)*Math.PI/2;root.add(side);
    for(let xx=-b.d/2+5;xx<b.d/2-2;xx+=9){
      archedWindow(xx,3.8,.08,2.4,2.65,side);
      bar(xx,3.7,.55,3.3,.16,1.2,wood,side);
      tube([[xx-1.6,4.6,.4],[xx-1.5,4.6,1],[xx,4.6,1.25],[xx+1.5,4.6,1],[xx+1.6,4.6,.4]],.045,brass,side);
      for(let k=-3;k<=3;k++)bar(xx+k*.45,4.13,1.07,.045,.8,.045,brass,side);
    }
  }
  return {house(b){
    const tint=plaster.clone();tint.color.set([0xd3baa0,0xbac2ac,0xc2ada0,0xd9c9a8][Math.abs(Math.round(b.z/84))%4]);
    const shell=add(roundedBlock(b.w,b.h,b.d,.3),tint,b.x,b.h/2,b.z);shell.name='Sculpted building shell';
    if(Math.abs(b.x)>50){
      // These outer buildings are outside the rooftop course.
      const r=add(curvedRoof(b.w+2.8,b.d+2.2,4.2+(b.h%3)),tile,b.x,b.h,b.z);r.name='Curved pitched roof';r.material.side=T.DoubleSide;
      for(const side of [-1,1]){
        const outline=new T.Shape();outline.moveTo(-b.w/2,0);for(let i=0;i<=24;i++){const a=Math.abs(i/12-1);outline.lineTo((i/24-.5)*b.w,4.2*Math.pow(1-a,1.45));}outline.lineTo(b.w/2,0);
        add(new T.ShapeGeometry(outline),darkWood,b.x,b.h,b.z+side*b.d/2);
      }
      tube([[b.x,b.h+4.4,b.z-b.d/2-1],[b.x,b.h+4.3,b.z],[b.x,b.h+4.7,b.z+b.d/2+1]],.17,brass);
    }else{
      // The course keeps its existing flat landing height. Curved apron below it.
      for(const side of [-1,1]){
        const points=[];for(let i=0;i<=12;i++)points.push([b.x-b.w/2+i*b.w/12,b.h-.4+Math.pow(Math.abs(i/6-1),5)*.3,b.z+side*(b.d/2+.3)]);
        tube(points,.18,tile);
      }
    }
    facade(b);
  },postOffice(){
    // Street-facing curved gateway, safely above the opening.
    const arch=[];for(let i=0;i<=32;i++){const t=i/32*Math.PI;arch.push([Math.cos(t)*6.6,4.5+Math.sin(t)*3.5,-27.7]);}
    tube(arch,.24,wood);for(const x of [-6.6,6.6])add(new T.CylinderGeometry(.24,.32,4.5,16),wood,x,2.25,-27.7);
    for(const x of [-13,13]){const o=new T.Group();o.position.set(x,0,-27.6);o.rotation.y=Math.PI;root.add(o);archedWindow(0,3.7,0,4,3.9,o);}
  },finish(){mergeStaticMeshes(root);}};
}

export function mergeStaticMeshes(root,excluded=new Set()){
  root.updateMatrixWorld(true);const inverse=new T.Matrix4().copy(root.matrixWorld).invert(),buckets=new Map();
  function visit(o){if(excluded.has(o))return;if(o.isMesh&&!Array.isArray(o.material)){
    let list=buckets.get(o.material);if(!list)buckets.set(o.material,list=[]);list.push(o);
  }for(const child of o.children)visit(child);}
  visit(root);
  for(const [material,objects] of buckets){
    if(objects.length<2)continue;
    const parts=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));return g;});
    const geometry=new T.BufferGeometry();
    for(const [name,size] of [['position',3],['normal',3],['uv',2]]){
      const length=parts.reduce((sum,g)=>sum+g.attributes.position.count*size,0),values=new Float32Array(length);let offset=0;
      for(const g of parts){const a=g.attributes[name];if(a)values.set(a.array,offset);offset+=g.attributes.position.count*size;}
      geometry.setAttribute(name,new T.BufferAttribute(values,size));
    }
    geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,material);mesh.castShadow=objects.some(o=>o.castShadow);mesh.receiveShadow=objects.some(o=>o.receiveShadow);
    const old=new Set(objects.map(o=>o.geometry));objects.forEach(o=>o.parent.remove(o));old.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());root.add(mesh);
  }
}
