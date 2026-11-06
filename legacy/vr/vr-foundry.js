import {createEnemyFire} from './vr-combat.js';
import {dismissPanel} from './vr-panel-fx.js';
import * as T from './vendor/three.module.js';
import {roundedBlock,mergeStaticMeshes} from './architecture.js';
import {createDispatcher} from './vr-props.js';
import {RoofRun,ROOFS,liftFrame,LIFT_DURATION} from './vr-rooftop-logic.js';
export function createFoundry({scene,materials:m,label,button,occluders,replaceLabel,interactives}){
 const root=new T.Group();root.name='Storm Foundry';root.visible=false;scene.add(root);const run=new RoofRun();
 const add=(g,mat,x,y,z,p=root)=>{const o=new T.Mesh(g,mat);o.position.set(x,y,z);p.add(o);return o;};
 const box=(x,y,z,w,h,d,mat,p=root)=>add(roundedBlock(w,h,d,.16),mat,x,y,z,p);
 const steel=new T.MeshStandardMaterial({color:0x495961,metalness:.55,roughness:.56}),wall=new T.MeshStandardMaterial({color:0x34464b,roughness:.95}),light=new T.MeshBasicMaterial({color:0x9de6d3});const preserve=[];
 function sign(t,x,y,z,w=3,h=.36,p=root){const o=label(t,x,y,z,w,h,p);o.rotation.y=Math.PI;preserve.push(o);return o;}
 for(const [a,b] of ROOFS){box(0,3.9,(a+b)/2,6,7.8,b-a,wall);box(0,7.95,(a+b)/2,6.3,.1,b-a,steel);
  for(const x of [-2.7,2.7]){box(x,8.015,b-.28,.12,.025,.45,light);box(x,8.015,a+.28,.12,.025,.45,light);}
  // Low parapets frame the route without blocking the jumping edges.
  for(const x of [-3.05,3.05])box(x,8.3,(a+b)/2,.18,.6,b-a,steel);
  box(-2,8.45,(a+b)/2,1,.9,1.3,steel);
 }
 for(let z=215;z<305;z+=11)for(const side of [-1,1]){
  const h=9+(z%7),x=side*(9+(z%3));box(x,h/2,z,7,h,8,wall);
  for(let y=3;y<h-1;y+=3)for(const dx of [-1.5,1.5])box(x+dx,y,z-4.03,1,1.3,.06,m.glow);
  add(new T.CylinderGeometry(.65,.9,4,14),steel,x+1,h+2,z);
 }
 const arrivalSigns=new T.Group();arrivalSigns.name='Rooftop arrival instructions';root.add(arrivalSigns);preserve.push(arrivalSigns);let arrivalPassed=false;
 sign('THE ROOFTOPS',0,12.4,229,3.5,.4,arrivalSigns);
 sign('Cross the rooftops to the foundry',-3.8,10.1,228,2.6,.3,arrivalSigns);
 sign('Walk to an edge, then jump across',-3.8,9.65,228,2.6,.3,arrivalSigns);
 sign('Jump: A button / Space',-3.8,9.2,228,2.6,.3,arrivalSigns);

 // Foundry foyer and a second, distinct power-switch puzzle.
 box(0,7.85,283,6,.3,6,steel);box(-3.2,10,278,.3,4.2,16,wall);box(3.2,10,278,.3,4.2,16,wall);box(0,12.2,275.5,6.5,.25,11,steel);for(const side of [-1,1])box(side*2.45,12.2,283.5,1.6,.25,5,steel);
 const barrier=box(0,9.55,278.5,6,3.1,.2,steel);occluders.push(barrier);preserve.push(barrier);
 const powerPanel=new T.Group();powerPanel.position.set(0,8,274);powerPanel.rotation.y=Math.PI;root.add(powerPanel);preserve.push(powerPanel);
 label('POWER THE LIFT',0,3.3,0,3,.4,powerPanel);
 const hint=label('Set the switches: ON · OFF · ON',0,2.55,.02,2.8,.32,powerPanel);
 label('Point and press right trigger / click to switch',0,2.9,.02,3.1,.26,powerPanel);const lamps=[],switches=[];
 for(let i=0;i<3;i++){lamps.push(add(new T.SphereGeometry(.09,12,8),light,-.8+i*.8,2,.05,powerPanel));switches.push(button((i+1)+' · OFF',-.8+i*.8,1.45,.02,.7,.35,'fuse:'+i,powerPanel).o);}
 // Ribbed walls, pipes, and warm brass trim repeat the district's craftsmanship.
 for(const side of [-1,1]){for(let z=272;z<=282;z+=2)box(side*3.01,10,z,.08,3.7,.08,m.brass);add(new T.CylinderGeometry(.1,.1,12,12),m.brass,side*2.8,10.9,278).rotation.x=Math.PI/2;}
 // Rounded open elevator; the whole cabin rises together around the player.
 const cabin=new T.Group();cabin.position.set(0,8,283);root.add(cabin);preserve.push(cabin);
 box(0,-.075,0,3,.18,4,steel,cabin);for(const side of [-1,1]){box(side*1.55,.45,0,.18,.9,4,steel,cabin);box(side*1.55,2.95,0,.18,.5,4,steel,cabin);for(const z of [-1.85,1.85])box(side*1.55,1.8,z,.18,1.8,.22,steel,cabin);}
 // Fixed shaft rails and floor bands slide past the observation windows.
 for(const side of [-1,1]){box(side*2.15,12,283,.16,12,.16,m.brass);for(let y=8;y<=17;y+=1){box(side*2.2,y,283,.14,.07,4,light);}}
 const cabinLamp=new T.PointLight(0xffdfab,5,6,2);cabinLamp.position.set(0,2.85,0);cabin.add(cabinLamp);box(0,3.2,0,3.3,.15,4,steel,cabin);
 for(const x of [-1.4,1.4]){box(x,.9,0,.06,.06,3.6,m.brass,cabin);for(let z=-1.5;z<=1.5;z+=.3)box(x,1.8,z,.02,2.2,.015,m.brass,cabin);}
 for(const x of [-1.4,1.4])box(x,1.7,.2,.04,2.5,.04,light,cabin);
 const frontDoors=[],backDoors=[];
 for(const side of [-1,1]){frontDoors.push(box(side*.75,1.6,-1.95,1.5,3.2,.12,steel,cabin));backDoors.push(box(side*.75,1.6,1.95,1.5,3.2,.12,steel,cabin));}
 // The display faces the passenger and travels with the cabin.
 const screen=label('FLOOR 01',0,2.6,1.86,1.05,.35,cabin,'#b9f5dd','#0c2227');screen.rotation.y=Math.PI;screen.name='Lift floor display';
 const progressTrack=box(0,2.34,1.85,.95,.025,.015,wall,cabin),progressBar=box(-.47,2.34,1.82,.95,.025,.015,light,cabin);progressBar.name='Lift progress';
 function display(text){if(screen.userData.label===text)return;screen.userData.label=text;const c=screen.material.map.image,g=c.getContext('2d');g.fillStyle='#0c2227';g.fillRect(0,0,c.width,c.height);g.fillStyle='#b9f5dd';g.font='bold '+Math.floor(c.height*.23)+'px Arial';g.textAlign='center';g.textBaseline='middle';const lines=text.split('|');lines.forEach((v,i)=>g.fillText(v,c.width/2,c.height*(.3+i*.4),c.width-12));screen.material.map.needsUpdate=true;}

 const liftPanel=new T.Group();liftPanel.position.set(.8,0,1.78);liftPanel.rotation.y=Math.PI;cabin.add(liftPanel);preserve.push(liftPanel);
 const liftButton=button('07  ↑',0,1.35,0,.5,.48,'lift',liftPanel).o;
 // Upper dispatch office, with a clear path from the elevator to the officer.
 box(0,13.85,296,7,.3,22,m.wood);box(-3.6,16,296,.25,4.2,22,wall);box(3.6,16,296,.25,4.2,22,wall);box(0,18.2,296,7.4,.25,22,steel);box(0,16,307,7.4,4.2,.25,wall);
 for(const x of [-3.43,3.43])for(const z of [290,295,300]){box(x,16,z,.05,1.9,2,m.glow);box(x*.8,14.6,z,.6,1.2,.8,steel);}
 const officer=createDispatcher({supernatural:true});officer.position.set(0,14,302);officer.rotation.y=Math.PI;root.add(officer);preserve.push(officer);
 const desk=box(0,14.5,300,3.4,1,1.1,steel);occluders.push(desk);preserve.push(desk);
 const recipientPanel=new T.Group();recipientPanel.position.set(0,14,298.8);recipientPanel.rotation.y=Math.PI;root.add(recipientPanel);preserve.push(recipientPanel);
 const recipientTitle=label('MAJOR ASH · ROOM 07',0,2.7,0,3.4,.4,recipientPanel);
 const story=label('“Even the forgotten deserve their mail.”',0,2.2,0,4,.32,recipientPanel);story.visible=false;
 const deliverButton=button('DELIVER PARCEL',0,1.2,0,2.4,.4,'deliver',recipientPanel).o;
 const receipt=label('',0,1.75,0,4,.3,recipientPanel);receipt.visible=false;
 const replay=button('PLAY AGAIN',0,1.15,0,2.4,.35,'return',recipientPanel).o;replay.visible=false;
 const finishMenu=button('RETURN TO MENU',0,.65,0,2.4,.35,'finish-menu',recipientPanel).o;finishMenu.visible=false;
 const ember=add(new T.SphereGeometry(.12,14,10),light,0,15.2,300);ember.visible=false;preserve.push(ember);
 const rainValues=[];for(let i=0;i<230;i++)rainValues.push(Math.sin(i*2.4)*15,9+(i%17),218+(i*.43)%65);
 const rainGeometry=new T.BufferGeometry();rainGeometry.setAttribute('position',new T.Float32BufferAttribute(rainValues,3));const rain=new T.Points(rainGeometry,new T.PointsMaterial({color:0xa5bdc9,size:.035,transparent:true,opacity:.65}));root.add(rain);preserve.push(rain);
 const enemies=[];
 for(const [i,z] of [237,248,260].entries()){
  const g=new T.Group();g.position.set(i%2?1.7:-1.7,9.4,z);root.add(g);
  const cloak=add(new T.ConeGeometry(.4,1.35,16),wall,0,-.15,0,g);
  const mask=add(new T.SphereGeometry(.24,14,10),m.paper,0,.5,.12,g);mask.scale.set(.85,1.2,.5);
  for(const side of [-1,1])add(new T.SphereGeometry(.04,8,6),light,side*.09,.53,.25,g);
  mergeStaticMeshes(g);const hitbox=add(new T.SphereGeometry(.65,10,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,.05,0,g);hitbox.userData.action='roofspirit:'+i;hitbox.userData.label='Foundry sentry';interactives.push(hitbox);enemies.push({root:g,hp:2,x:g.position.x,z,hitbox});preserve.push(g);
 }
 mergeStaticMeshes(root,new Set(preserve));
 const fire=createEnemyFire({root,enemies,occluders});
 function refresh(stage){const upper=['recipient','delivered'].includes(stage),f=liftFrame(stage==='elevator'?run.liftTime:upper?LIFT_DURATION:0);
 frontDoors.forEach((o,i)=>{o.position.x=(i?1:-1)*(.75+f.frontOpen*1.48);o.visible=f.frontOpen<.99;});backDoors.forEach((o,i)=>{o.position.x=(i?1:-1)*(.75+f.backOpen*1.48);o.visible=f.backOpen<.99;});
 display((stage==='elevator'?f.phase:upper?'Doors open':'Ready')+'|'+(stage==='elevator'?'↑ ':'')+'FLOOR '+String(f.floor).padStart(2,'0'));
 const progress=(f.height-8)/6;progressBar.scale.x=Math.max(.005,progress);progressBar.position.x=-.475+.475*progress;
 barrier.visible=!run.power;liftPanel.visible=run.power&&stage==='rooftops';lamps.forEach((o,i)=>o.material=run.fuses[i]?light:wall);switches.forEach((o,i)=>{o.userData.active=!run.power;replaceLabel(o,`${i+1} · ${run.fuses[i]?'ON':'OFF'}`);});recipientPanel.visible=['recipient','delivered'].includes(stage);deliverButton.visible=deliverButton.userData.plate.visible=stage==='recipient';story.visible=receipt.visible=replay.visible=finishMenu.visible=ember.visible=stage==='delivered';replay.userData.plate.visible=finishMenu.userData.plate.visible=stage==='delivered';replaceLabel(recipientTitle,stage==='delivered'?'DELIVERY COMPLETE!':'MAJOR ASH · ROOM 07');}
 function enter(){run.enter();fire.clear();enemies.forEach(e=>{e.hp=2;e.root.visible=true;});arrivalPassed=false;dismissPanel(arrivalSigns,false,0);dismissPanel(powerPanel,false,0);root.visible=true;refresh('rooftops');}
 function tick(dt,time,player,stage){if(player.z>229)arrivalPassed=true;if(player.z<225)arrivalPassed=false;dismissPanel(arrivalSigns,arrivalPassed,dt);dismissPanel(powerPanel,run.power,dt);const result=run.tick(dt,player.x,player.z,stage);cabin.position.y=stage==='elevator'?run.feet:['recipient','delivered'].includes(stage)?14:8;officer.userData.update(dt,player);rain.position.y=-(time*7)%8;ember.position.y=15.2+Math.sin(time*1.3)*.05;refresh(stage);return result;}
 return {combat(dt,time,player,stage){for(const e of enemies){e.root.position.x=e.x+Math.sin(time*.8+e.z)*.55;e.root.position.y=9.4+Math.sin(time+e.z)*.1;e.root.rotation.y=Math.atan2(player.x-e.root.position.x,player.z-e.z);}return fire.tick(dt,player,stage!=='rooftops'||player.z<230||player.z>267||player.y<8);},clearShots:()=>fire.clear(),shoot(a,damage=1){if(!a.startsWith('roofspirit:'))return false;const e=enemies[Number(a.split(':')[1])];if(!e||e.hp<=0)return false;e.hp=Math.max(0,e.hp-damage);e.root.visible=e.hp>0;return e.hp===0?'kill':true;},insideCabin:(x,z)=>Math.abs(x)<1.3&&z>281.3&&z<284.7,root,run,receipt,ready:officer.userData.ready,enter,tick,refresh,spawn:()=>({x:0,z:224,y:8}),stop(){fire.clear();root.visible=false;run.reset();}};
}
