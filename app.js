'use strict';
(() => {
const $=s=>document.querySelector(s),canvas=$('#scene'),gl=canvas.getContext('webgl',{alpha:false,antialias:false});
const W=1000,DURATION=20.455,layer=document.createElement('canvas');layer.width=layer.height=W;const ctx=layer.getContext('2d',{alpha:false});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let t=reduced?14.15:0,playing=!reduced,last=0,ready=false,raf;
function fail(s){$('#loading').style.display='none';$('#error').hidden=false;$('#error').textContent=s;}
if(!gl){fail('WebGL is unavailable. Enable hardware acceleration and reload to play this study.');return;}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));
gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 uv;uniform sampler2D image;uniform float time;uniform vec2 resolution;float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 q=vec2(uv.x,1.-uv.y);vec3 c=texture2D(image,q).rgb;float grain=noise(floor(uv*resolution)+floor(time*12.)*vec2(13.,7.));c+=(grain-.5)*.027;c-=pow(length(uv-.5),2.)*.035;gl_FragColor=vec4(c,1.);}`));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){fail(gl.getProgramInfoLog(program));return;}gl.useProgram(program);
const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
const un=Object.fromEntries(['image','time','resolution'].map(n=>[n,gl.getUniformLocation(program,n)]));const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
function load(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Unable to load '+src));im.src=src;});}
let specimens,studies;Promise.all([load('assets/specimens.png'),load('assets/n-studies.png')]).then(images=>{[specimens,studies]=images;ready=true;$('#loading').style.display='none';}).catch(e=>fail(e.message));
const rnd=n=>{let r=Math.sin(n*127.1+31.7)*43758.5453;return r-Math.floor(r);};const mix=(a,b,v)=>a+(b-a)*v;const clamp=v=>Math.max(0,Math.min(1,v));const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
// Uneven cuts follow the reference's long opening, acceleration, rapid match cuts and final hold.
// Cut boundaries sampled from the source at 30 Hz; rapid montage includes 3–5 frame cuts.
const cuts=[
[0,'butterfly',2.15,1.55],[1.50,'map',1.65,1.62],[2.60,'ceramic',1.9,1.87],[3.60,'botanical',1.85,1.82],[4.2667,'blueprint',1.65,1.65],[4.7667,'geometry',1.7,1.7],[5.1667,'fish',1.8,1.8],
[5.60,'floral',1.43,1.43],[5.9333,'geometry',1.32,1.32],[6.1667,'eggs',1.25,1.25],[6.4333,'cells',1.17,1.17],[6.6667,'score',1.15,1.15],[6.9667,'stamps',1.1,1.1],[7.2667,'floral',1.05,1.05],[7.4333,'type',1.05,1.05],[7.60,'coins',1,1],[7.6667,'fish',1,1],[7.9333,'type',1,1],
[8.0667,'geometry',1,1],[8.1667,'coins',1,1],[8.4333,'botanical',1,1],[8.5667,'stamps',1,1],[8.6667,'coins',1,1],[8.80,'type',1,1],[8.9333,'bloom',1,1],[9.1667,'stamps',1,1],[9.30,'floral',1,1],[9.4333,'map',1,1],[9.5667,'score',1,1],[9.6667,'type',1,1],[9.9333,'geometry',1,1],
[10.0667,'blueprint',1,1],[10.1667,'geometry',1,1],[10.4333,'scraps',1,1],[10.5667,'coins',1,1],[10.6667,'clover',1,1],[10.80,'cells',1,1],[10.9333,'network',1,1],[11.0667,'mushrooms',1,1],[11.1667,'mushrooms',1.07,1.07],[11.30,'circuit',1,1],[11.4333,'circuit',1.08,1.08],[11.5667,'leaves',1,1],[11.6667,'cellsDark',1,1],[11.80,'network',1,1],[11.9333,'cellsDark',1,1],[12.0667,'cellsDark',1.07,1.07],[12.1667,'xray',1,1],[12.30,'network',1,1],[12.4333,'network',1.1,1.1],[12.5667,'leaves',1,1],[12.6667,'cyanotype',1,1],[12.8333,'leaves',1,1],[13.1333,'petri',1,1],
[13.90,'bloom',1,1],[14.7333,'flight',1,1],[16.1667,'coral',1,1],[18.60,'signature',1,1]];
const art={map:0,floral:1,type:2,coins:3,stamps:4,blueprint:5,xray:6,cyanotype:7,geometry:8};
// Nonuniform silhouette: scales, rotations and offsets are authored per material.
const positions=[];for(let i=0;i<7;i++){positions.push([255+(rnd(i)*2-1)*20,190+i*101,110+rnd(i+24)*70]);positions.push([745+(rnd(i+17)*2-1)*15,180+i*103,110+rnd(i+67)*60]);}for(let i=1;i<7;i++)positions.push([255+i*490/7,185+i*610/7,110+rnd(i+99)*75]);
const paper=document.createElement('canvas');paper.width=paper.height=W;const pc=paper.getContext('2d');pc.fillStyle='#f1e8d6';pc.fillRect(0,0,W,W);for(let i=0;i<22000;i++){pc.fillStyle=`rgba(95,73,38,${rnd(i+90)*.045})`;pc.fillRect(rnd(i)*W,rnd(i+1)*W,1+rnd(i+6)*2,1);}for(let i=0;i<120;i++){pc.fillStyle=`rgba(139,111,65,${rnd(i+49)*.02})`;pc.beginPath();pc.ellipse(rnd(i+5)*W,rnd(i+14)*W,5+rnd(i)*60,2+rnd(i+2)*10,rnd(i)*3,0,Math.PI*2);pc.fill();}
function background(color='#f1e8d6',grid=false){ctx.fillStyle=color;ctx.fillRect(0,0,W,W);ctx.save();ctx.globalAlpha=color==='#f1e8d6'?1:.085;ctx.globalCompositeOperation=color==='#f1e8d6'?'source-over':'soft-light';ctx.drawImage(paper,0,0);ctx.restore();if(grid){ctx.strokeStyle=color==='#c76e50'?'#643b2926':'#897c5426';ctx.lineWidth=1;for(let i=0;i<W;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,W);ctx.moveTo(0,i);ctx.lineTo(W,i);ctx.stroke();}}}
function sprite(id,x,y,size,angle=0,flap=1,alpha=1){const sw=specimens.width/4,sh=specimens.height/4;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(flap,1);ctx.globalAlpha=alpha;ctx.drawImage(specimens,(id%4)*sw+3,Math.floor(id/4)*sh+3,sw-6,sh-6,-size/2,-size/2,size,size);ctx.restore();}
function letterPath(){const p=new Path2D();p.moveTo(205,825);p.lineTo(205,175);p.lineTo(350,175);p.lineTo(665,670);p.lineTo(665,175);p.lineTo(795,175);p.lineTo(795,825);p.lineTo(650,825);p.lineTo(335,330);p.lineTo(335,825);p.closePath();return p;}
function plate(id){const x=[0,418,836,1254],y=[0,411,808,1254];const col=id%3,row=Math.floor(id/3);ctx.drawImage(studies,x[col]+2,y[row]+2,x[col+1]-x[col]-4,y[row+1]-y[row]-4,0,0,W,W);}
// Hinged halves preserve the body instead of squeezing the entire butterfly.
function butterfly(id,x,y,size,angle,phase,blur=0){
 const sw=specimens.width/4,sh=specimens.height/4,sx=id*sw+3,sy=3,cw=sw-6,ch=sh-6;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);if(blur>.2)ctx.filter=`blur(${blur}px)`;
 for(const side of [-1,1]){
  const fold=.15+.85*(.5+.5*Math.cos(phase+(side===1?.19:0)));
  ctx.save();ctx.transform(fold,side*Math.sin(phase)*.16,0,1,0,0);
  ctx.drawImage(specimens,sx+(side===1?cw/2:0),sy,cw/2,ch,side===1?0:-size/2,-size/2,size/2,size);ctx.restore();
 }
 // Narrow unscaled center strip: thorax and antennae remain stable through the wingbeat.
 ctx.drawImage(specimens,sx+cw*.475,sy,cw*.05,ch,-size*.025,-size/2,size*.05,size);ctx.restore();
}
function organic(kind,local){
 if(kind==='flight'){flight();return;}
 let pool=kind==='ceramic'?[10,12,9,15]:kind==='fish'?[13,9,13]:kind==='mushrooms'?[8,8,9]:kind==='botanical'||kind==='bloom'?[4,5,6,7]:[0,1,2,3];
 positions.forEach(([x,y,s],i)=>{const id=pool[(i*7+Math.floor(rnd(i+41)*4))%pool.length],angle=(rnd(i+8)-.5)*.6,size=s*(kind==='ceramic'?1.38:1.18);
  if(kind==='butterfly')butterfly(id,x,y,size,angle,t*3.4+i*1.7);else sprite(id,x,y,size,angle);
 });
 if(kind==='bloom'&&t>13.9){for(let i=0;i<9;i++){
  const elapsed=Math.max(0,local-.24-rnd(i)*.2);if(!elapsed)continue;
  const origin=positions[(i*3+3)%positions.length],fall=elapsed*elapsed*125;
  ctx.save();ctx.translate(origin[0]+18+Math.sin(elapsed*3+i)*elapsed*45,origin[1]-30+fall);ctx.rotate(i+elapsed*2.5);
  ctx.scale(.8+.2*Math.cos(elapsed*6),1);ctx.fillStyle=['#bc7e80','#d7a7a0','#b87277'][i%3];ctx.beginPath();ctx.moveTo(0,-12);ctx.bezierCurveTo(12,-10,11,7,0,13);ctx.bezierCurveTo(-8,4,-9,-5,0,-12);ctx.fill();ctx.restore();
 }}
}
const cubic=(a,b,c,d,u)=>{const v=1-u;return v*v*v*a+3*v*v*u*b+3*v*u*u*c+u*u*u*d;};
function flight(){
 const elapsed=t-14.7333;
 const flock=positions.map(([x,y,size],i)=>{
  const delay=.12+rnd(i+42)*.48,age=Math.max(0,elapsed-delay),duration=1.4+rnd(i+90)*1.9,u=clamp(age/duration);
  const heading=rnd(i+117)*Math.PI*2,side=Math.cos(heading),near=i===5||i===12||i===17;
  // Individual curved routes, some across the frame and some receding; no radial explosion.
  const ex=side>0?1250:-250,ey=-220+rnd(i+156)*1360;
  let px=cubic(x,x+side*(40+rnd(i)*100),ex-side*340,ex,u);
  let py=cubic(y,y-70-rnd(i+60)*120,ey+100,ey,u);
  let depth=near?1+Math.pow(u,2.3)*4.5:1-u*.45;
  if(i===5){const approach=smooth(elapsed/1.40),exit=smooth((elapsed-1.42)/.58);px=mix(x,490,approach)-exit*1700;py=mix(y,470,approach)+exit*160;depth=1+Math.pow(approach,3)*8;}
  return {i,x:px,y:py,size:size*depth,depth,angle:(rnd(i+8)-.5)*.6+Math.sin(u*4)*side*.35,age,u,near};
 }).filter(b=>b.u<1).sort((a,b)=>a.depth-b.depth);
 for(const b of flock){const blur=Math.max(0,b.size-260)/200;butterfly(b.i===5?3:b.i%4,b.x,b.y,b.size,b.angle,elapsed*(b.near?12:9)+b.i*1.7,blur);}
}
function procedural(kind){const dark=['circuit','cellsDark','petri','network','leaves'].includes(kind);if(kind==='cells'||kind==='cellsDark'||kind==='petri'){background(kind==='cells'?'#e0d7bc':kind==='petri'?'#1f3527':'#141b2b');if(kind==='petri'){ctx.strokeStyle='#acbb8977';ctx.lineWidth=12;ctx.beginPath();ctx.arc(500,500,450,0,7);ctx.stroke();ctx.fillStyle='#98b55920';ctx.fill();}positions.forEach(([x,y,s],i)=>{let size=s*(.3+rnd(i+20)*.22);if(kind==='cellsDark'){ctx.shadowColor='#c78334';ctx.shadowBlur=18;}ctx.fillStyle=kind==='cellsDark'?'#f3b338':kind==='petri'?'#b7ce80':'#82a643';ctx.beginPath();ctx.arc(x,y,size,0,7);ctx.fill();ctx.shadowBlur=0;for(let j=0;j<4;j++){ctx.fillStyle=kind==='cellsDark'?'#ffdc8166':'#bfd88370';ctx.beginPath();ctx.arc(x+(rnd(i+j+10)-.5)*size,y+(rnd(i+j+34)-.5)*size,size*.16,0,7);ctx.fill();}});return;}
if(kind==='network'||kind==='circuit'){background(kind==='network'?'#396a6c':'#d7d8cc');ctx.strokeStyle=kind==='network'?'#b7cbb580':'#4c514b';ctx.lineWidth=kind==='network'?1:4;ctx.stroke(letterPath());ctx.save();ctx.clip(letterPath());for(let i=0;i<190;i++){let x=rnd(i+2)*1000,y=rnd(i+17)*1000;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+45,y+(kind==='circuit'?0:25));ctx.lineTo(x+45,y+70);ctx.stroke();ctx.fillStyle=kind==='network'?'#d7a942':'#313932';ctx.beginPath();ctx.arc(x,y,kind==='network'?2+rnd(i)*5:5,0,7);ctx.fill();}ctx.restore();return;}
background(kind==='scraps'?'#393934':kind==='clover'?'#e4d878':kind==='leaves'?'#252a21':'#eee4cf');
if(kind==='score'){ctx.save();ctx.clip(letterPath());ctx.fillStyle='#504733';ctx.strokeStyle='#504733';ctx.lineWidth=1.5;for(let y=150;y<880;y+=62){for(let j=0;j<5;j++){ctx.beginPath();ctx.moveTo(120,y+j*7);ctx.lineTo(870,y+j*7);ctx.stroke();}for(let x=130;x<880;x+=23){ctx.beginPath();ctx.ellipse(x,y+7+Math.floor(rnd(x+y)*4)*7,4,3,-.3,0,7);ctx.fill();ctx.fillRect(x+3,y-9,1,26);}}ctx.restore();return;}
positions.forEach(([x,y,s],i)=>{ctx.save();ctx.translate(x,y);ctx.rotate((rnd(i+33)-.5)*.8);if(kind==='scraps'){ctx.fillStyle=['#e7c877','#ecd48b','#d8b86d'][i%3];ctx.fillRect(-s*.3,-s*.3,s*.6,s*.6);}else if(kind==='eggs'){ctx.fillStyle=['#d7cbb0','#b9b7a0','#ccc2a9'][i%3];ctx.beginPath();ctx.ellipse(0,0,s*.32,s*.44,0,0,7);ctx.fill();for(let j=0;j<35;j++){const ex=(rnd(i*40+j)-.5)*s*.52,ey=(rnd(i*40+j+190)-.5)*s*.66;ctx.fillStyle='#534e3c';ctx.beginPath();ctx.arc(ex,ey,1+rnd(j)*2.5,0,7);ctx.fill();}}else{ctx.fillStyle=kind==='leaves'?'#78914a':'#537742';for(let j=0;j<4;j++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.ellipse(s*.15,0,s*.22,s*.13,0,0,7);ctx.fill();}}ctx.restore();});}
function loopWing(){
 const u=clamp((t-20.16)/.295);if(!u)return;
 butterfly(1,mix(1300,630,u),mix(350,480,u),mix(1000,1800,u),-.12,u*2.7+5,2+u*5);
}
function draw(){let index=cuts.length-1;for(let i=0;i<cuts.length-1;i++)if(t<cuts[i+1][0]){index=i;break;}const [start,kind,z0,z1]=cuts[index],end=cuts[index+1]?.[0]??DURATION,p=(t-start)/(end-start),local=t-start;
background();ctx.save();const zoom=mix(z0,z1,index===0?1-Math.pow(1-p,2):p);ctx.translate(500,500);ctx.scale(zoom,zoom);
// Source plates hold their angle. Only a subtle, shot-specific drift continues across a cut.
if(t<5.60){const cameras=[[.04,0,18,0,-10],[-.065,35,20,12,-5],[.025,-28,12,7,-8],[0,12,-20,-5,8],[-.015,0,0,0,0],[-.05,15,0,0,0],[.01,0,10,0,0]];const [angle,x,y,dx,dy]=cameras[Math.min(index,6)];ctx.rotate(angle);ctx.translate(x+p*dx,y+p*dy);}
ctx.translate(-500,-500);
if(art[kind]!==undefined)plate(art[kind]);else if(['butterfly','ceramic','botanical','fish','mushrooms','bloom','flight'].includes(kind))organic(kind,local);else if(kind==='coral'||kind==='signature'){background(kind==='coral'?'#c76e50':'#f1e8d6',true);ctx.fillStyle=kind==='coral'?'#fff7e7':'#24251f';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='400 540px Georgia';ctx.fillText('N',500,525);}else procedural(kind);ctx.restore();
if(t>=16.1667&&t<18.1)flight();if(t>20.16)loopWing();
const size=Math.min(1600,Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio,2)));if(canvas.width!==size){canvas.width=canvas.height=size;}gl.viewport(0,0,size,size);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,layer);gl.uniform1i(un.image,0);gl.uniform1f(un.time,t);gl.uniform2f(un.resolution,size,size);gl.drawArrays(gl.TRIANGLES,0,6);
$('#seek').value=t;$('#time').textContent=t.toFixed(2).padStart(5,'0');$('#chapter').textContent=t<5.60?'01 — OBSERVE':t<13.9?'02 — TRANSFORM':t<16.1667?'03 — RELEASE':'04 — N';}
function setPlaying(v){playing=v;$('#play').textContent=v?'Ⅱ':'▷';$('#play').setAttribute('aria-label',v?'Pause':'Play');}
$('#play').onclick=()=>setPlaying(!playing);$('#replay').onclick=()=>{t=0;setPlaying(true);};$('#seek').oninput=e=>{t=Math.min(DURATION-.001,Number(e.target.value));};$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#film').requestFullscreen();}catch(e){console.warn('Fullscreen unavailable',e);}};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['BUTTON','INPUT'].includes(e.target.tagName)){e.preventDefault();setPlaying(!playing);}if(e.code==='ArrowRight'&&e.target.tagName!=='INPUT'){t=Math.min(DURATION-.001,t+.25);}if(e.code==='ArrowLeft'&&e.target.tagName!=='INPUT'){t=Math.max(0,t-.25);}});
document.addEventListener('visibilitychange',()=>{last=0;});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);fail('Graphics context interrupted. Reload to resume.');});
function tick(now){if(last&&ready&&playing&&!document.hidden)t=(t+Math.min((now-last)/1000,.1))%DURATION;last=now;if(ready)draw();raf=requestAnimationFrame(tick);}setPlaying(playing);requestAnimationFrame(tick);
})();
