// Shared collision geometry, in metres. North is negative Z.
export const LANDMARKS=[{name:'GHOST POST',x:0,z:8},{name:'LANTERN MARKET',x:-48,z:-88},{name:'ROOFTOP ROW',x:48,z:-135},{name:'CANAL WALK',x:-55,z:-197},{name:'THE OLD FOUNDRY',x:0,z:-290}];
export const STATIONS={dispatch:{x:0,z:5},parcel:{x:12,z:20},gate:{x:0,z:-260},lift:{x:0,z:-286},recipient:{x:10,z:-304}};
export const BLOCKS=[];
const b=(x,z,w,d,h,color=0x647d79,type='house')=>BLOCKS.push({x,z,w,d,h,color,type});
// Postal hall, physically open toward the city. Back room on the right.
b(-19,8,1,42,9,0xae7662,'wall');b(19,8,1,42,9,0xae7662,'wall');b(0,29,38,1,9,0xae7662,'wall');b(-13,-13,12,1,9,0xae7662,'wall');b(13,-13,12,1,9,0xae7662,'wall');
// The three routes thread between inhabited blocks; rooftops remain traversable.
for(let row=0;row<5;row++){const z=-47-row*42;for(const col of [-1,1]){b(col*22,z,19,23,8+(row%3)*2,[0x6e8380,0xa48f76,0x9d756b,0x7a8694,0x849475][row]);b(col*70,z+3,24,27,12+(row%2)*3,[0xa18773,0x6c8385,0x8a747a][row%3]);}}
// Foundry lobby and upper delivery floor.
b(-21,-290,1,62,24,0x4d6465,'wall');b(21,-290,1,62,24,0x4d6465,'wall');b(0,-321,42,1,24,0x4d6465,'wall');b(-14,-259,14,1,24,0x4d6465,'wall');b(14,-259,14,1,24,0x4d6465,'wall');
export const RAMPS=[{x:45,z:-61,w:7,d:26,h:10,dir:-1},{x:45,z:-145,w:7,d:26,h:10,dir:-1},{x:-45,z:-103,w:7,d:26,h:12,dir:-1}];
export const PLATFORMS=[{x:38,z:-80,w:23,d:12,h:10},{x:45,z:-108,w:7,d:46,h:10},{x:39,z:-164,w:22,d:12,h:10},{x:45,z:-192,w:7,d:46,h:10},{x:-38,z:-122,w:23,d:12,h:12},{x:-45,z:-150,w:7,d:46,h:12}];
// Long north–south city blocks keep this a journey rather than a single arena.
for(const list of [LANDMARKS,Object.values(STATIONS),BLOCKS,RAMPS,PLATFORMS])for(const o of list){o.z*=2;if(o.d)o.d*=2;}

export const PORTAL={x:0,z:-330};
export const STORM_ROOFS=Array.from({length:7},(_,i)=>({x:i===0||i===6?0:[0,3,-3,2,-2,3][i],z:-354-i*22,w:16,d:19.5,h:14}));
// Keep the storm route separate from street-level collision surfaces.
for(let i=BLOCKS.length-1;i>=0;i--)if(BLOCKS[i].type==='house'&&BLOCKS[i].z<-320)BLOCKS.splice(i,1);
for(let i=PLATFORMS.length-1;i>=0;i--)if(PLATFORMS[i].z-PLATFORMS[i].d/2<-330)PLATFORMS.splice(i,1);
for(let i=RAMPS.length-1;i>=0;i--)if(RAMPS[i].z-RAMPS[i].d/2<-330)RAMPS.splice(i,1);
PLATFORMS.push(...STORM_ROOFS);
RAMPS.push({x:0,z:-509,w:14,d:26,h:14,dir:1});
LANDMARKS.splice(2,2,{name:'STORM PORTAL',x:0,z:-330},{name:'THUNDER ROOFTOPS',x:0,z:-424});

export function inside(x,z,b,pad=0){return Math.abs(x-b.x)<b.w/2+pad&&Math.abs(z-b.z)<b.d/2+pad;}
export function floorAt(x,z,y){let floor=z<-334&&z>-498?-35:0;for(const b of [...BLOCKS,...PLATFORMS])if(inside(x,z,b)&&b.h<=y+.42)floor=Math.max(floor,b.h);for(const r of RAMPS)if(inside(x,z,r)){const h=(.5+(r.z-z)/r.d*(r.dir===1?-1:1))*r.h;if(h<=y+.65)floor=Math.max(floor,h);}if(z<-542&&Math.abs(x)<20&&y>16)floor=Math.max(floor,18);return floor;}
export function blocked(x,z,y,stage=0,portal=false){if(Math.abs(x)>94||z>56||z<-638)return true;if(z<-32&&stage<2)return true;if(z<-334&&stage===2&&!portal)return true;if(z<-524&&stage<3)return true;return BLOCKS.some(b=>inside(x,z,b,.42)&&y<b.h-.3);}
export function move(p,dx,dz){const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.25));for(let i=0;i<n;i++){if(!blocked(p.x+dx/n,p.z,p.y,p.stage,p.portal))p.x+=dx/n;if(!blocked(p.x,p.z+dz/n,p.y,p.stage,p.portal))p.z+=dz/n;const f=floorAt(p.x,p.z,p.y);if(f>p.y)p.y=f;}}
export function clearLine(a,b){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(d/.6);for(let i=1;i<n;i++){const t=i/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=(a.y||0)+1+( (b.y||0)-(a.y||0))*t;if(BLOCKS.some(q=>inside(x,z,q)&&y<q.h))return false;}return true;}
export const near=(a,b,r=4)=>Math.hypot(a.x-b.x,a.z-b.z)<r;
export const safe=p=>p.z>-32||p.stage>=3||p.puzzle||p.respawn>0;
export const SYMBOLS=['☾','✿','≈','✦'];
export const PIPE_PORTS=[[1,2],[2,3],[1,2],[0,3],[0,2],[0,2],[1,3],[0,1],[0,3]];
export function powerSolved(turns){if(!Array.isArray(turns)||turns.length!==9||!turns.every(Number.isInteger))return false;const ports=PIPE_PORTS.map((p,i)=>p.map(v=>((v+turns[i])%4+4)%4));if(!ports[3].includes(3))return false;let i=3,entry=3;const visited=new Set();while(!visited.has(i)){visited.add(i);if(!ports[i].includes(entry))return false;const exit=ports[i].find(v=>v!==entry);if(i===2&&exit===1)return true;const row=Math.floor(i/3),col=i%3,nr=row+[-1,0,1,0][exit],nc=col+[0,1,0,-1][exit];if(nr<0||nr>2||nc<0||nc>2)return false;i=nr*3+nc;entry=(exit+2)%4;}return false;}
