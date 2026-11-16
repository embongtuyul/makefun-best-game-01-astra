import { drawScene } from './render.js';
import { createSound } from './sound.js';

const canvas = document.querySelector('#field');
const ctx = canvas.getContext('2d');
const sound = createSound();
const path = [{x:0,y:330},{x:180,y:330},{x:180,y:170},{x:420,y:170},{x:420,y:505},{x:690,y:505},{x:690,y:230},{x:930,y:230},{x:930,y:400},{x:1280,y:400}];
const kinds = {
 sunwell:{name:'Sunwell',cost:65,range:145,damage:20,rate:.7,color:'#f6ce67',desc:'steady pulse'},
 prism:{name:'Prism',cost:90,range:165,damage:15,rate:.95,color:'#72e5d1',desc:'splits in arcs'},
 lance:{name:'Lance',cost:80,range:245,damage:40,rate:1.45,color:'#ff916b',desc:'long piercing ray'},
 ward:{name:'Ward',cost:70,range:120,damage:10,rate:.5,color:'#a8a2f4',desc:'slows nearby foes'}
};
const enemies = [
 {name:'Drifter',hp:42,speed:36,reward:9,r:10,color:'#b9d9b4'},
 {name:'Skitter',hp:28,speed:58,reward:8,r:8,color:'#efaa68'},
 {name:'Bulwark',hp:130,speed:22,reward:17,r:15,color:'#d77e72'},
 {name:'Veil',hp:72,speed:40,reward:13,r:12,color:'#a99ee8'},
 {name:'Eclipse Heart',hp:600,speed:17,reward:110,r:26,color:'#e8d18b'}
];
let towers=[], foes=[], shots=[], particles=[], wave=0, cash=800, lives=20, selected=null, mode='title', paused=false, speed=1, mute=false, timer=0, spawnLeft=0, spawnClock=0, banner=0, last=0, waveCleared=0, high=Number(localStorage.getItem('astraBest')||0);
const shotParam=new URLSearchParams(location.search).get('shot');
const mouse={x:0,y:0};
window.astraControl={status:()=>({mode,wave,cash,lives,spawnLeft,foes:foes.length,paused,speed}),setMode(value){mode=value},restart:start,launch:launchWave};
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
function sfx(freq=520,duration=.08){if(!mute)sound.play(freq,duration)}
function start(){mode='play';wave=0;cash=800;lives=20;towers=[];foes=[];shots=[];particles=[];selected=null;paused=false;spawnLeft=0;launchWave()}
function launchWave(){if(mode!=='play'||spawnLeft||foes.length)return;wave++;spawnLeft=wave===10?1:6+wave*2;spawnClock=0;waveCleared=wave-1;banner=2;sfx(660,.18)}
function spawn(){let idx=wave===10?4:(wave>=6&&Math.random()<.16?3:wave>=3&&Math.random()<.28?2:wave>=2&&Math.random()<.35?1:0);let base=enemies[idx];let scale=1+(wave-1)*.015;foes.push({kind:base.name,x:path[0].x,y:path[0].y,hp:base.hp*scale,max:base.hp*scale,speed:base.speed*(1+(wave-1)*.001),reward:Math.round(base.reward*1.25)+Math.floor(wave*1.4),r:base.r,color:base.color,seg:0,progress:0,slow:0,boss:idx===4});spawnLeft--}
function place(x,y,type){const k=kinds[type];if(!k||cash<k.cost||!legal(x,y))return false;cash-=k.cost;towers.push({x,y,type,level:1,cool:0,angle:0});selected=towers.at(-1);sfx(820,.06);return true}
function legal(x,y){if(x<55||x>1225||y<85||y>610)return false;if(towers.some(t=>Math.hypot(t.x-x,t.y-y)<48))return false;for(let i=0;i<path.length-1;i++)if(distanceSegment(x,y,path[i],path[i+1])<38)return false;return true}
function distanceSegment(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a.x-dx*t,y-a.y-dy*t)}
function upgrade(){if(!selected||cash<55*selected.level)return;cash-=55*selected.level;selected.level++;selected.cool=0;sfx(960,.12)}
function sell(){if(!selected)return;cash+=Math.floor(kinds[selected.type].cost*(.65+(selected.level-1)*.38));towers=towers.filter(t=>t!==selected);selected=null;sfx(300,.1)}
function update(dt){if(mode!=='play'||paused)return;dt*=speed;timer+=dt;banner=Math.max(0,banner-dt);spawnClock+=dt;if(spawnLeft>0&&spawnClock>.45){spawnClock=0;spawn()}
 for(const f of foes){if(f.slow>0)f.slow=Math.max(0,f.slow-dt);let d=f.speed*(f.slow?0.48:1)*dt;while(d>0&&f.seg<path.length-1){let a=path[f.seg],b=path[f.seg+1],len=Math.hypot(b.x-a.x,b.y-a.y),remaining=len-f.progress,step=Math.min(d,remaining);f.progress+=step;d-=step;f.x=a.x+(b.x-a.x)*f.progress/len;f.y=a.y+(b.y-a.y)*f.progress/len;if(f.progress>=len)f.seg++}if(f.seg>=path.length-1){f.leaked=true;lives-=f.boss?5:1;burst(f.x,f.y,'#fa776b',9)}}
 foes=foes.filter(f=>!f.leaked&&f.hp>0);
 for(const t of towers){t.cool-=dt;const k=kinds[t.type];const candidates=foes.filter(f=>Math.hypot(f.x-t.x,f.y-t.y)<k.range+(t.level-1)*13).sort((a,b)=>b.seg-a.seg||b.progress-a.progress);if(t.type==='ward')for(const f of candidates)f.slow=Math.max(f.slow,.15);if(t.cool<=0&&candidates.length){let target=candidates[0];t.angle=Math.atan2(target.y-t.y,target.x-t.x);t.cool=k.rate/(1+(t.level-1)*.13);shots.push({x:t.x,y:t.y,target,damage:k.damage*(1+(t.level-1)*.45),color:k.color,type:t.type});if(t.type==='lance')t.flash=.12}}
 for(const b of shots){if(!foes.includes(b.target))continue;b.target.hp-=b.damage;if(b.type==='prism'){for(const other of foes)if(other!==b.target&&Math.hypot(other.x-b.target.x,other.y-b.target.y)<58)other.hp-=b.damage*.48}if(b.type==='ward')b.target.slow=.65;burst(b.target.x,b.target.y,b.color,3);for(const f of foes)if(f.hp<=0&&!f.rewarded){f.rewarded=true;cash+=f.reward;burst(f.x,f.y,f.color,12);sfx(f.boss?180:400,.07)}}shots=[];foes=foes.filter(f=>f.hp>0);
 if(lives<=0){mode='lose';paused=false;sfx(110,.5)}else if(spawnLeft===0&&foes.length===0&&wave>0){if(wave>=10){mode='win';high=Math.max(high,wave*100+cash);localStorage.setItem('astraBest',high);sfx(880,.5)}else waveCleared=wave}}
