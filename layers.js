// Petals are sampled from their own painted flowers, not synthetic ellipse particles.
export function preparePetals(image){
 const w=image.naturalWidth,h=image.naturalHeight;
 const original=document.createElement('canvas');original.width=w;original.height=h;
 const oc=original.getContext('2d',{willReadFrequently:true});oc.drawImage(image,0,0);
 // Outer petals selected from the generated N frame; coordinates are fractions of that frame.
 const polygons=[
 [[238,128],[195,124],[175,111],[175,91],[191,77],[210,79],[226,104]],
 [[240,128],[226,168],[215,193],[196,187],[177,167],[185,145]],
 [[333,139],[310,111],[311,84],[328,70],[350,74],[359,99]],
 [[712,135],[681,119],[654,113],[649,94],[668,78],[690,81],[705,105]],
 [[720,132],[713,98],[721,66],[746,56],[774,68],[774,92],[753,116]],
 [[707,198],[674,223],[648,241],[638,230],[644,209],[671,197]],
 [[251,638],[216,625],[192,606],[191,589],[211,577],[227,580],[240,605]],
 [[252,644],[220,667],[194,673],[176,663],[163,643],[176,624],[211,624]],
 [[766,786],[733,771],[702,756],[694,742],[707,725],[732,721],[752,744]],
 [[773,790],[811,782],[842,773],[851,783],[842,807],[820,815],[794,807]]
 ];
 const boxes=polygons.map((points,i)=>{const xs=points.map(p=>p[0]/1024),ys=points.map(p=>p[1]/1024);return [Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),i%2?1:-1,.05+i*.012];});
 const pixels=oc.getImageData(0,0,w,h);
 const petals=boxes.map(([nx,ny,nw,nh,vx,vy],i)=>{
  const x=Math.round(nx*w),y=Math.round(ny*h),pw=Math.round(nw*w),ph=Math.round(nh*h);
  const canvas=document.createElement('canvas');canvas.width=pw;canvas.height=ph;const c=canvas.getContext('2d');
  const patch=c.createImageData(pw,ph);
  for(let py=0;py<ph;py++)for(let px=0;px<pw;px++){
   const src=((y+py)*w+x+px)*4,dst=(py*pw+px)*4;
   const r=pixels.data[src],g=pixels.data[src+1],b=pixels.data[src+2];
   // Pigment color and feathered perimeter distinguish petals from paper and green stems.
   const pigment=Math.min(1,Math.max(0,(r-g-3)/10))*Math.min(1,Math.max(0,(b-g+25)/18));
   const edge=Math.min(1,Math.min(px,py,pw-1-px,ph-1-py)/4),alpha=pigment*edge;
   patch.data[dst]=r;patch.data[dst+1]=g;patch.data[dst+2]=b;patch.data[dst+3]=Math.round(alpha*255);
  }
  c.putImageData(patch,0,0);
  c.globalCompositeOperation='destination-in';c.beginPath();polygons[i].forEach(([a,b],j)=>j?c.lineTo(a*w/1024-x,b*h/1024-y):c.moveTo(a*w/1024-x,b*h/1024-y));c.closePath();c.fill();c.globalCompositeOperation='source-over';
  const mask=document.createElement('canvas');mask.width=pw;mask.height=ph;const m=mask.getContext('2d');m.drawImage(canvas,0,0);m.globalCompositeOperation='source-in';m.drawImage(original,Math.round(w*.46),Math.round(h*.09),pw,ph,0,0,pw,ph);
  return {canvas,mask,x,y,w:pw,h:ph,vx,vy,delay:.04+i*.026};
 });
 return {original,petals,width:w,height:h};
}
export function drawFlowerFrame(out,data,elapsed){
 const c=out.getContext('2d'),{width:w,height:h}=data;
 if(out.width!==w){out.width=w;out.height=h;}
 c.clearRect(0,0,w,h);c.drawImage(data.original,0,0);
 for(const petal of data.petals){
  const t=Math.max(0,elapsed-petal.delay);if(!t)continue;
  c.drawImage(petal.mask,petal.x,petal.y);
  const dx=petal.vx*(95*t+125*t*t),dy=petal.vy*110*t+90*t*t;
  c.save();c.translate(petal.x+petal.w/2+dx,petal.y+petal.h/2+dy);
  c.rotate(petal.vx*t*.8);c.scale(.88+.12*Math.cos(t*5),1);
  c.drawImage(petal.canvas,-petal.w/2,-petal.h/2);c.restore();
 }
}
export function makePaper(reference,color){
 const c=document.createElement('canvas');c.width=c.height=720;const x=c.getContext('2d');
 // Left margin of the supplied butterfly frame is unprinted original paper.
 const sample=document.createElement('canvas');sample.width=110;sample.height=660;
 const sc=sample.getContext('2d',{willReadFrequently:true});sc.drawImage(reference,20,20,110,660,0,0,110,660);
 const src=sc.getImageData(0,0,110,660).data,dst=x.createImageData(720,720);
 let seed=418;for(let i=0;i<720*720;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=(seed%(110*660))*4;for(let k=0;k<3;k++)dst.data[i*4+k]=src[j+k];dst.data[i*4+3]=255;}x.putImageData(dst,0,0);
 if(color){x.globalCompositeOperation='multiply';x.fillStyle=color;x.fillRect(0,0,720,720);x.globalCompositeOperation='source-over';}
 return c;
}
export function makeTitle(paper,dark=false,offset=0,opacity=1){
 const c=document.createElement('canvas');c.width=c.height=720;const x=c.getContext('2d');x.drawImage(paper,0,0);
 // Replace only the source lettering band using a matching paper band (four grid cells away).
 x.drawImage(paper,0,470,720,142,0,266,720,142);
 x.globalAlpha=opacity;x.fillStyle=dark?'#fffdf2':'#171713';x.font='148px Georgia';x.textAlign='center';x.textBaseline='alphabetic';x.fillText('N',360,389+offset);
 return c;
}

