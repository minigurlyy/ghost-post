import {VOICE_CLIPS} from './vr-voice-clips.js';
export const LINES={
 dispatch:{speaker:'DISPATCH',text:'Your first delivery client is Major Ash. He’s waiting in room seven. Pick up his parcel at the sorting desk. Keep it sealed.'},
 parcel:{speaker:'DISPATCH',text:'Follow the lanterns to the portal. Cross the rooftops, then take the lift to room seven.'},
 lift:{speaker:'LIFT',text:'Doors closing. Next stop, floor seven.'},
 arrival:{speaker:'LIFT',text:'Floor seven. Major Ash is straight ahead.'},
 delivered:{speaker:'MAJOR ASH',text:'You brought it back. I thought this light was lost forever. Thank you, courier.'}
};
export class Dialogue {
 constructor(caption,host=globalThis){this.caption=caption;this.host=host;this.current=null;this.elapsed=0;this.active=true;this.volume=.65;}
 say(id){if(!LINES[id])return;this.clear();this.current=LINES[id];this.id=id;this.duration=Math.max(4,this.current.text.length/13+1);this.caption(this.current.speaker+'|'+this.current.text);this.startVoice();}
 startVoice(){
  if(!this.current||!this.active||!this.volume)return;
  if(VOICE_CLIPS[this.id]&&this.host.Audio){this.audio=new this.host.Audio(VOICE_CLIPS[this.id]);this.audio.volume=this.volume;const audio=this.audio;audio.onloadedmetadata=()=>{if(this.audio===audio&&Number.isFinite(audio.duration))this.duration=Math.max(this.duration,this.elapsed+audio.duration+.4);};audio.play().catch(()=>{if(this.audio===audio&&this.current&&this.active)this.speak();});return;}
  this.speak();
 }
 speak(){const synth=this.host.speechSynthesis,Utterance=this.host.SpeechSynthesisUtterance;if(!synth||!Utterance||!this.current||!this.active)return;
  const u=new Utterance(this.current.text);u.lang='en-US';u.rate=this.id==='delivered'?.88:.95;u.pitch=this.id==='delivered'?.75:.9;u.volume=this.volume;
  const voices=synth.getVoices();u.voice=voices.find(v=>/^en/i.test(v.lang)&&/Daniel|David|George|James/i.test(v.name))||voices.find(v=>/^en/i.test(v.lang))||null;
  synth.speak(u);
 }
 stopVoice(){if(this.audio){this.audio.pause();this.audio=null;}this.host.speechSynthesis?.cancel();}
 tick(dt,active,volume){const changed=this.active!==active,oldVolume=this.volume;this.active=active;this.volume=volume;
  if(!active){if(changed)this.stopVoice();this.caption('');return;}
  if(this.current){if(changed){this.elapsed=0;this.caption(this.current.speaker+'|'+this.current.text);this.startVoice();}if(!volume&&oldVolume)this.stopVoice();if(this.audio)this.audio.volume=volume;this.elapsed+=dt;if(this.elapsed>=this.duration)this.clear();}
 }
 clear(){this.stopVoice();this.current=null;this.elapsed=0;this.caption('');}
}