function burst(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*120,vy:(Math.random()-.5)*120,life:.35+Math.random()*.35,color})}
function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);drawScene(ctx,{path,towers,foes,particles,kinds,mode,wave,cash,lives,selected,banner,paused,speed,high,mouse,spawnLeft,waveCleared});requestAnimationFrame(frame)}
canvas.addEventListener('mousemove',e=>Object.assign(mouse,point(e)));
canvas.addEventListener('click',e=>{const p=point(e);if(mode==='title'||mode==='win'||mode==='lose'){start();return}if(mode!=='play')return;let hit=[...towers].reverse().find(t=>Math.hypot(t.x-p.x,t.y-p.y)<23);if(hit){selected=hit;sfx(560,.04);return}if(window.buildType){place(p.x,p.y,window.buildType);return}selected=null});
document.querySelector('#controls').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.action;if(a==='build'){window.buildType=b.dataset.type;sfx(740,.04)}if(a==='upgrade')upgrade();if(a==='sell')sell();if(a==='wave')launchWave();if(a==='pause')paused=!paused;if(a==='speed')speed=speed===1?2:1;if(a==='mute'){mute=!mute;sound.setMuted(mute)}});
window.addEventListener('keydown',e=>{if(['1','2','3','4'].includes(e.key)){window.buildType=['sunwell','prism','lance','ward'][Number(e.key)-1];sfx(740,.04)}if(e.key.toLowerCase()==='u')upgrade();if(e.key.toLowerCase()==='x')sell();if(e.key===' '){e.preventDefault();if(mode==='title')start();else launchWave()}if(e.key.toLowerCase()==='p')paused=!paused;if(e.key.toLowerCase()==='f')speed=speed===1?2:1;if(e.key.toLowerCase()==='m'){mute=!mute;sound.setMuted(mute)}});
if(shotParam){mode=shotParam==='start'?'title':'play';if(shotParam!=='start'){wave=shotParam==='boss'||shotParam==='win'?9:4;cash=shotParam==='boss'?430:315;lives=shotParam==='boss'?13:17;towers=[{x:280,y:275,type:'sunwell',level:2,cool:0,angle:1.1},{x:535,y:310,type:'prism',level:2,cool:0,angle:-1},{x:810,y:340,type:'lance',level:1,cool:0,angle:.2},{x:1070,y:300,type:'ward',level:2,cool:0,angle:2}];if(shotParam==='boss'){foes=[{kind:'Eclipse Heart',x:850,y:230,hp:660,max:900,speed:19,reward:110,r:26,color:'#e8d18b',seg:6,progress:100,boss:true},{kind:'Veil',x:685,y:505,hp:46,max:72,speed:45,reward:13,r:12,color:'#a99ee8',seg:4,progress:220}];spawnLeft=1}else if(shotParam==='mid'){foes=[{kind:'Drifter',x:330,y:170,hp:22,max:42,speed:39,reward:9,r:10,color:'#b9d9b4',seg:2,progress:150},{kind:'Bulwark',x:420,y:340,hp:105,max:130,speed:24,reward:17,r:15,color:'#d77e72',seg:3,progress:170},{kind:'Skitter',x:690,y:505,hp:12,max:28,speed:68,reward:8,r:8,color:'#efaa68',seg:4,progress:270}];spawnLeft=3}else if(shotParam==='win'){mode='win';wave=10;high=1230}}}
requestAnimationFrame(frame);
