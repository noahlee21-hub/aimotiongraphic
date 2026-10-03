import {FilmRenderer} from './renderer.js';
import {FPS,clamp,smooth,specimens,flightAt} from './motion.js';
import {preparePetals,drawFlowerFrame,makePaper,makeTitle,isolateSpecimens} from './layers.js';
const $=s=>document.querySelector(s);
const canvas=$('#scene'),video=$('#source'),seek=$('#seek');
const compare=new URLSearchParams(location.search).get('compare')==='1';
if(compare){document.body.classList.add('compare');$('.reference').hidden=false;}
let renderer,manifest,ready=false,frame=0,currentTime=0,flowerLayers,butterflyLayers;
const images=new Map(),flowerCanvas=document.createElement('canvas');
const fail=e=>{$('#loading').style.display='none';$('#error').hidden=false;$('#error').textContent=String(e.message||e);};
function loadImage(url){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('이미지를 불러오지 못했습니다: '+url));i.src=url;});}
function videoReady(){return new Promise((resolve,reject)=>{if(video.readyState>=2)return resolve();video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',()=>reject(Error('원본 동영상 로딩 실패')),{once:true});video.load();});}
function currentShot(f){let lo=0,hi=manifest.shots.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(manifest.shots[mid].frame<=f)lo=mid;else hi=mid-1;}return manifest.shots[lo];}
function render(time){
 if(!ready)return;currentTime=time;frame=Math.min(490,Math.floor(time*FPS+.0001));const shot=currentShot(frame);
 const local=time-shot.start;
 if(frame<134){renderer.plate(video,{dynamic:true});}
 else if(frame<353){
  const image=images.get(shot.key);
  if(frame>=333){drawFlowerFrame(flowerCanvas,flowerLayers,local);renderer.plate(flowerCanvas,{dynamic:true});}
  else{
   // The source's plate pull-back advances on twos; short montage shots are effectively held frames.
   const steps=Math.floor((frame-shot.frame)/2),zoom=shot.frame<197?1-steps*.006:1;
   renderer.plate(image,{zoom});
  }
 }else if(frame>=488){renderer.plate(video,{dynamic:true});}
 else{
  if(frame>=388&&frame<398){renderer.plate(makeTitle(images.get('coral-source'),true,50*(1-smooth((frame-390)/8)),frame<390?0:1),{dynamic:true});}
  else if(frame>=446&&frame<450){renderer.plate(makeTitle(images.get('ivory-source'),false,frame<448?32:0),{dynamic:true});}
  else renderer.plate(frame<388?images.get('paper'):frame<446?images.get('coral'):images.get('ivory'),{zoom:frame>=486?.3:frame>=484?.75:1});
  if(frame<437){for(const b of flightAt(time))renderer.butterfly(butterflyLayers[b.species],specimens[b.species],b);}
  if(frame>=486){const u=clamp((time-486/FPS)/.08);renderer.butterfly(butterflyLayers[5],specimens[5],{x:930-u*475,y:345+u*28,z:630+u*90,scale:1.05,roll:-.28,pitch:.1,flap:.18+u*.55,blur:2+u*3});}
 }
 seek.value=time;if(document.activeElement!==$('#frame-input'))$('#frame-input').value=frame;$('#time').textContent=time.toFixed(2).padStart(5,'0');
 canvas.dataset.frame=String(frame);canvas.dataset.shot=shot.key;canvas.dataset.time=String(time);
}
function playbackUI(){const paused=video.paused;$('#play').textContent=paused?'▷':'Ⅱ';$('#play').setAttribute('aria-label',paused?'재생':'일시정지');}
async function toggle(){if(!ready)return;if(video.paused){if(video.ended)video.currentTime=0;await video.play();}else video.pause();playbackUI();}
function seekTo(time){if(!ready)return;video.currentTime=Math.max(0,Math.min(manifest.duration-.045,time));}
function step(delta){video.pause();seekTo((frame+delta)/FPS+.001);playbackUI();}
$('#play').onclick=()=>toggle().catch(fail);
$('#replay').onclick=async()=>{seekTo(0);await video.play();playbackUI();};
$('#previous').onclick=()=>step(-1);$('#next').onclick=()=>step(1);
$('#frame-input').onchange=e=>{video.pause();seekTo(Number(e.target.value)/FPS+.001);};
seek.oninput=e=>seekTo(Number(e.target.value));
$('#audio').onclick=()=>{video.muted=!video.muted;$('#audio').setAttribute('aria-pressed',String(!video.muted));$('#audio').setAttribute('aria-label',video.muted?'소리 켜기':'소리 끄기');};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#film').requestFullscreen();}catch(e){console.warn(e.message);}};
document.addEventListener('keydown',e=>{if(['INPUT','BUTTON'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.code==='ArrowLeft'){e.preventDefault();step(-1);}if(e.code==='ArrowRight'){e.preventDefault();step(1);}});
video.addEventListener('play',playbackUI);video.addEventListener('pause',playbackUI);
video.addEventListener('seeked',()=>render(video.currentTime));
video.addEventListener('ended',async()=>{video.currentTime=0;await video.play();});
window.addEventListener('resize',()=>render(currentTime));
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();video.pause();fail(Error('그래픽 연결이 중단되었습니다. 새로고침해주세요.'));});
function followVideo(){video.requestVideoFrameCallback((now,metadata)=>{render(metadata.mediaTime);followVideo();});}
async function init(){
 renderer=new FilmRenderer(canvas);manifest=await fetch('shots.json').then(r=>r.json());
 const keys=[...new Set(manifest.shots.filter(s=>s.frame>=134&&s.frame<353).map(s=>s.key))];
 let done=0;
 await Promise.all([videoReady(),...keys.map(async key=>{images.set(key,await loadImage(`assets/plates/${key}.jpg`));$('#loading').textContent=`불러오는 중… ${++done}/${keys.length}`;})]);
 images.set('butterflies',await loadImage('assets/butterfly-source.jpg'));
 butterflyLayers=isolateSpecimens(images.get('butterflies'));
 const paper=makePaper(images.get('butterflies'));images.set('paper',paper);images.set('coral-source',await loadImage('assets/coral-source.jpg'));images.set('ivory-source',await loadImage('assets/ivory-source.jpg'));images.set('coral',makeTitle(images.get('coral-source'),true));images.set('ivory',makeTitle(images.get('ivory-source')));
 flowerLayers=preparePetals(images.get('flowers'));ready=true;document.body.dataset.ready='true';$('#loading').style.display='none';
 if('requestVideoFrameCallback'in video)followVideo();else{const tick=()=>{render(video.currentTime);requestAnimationFrame(tick);};tick();}
 render(0);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){seekTo(333/FPS+.001);}else{try{await video.play();}catch{playbackUI();}}
}
init().catch(fail);
