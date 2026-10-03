export const FPS=24;
export const clamp=v=>Math.max(0,Math.min(1,v));
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*t;
// Bounds and body axes measured from the original frame 353, not the previous generated atlas.
export const specimens=[
 {center:[370,117],dimensions:[224,136],angle:0},
 {center:[490,120],dimensions:[180,160],angle:-.62},
 {center:[421,174],dimensions:[68,62],angle:-.18},
 {center:[423,311],dimensions:[49,58],angle:0},
 {center:[495,365],dimensions:[139,123],angle:-.68},
 {center:[477,475],dimensions:[166,133],angle:0},
 {center:[271,326],dimensions:[170,160],angle:.52},
 {center:[290,224],dimensions:[98,100],angle:-.37},
 {center:[196,547],dimensions:[62,44],angle:0},
 {center:[295,622],dimensions:[60,44],angle:0},
 {center:[356,302],dimensions:[51,44],angle:.3},
 {center:[386,632],dimensions:[73,39],angle:0},
 {center:[262,188],dimensions:[67,66],angle:.35},
 {center:[339,552],dimensions:[89,115],angle:.62}
];
// Unequal spacing, original specimen variety and count. The N's diagonal is the only structural change.
export const flock=[
 [0,205,108,.70,-.10],[1,516,132,.82,-.62],[2,546,258,.65,.10],
 [7,174,230,.62,-.30],[12,181,168,.52,.22],[10,222,188,.64,.10],
 [6,189,344,.80,-.44],[3,183,448,.82,-.12],[8,178,537,.80,.12],
 [9,207,608,.84,-.08],[2,272,189,.65,.12],[7,308,251,.56,-.22],
 [3,343,303,.73,.04],[12,369,361,.66,.34],[11,412,400,.81,-.20],
 [4,461,454,.75,-.68],[5,529,512,.84,.04],[0,525,340,.47,.08],
 [8,550,414,.65,.10],[13,492,589,.77,.55],[9,568,610,.73,-.1],
 [10,157,590,.58,-.20],[11,554,193,.54,.22],[12,270,596,.51,.14]
];
const curve=(a,b,c,d,u)=>{const v=1-u;return v*v*v*a+3*v*v*u*b+3*v*u*u*c+u*u*u*d;};
const random=i=>{const v=Math.sin(i*12.989+78.23)*43758.5453;return v-Math.floor(v);};
// Measured screen landmarks for the leading red butterfly, remapped from its N start position.
const heroKeys=[
 [0,516,132,0,-.62],[.24,505,160,20,-.58],[.58,378,279,70,-.50],
 [.88,345,346,150,-.48],[1.08,355,378,450,-.52],[1.25,405,400,755,-.62],
 [1.38,405,392,775,-.65],[1.48,110,305,775,-.5],[1.68,-1100,200,775,-.7]
];
function hero(time){let i=0;while(i<heroKeys.length-2&&time>heroKeys[i+1][0])i++;const a=heroKeys[i],b=heroKeys[i+1],u=smooth((time-a[0])/(b[0]-a[0]));return a.slice(1).map((v,k)=>mix(v,b[k+1],u));}
export function flightAt(seconds){
 const time=seconds-353/FPS;
 return flock.map(([species,x,y,scale,roll],i)=>{
  const delay=i===0?.07:i===1?.13:.14+random(i)*.37;
  const age=Math.max(0,time-delay),u=clamp(age/(1.55+random(i+4)*1.65));
  const direction=random(i+7)>.43?1:-1;
  let endX=direction>0?880:-160,endY=100+random(i+11)*550;
  let px=curve(x,x+direction*25,x+direction*210,endX,u);
  let py=curve(y,y-55,180+random(i+24)*330,endY,u);
  let z=(i===0||i===6||i===16)?u*u*700:-u*160;
  let r=roll+Math.sin(u*2.1)*direction*.18;
  if(i===1){[px,py,z,r]=hero(time);}
  const flap=age===0?.07: .1+(1-Math.cos(age*(i===1?15:12)+i*.15))*.60;
  return {species,x:px,y:py,z,scale,roll:r,pitch:age?Math.sin(age*3+i)*.12:0,flap,blur:Math.max(0,z-400)/135,alpha:1,alive:i===1?time<1.68:u<1};
 }).filter(b=>b.alive).sort((a,b)=>a.z-b.z);
}