// Source-space masks remove neighbouring specimens before wing articulation.
export function isolateSpecimens(source){
 const contours=[
 [[260,55],[368,62],[478,57],[455,100],[424,129],[390,132],[376,180],[356,170],[348,133],[312,131],[278,100]],
 [[480,52],[527,76],[531,94],[554,99],[559,151],[528,153],[534,185],[491,191],[463,173],[431,166],[422,147],[435,129],[478,120],[474,88]],
 [[411,135],[429,148],[429,165],[463,178],[447,205],[416,206],[405,185],[390,187],[391,159]],
 [[400,280],[423,298],[445,281],[447,315],[435,343],[411,344],[401,324]],
 [[477,292],[501,291],[507,343],[535,363],[567,373],[568,400],[529,408],[511,432],[493,438],[473,420],[469,395],[454,380],[428,362],[427,342],[456,334]],
 [[396,405],[427,407],[468,442],[488,445],[532,409],[559,405],[555,444],[534,479],[539,509],[523,539],[488,541],[477,510],[462,539],[426,539],[409,514],[411,482],[400,447]],
 [[204,251],[220,254],[244,281],[260,316],[300,315],[343,320],[350,337],[316,354],[291,366],[270,393],[247,402],[227,380],[200,385]],
 [[302,163],[319,171],[328,199],[339,219],[335,238],[321,241],[326,254],[310,264],[288,263],[260,252],[234,239],[231,225],[277,216],[292,213],[292,181]],
 [[163,522],[187,527],[197,536],[216,521],[225,535],[221,562],[201,570],[173,569],[163,552]],
 [[267,598],[294,610],[308,603],[330,601],[326,627],[313,646],[291,648],[276,638]],
 [[358,270],[373,273],[374,292],[365,301],[373,315],[365,324],[351,315],[327,317],[324,305],[352,296]],
 [[350,613],[383,624],[393,622],[420,612],[426,627],[410,644],[383,652],[362,641]],
 [[258,148],[276,152],[281,166],[296,168],[295,186],[280,194],[274,214],[255,217],[249,204],[229,201],[228,188],[257,180]],
 [[365,527],[382,522],[384,560],[385,604],[367,608],[353,620],[334,608],[321,601],[292,585],[292,574],[331,565],[349,562]]
 ];
 return contours.map(points=>{const c=document.createElement('canvas');c.width=c.height=720;const x=c.getContext('2d');x.fillStyle='rgb(232,219,195)';x.fillRect(0,0,720,720);x.beginPath();points.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.clip();x.drawImage(source,0,0);return c;});
}
