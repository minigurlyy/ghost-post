import test from 'node:test';import assert from 'node:assert/strict';import {View} from '../public/view.js';import * as T from '../public/vendor/three.module.js';import {Game} from '../engine.mjs';
test('district and animated entities render finite transforms through delivery stages',()=>{const names=['document','devicePixelRatio','innerWidth','innerHeight','addEventListener'];const saved=Object.fromEntries(names.map(n=>[n,globalThis[n]]));const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});Object.assign(globalThis,{document:{createElement:()=>({getContext:()=>ctx})},devicePixelRatio:1,innerWidth:1280,innerHeight:800,addEventListener:()=>{}});try{const renderer={setPixelRatio(){},setSize(){},shadowMap:{},render(s){s.updateMatrixWorld(true);s.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isInstancedMesh){const m=new T.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));}}});}};const v=new View({},renderer),g=new Game('TEST'),p=g.add('Courier');g.add('Rival');for(const stage of [0,1,2,3,4,5]){p.stage=stage;v.render(g.snapshot(),p,{dt:.016,lean:.7,look:p.look});}for(const z of [-200,-400,-520]){p.portal=z<-330;p.z=z;v.render(g.snapshot(),p,{dt:.016});}// Probe the actual rendered scene, including legacy meshes, for coincident floor tops.
const ray=new T.Raycaster();v.scene.updateMatrixWorld(true);
for(const z of [-41,-52,-80,-103,-140,-174,-181,-250,-312]){
 ray.set(new T.Vector3(.37,.5,z),new T.Vector3(0,-1,0));
 const hits=ray.intersectObjects(v.scene.children,true).filter(h=>h.distance<=.6);
 assert.equal(hits.length,1,`exactly one visible road surface at z=${z}`);
 assert.ok(Math.abs(hits[0].point.y)<1e-5);
}
for(const z of [-354,-376,-398,-420,-442,-464,-486]){
 ray.set(new T.Vector3(.37,14.3,z),new T.Vector3(0,-1,0));
 const hits=ray.intersectObjects(v.scene.children,true).filter(h=>Math.abs(h.point.y-14)<1e-4);
 assert.equal(hits.length,1,`exactly one landing surface at z=${z}`);
}
v.scene.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
const signs=[];v.scene.traverse(o=>{if(o.userData.signText)signs.push(o.userData.signText);});assert.ok(signs.includes('SPACE · JUMP'));assert.ok(signs.includes('SHIFT · RUN'));assert.ok(!signs.includes('SPRINT + SPACE / JUMP THE GAPS'));assert.ok(v.journey.root.children.length>0);ray.set(new T.Vector3(0,2,-567),new T.Vector3(0,0,-1));const cabin=ray.intersectObjects(v.journey.root.children,true).filter(h=>h.distance<9);assert.ok(cabin.length>0);assert.ok(cabin[0].point.z<-574,'open cabin must not have a front wall');assert.ok(v.art.root.children.some(o=>o.isInstancedMesh));assert.equal(v.enemies.size,g.enemies.length);assert.equal(v.people.size,1);assert.ok(v.scene.children.length>300);}finally{for(const n of names){if(saved[n]===undefined)delete globalThis[n];else globalThis[n]=saved[n];}}});
