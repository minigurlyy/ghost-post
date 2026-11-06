// Original procedural score and foley. No remote audio or autoplay dependency.
export class PostAudio {
  constructor(factory=()=>new (window.AudioContext||window.webkitAudioContext)()){
    this.factory=factory;this.music=.16;this.effects=.65;this.active=false;this.nextPhrase=0;this.phrase=0;this.zone="office";this.nextEnvironment=0;
  }
  async unlock(){
    try{
      if(!this.ctx){
        const c=this.ctx=this.factory();this.output=c.createGain();this.output.gain.value=this.active?1:0;
        this.musicBus=c.createGain();this.fxBus=c.createGain();this.musicBus.connect(this.output);this.fxBus.connect(this.output);this.output.connect(c.destination);
        this.musicBus.gain.value=this.music;this.fxBus.gain.value=this.effects;
        // Three softly detuned, slowly breathing voices form the low ambience.
        [73.416,110,146.832].forEach((frequency,i)=>{
          const voice=c.createOscillator(),gain=c.createGain(),lfo=c.createOscillator(),depth=c.createGain();
          voice.type='sine';voice.frequency.value=frequency;voice.detune.value=i===1?-5:3;
          gain.gain.value=.035;depth.gain.value=.012;lfo.frequency.value=.055+i*.017;
          lfo.connect(depth);depth.connect(gain.gain);voice.connect(gain);gain.connect(this.musicBus);voice.start();lfo.start();
        });
        const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*1.8),c.sampleRate),data=buffer.getChannelData(0);
        let seed=913;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296)*2-1;}this.noiseBuffer=buffer;
      }
      await this.ctx.resume();return true;
    }catch{return false;}
  }
  setZone(zone){if(this.zone!==zone){this.zone=zone;this.nextEnvironment=0;}}
  setLevels(music,effects){
    this.music=Math.max(0,Math.min(.3,Number(music)||0));this.effects=Math.max(0,Math.min(1,Number(effects)||0));
    if(this.ctx){this.musicBus.gain.setTargetAtTime(this.music*(this.ducked?.35:1),this.ctx.currentTime,.12);this.fxBus.gain.setTargetAtTime(this.effects,this.ctx.currentTime,.08);}
  }
  setDucked(value){if(this.ducked===value)return;this.ducked=value;if(this.ctx)this.musicBus.gain.setTargetAtTime(this.music*(value?.35:1),this.ctx.currentTime,.3);}
  setActive(active){
    if(this.active===active)return;this.active=active;
    if(this.ctx)this.output.gain.setTargetAtTime(active?1:0,this.ctx.currentTime,.16);
    if(active&&this.ctx)this.nextPhrase=this.ctx.currentTime+1;
  }
  tone(freq,duration,volume=.12,delay=0,type='sine',bus=this.fxBus,endFreq=freq){
    if(!this.ctx||!bus)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+duration);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(bus);o.start(t);o.stop(t+duration+.025);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  noise(duration,volume,frequency){
    if(!this.ctx)return;const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    s.buffer=this.noiseBuffer;f.type='lowpass';f.frequency.value=frequency;
    g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    s.connect(f);f.connect(g);g.connect(this.fxBus);s.start(t);s.stop(t+duration);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};
  }
  play(event){
    if(!this.ctx||!this.active||!this.effects)return;
    switch(event){
      case 'reload':this.noise(.12,.15,1800);this.tone(160,.12,.07);this.tone(320,.12,.07,1.25);break;
      case 'empty':this.noise(.04,.10,2200);break;
      case 'enemyshot':this.tone(180,.25,.09,0,'sawtooth',this.fxBus,75);break;
      case 'jump':this.noise(.1,.07,500);break;
      case 'lift':this.tone(48,7,.08,0,'sine',this.fxBus,65);this.tone(96,7,.025,0,'triangle',this.fxBus,130);break;
      case 'door':this.noise(1.2,.13,750);this.tone(210,1.1,.025,0,'triangle',this.fxBus,145);break;
      case 'liftstop':this.noise(.25,.09,240);this.tone(60,.45,.07,0,'sine',this.fxBus,35);break;
      case 'arrival':this.tone(880,.8,.12);this.tone(659,.9,.08,.22);break;
      case 'bell':this.tone(1046.5,1.4,.16);this.tone(1568,1,.075,.012);this.tone(2093,.8,.035,.018);break;
      case 'step':this.noise(.085,.1,650);this.tone(95,.065,.06,0,'sine',this.fxBus,55);break;
      case 'shot':this.noise(.13,.18,1900);this.tone(310,.17,.13,0,'triangle',this.fxBus,70);this.tone(920,.23,.045,.02);break;
      case 'hit':this.tone(880,.35,.12);this.tone(1320,.5,.07,.06);break;
      case 'seal':this.tone(440,.25,.10);this.tone(660,.38,.055,.07);break;
      case 'unlock':case 'parcel':[440,554.37,659.25].forEach((n,i)=>this.tone(n,.6,.08,i*.1));this.noise(.14,.06,1300);break;
      case 'stamp':this.noise(.1,.23,900);this.tone(85,.14,.15,0,'sine',this.fxBus,40);[293.66,440,587.33].forEach((n,i)=>this.tone(n,1.3,.075,.15+i*.15));break;
      case 'error':this.tone(185,.22,.09,0,'triangle',this.fxBus,140);break;
      case 'teleport':this.tone(220,.3,.07,0,'sine',this.fxBus,660);break;
      case 'dispatch':this.tone(523.25,.45,.1);this.tone(783.99,.6,.07,.12);break;
      default:this.tone(420,.09,.06);
    }
  }
  tick(){
    if(this.ctx&&this.active&&!this.ducked&&this.effects&&this.ctx.currentTime>=this.nextEnvironment){
      const z=this.zone;
      if(z==='canal'){this.noise(1.4,.022,380);this.tone(740,1.6,.018,.1);this.tone(1110,1.3,.009,.24);}
      if(z==='storm'){this.noise(1.7,.065,1200);this.tone(36,1.6,.018,0,'sine',this.fxBus,26);}
      if(z==='office'){this.noise(.35,.02,900);this.tone(130,.55,.012,0,'triangle',this.fxBus,95);}
      if(z==='room'){this.tone(55,1.5,.014);}
      this.nextEnvironment=this.ctx.currentTime+(z==='storm'?1.5:z==='canal'?4.5:7);
    }
    if(!this.ctx||!this.active||!this.music||this.ctx.currentTime<this.nextPhrase)return;
    const phrases=[[293.66,440,349.23],[220,329.63,293.66],[293.66,349.23,523.25],[261.63,440,329.63]];
    phrases[this.phrase++%phrases.length].forEach((n,i)=>{
      this.tone(n,3.6,.09,i*1.35,'sine',this.musicBus);this.tone(n*2,2.1,.018,i*1.35+.01,'sine',this.musicBus);
    });this.nextPhrase=this.ctx.currentTime+9;
  }
}
