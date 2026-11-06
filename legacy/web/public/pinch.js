// Thumb/index contact relative to palm width, with hysteresis and release-to-rearm.
export class PinchDetector {
 constructor(){this.reset();}
 reset(){this.armed=false;this.closedFrames=0;this.lastFire=-Infinity;this.state='Show your hand';}
 update(hand,time){if(!hand||hand.length<21){this.armed=false;this.closedFrames=0;this.state='Show your hand';return false;}
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
 const palm=distance(hand[5],hand[17]);if(palm<.025){this.state='Bring your hand closer';return false;}
 const ratio=distance(hand[4],hand[8])/palm;
 if(ratio>.65){this.armed=true;this.closedFrames=0;this.state='Ready — pinch thumb + index';return false;}
 if(ratio<.32&&this.armed){this.closedFrames++;if(this.closedFrames>=2&&time-this.lastFire>800){this.armed=false;this.closedFrames=0;this.lastFire=time;this.state='Clock it! Pinch detected';return true;}}
 else this.closedFrames=0;
 if(!this.armed)this.state='Open thumb + index to reset';
 return false;
 }
}
