/* ÉCHO-LUNE · scène d'accueil : Terre et Lune en relief (rendu sphérique pixel par pixel),
   station émettrice posée sur la Terre, impulsion laser qui fait l'aller-retour. */
(()=>{
const cv=document.getElementById('sceneCv'); if(!cv) return;
const ctx=cv.getContext('2d');

/* ---------- bruit 3D (value noise) pour fabriquer des textures ---------- */
const P=new Uint8Array(512);{const p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=(Math.random()*(i+1))|0;[p[i],p[j]]=[p[j],p[i]]}for(let i=0;i<512;i++)P[i]=p[i&255]}
const fade=t=>t*t*(3-2*t);
const h=(x,y,z)=>P[P[P[x&255]+(y&255)]+(z&255)]/255;
function noise(x,y,z){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),u=fade(x-X),v=fade(y-Y),w=fade(z-Z);
  const L=(a,b,t)=>a+(b-a)*t;
  return L(L(L(h(X,Y,Z),h(X+1,Y,Z),u),L(h(X,Y+1,Z),h(X+1,Y+1,Z),u),v),
           L(L(h(X,Y,Z+1),h(X+1,Y,Z+1),u),L(h(X,Y+1,Z+1),h(X+1,Y+1,Z+1),u),v),w)}
function fbm(x,y,z,o){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*noise(x*f,y*f,z*f);a*=.5;f*=2}return s}

/* texture équirectangulaire : [r,g,b] par pixel */
function makeTex(W,H,fn){const t=new Float32Array(W*H*3);
  for(let j=0;j<H;j++){const lat=(j/H-.5)*Math.PI;for(let i=0;i<W;i++){const lon=i/W*2*Math.PI;
    const x=Math.cos(lat)*Math.cos(lon),y=Math.sin(lat),z=Math.cos(lat)*Math.sin(lon);
    const c=fn(x,y,z,lat);const k=(j*W+i)*3;t[k]=c[0];t[k+1]=c[1];t[k+2]=c[2]}}
  return {W,H,t}}

const EARTH=makeTex(1024,512,(x,y,z,lat)=>{
  const n=fbm(x*1.5+10,y*1.5,z*1.5,6), dry=fbm(x*2.5+70,y*2.5,z*2.5,3), cl=fbm(x*2.6+40,y*4.5,z*2.6,5);
  const pol=Math.abs(lat), iceT=Math.max(0,Math.min(1,(pol-1.12)/.18));
  let c;
  if(n>.56){const m=Math.min(1,(n-.56)*5), d=Math.max(0,Math.min(1,(dry-.5)*4))*(1-pol/1.4);   // forêts → savanes → déserts
    c=[50+40*m+130*d, 105+25*m+60*d, 45+10*m+55*d]}
  else {const k=Math.min(1,(.56-n)*6);c=[18+30*(1-k),60+70*(1-k),140+50*(1-k)]}                  // océan, clair près des côtes
  c=c.map(v=>v*(1-iceT)+240*iceT);
  if(cl>.55){const a=Math.min(.9,(cl-.55)*4);c=c.map(v=>v*(1-a)+248*a)}                          // nuages
  return c});
const MOON=makeTex(256,128,(x,y,z)=>{
  let v=150+70*fbm(x*2,y*2,z*2,5);
  const mare=fbm(x*1.2+5,y*1.2,z*1.2,3); if(mare>.55) v-=55*Math.min(1,(mare-.55)*5); // mers sombres
  const cr=fbm(x*9,y*9,z*9,2); if(cr>.68) v-=40; else if(cr>.64) v+=25;               // cratères
  return [v,v,v*1.04]});

/* rendu d'une sphère texturée dans un ImageData */
function sphere(tex,R,rot,light,amb){
  const D=R*2,img=new ImageData(D,D),d=img.data,{W,H,t}=tex;
  for(let py=0;py<D;py++){const ny=(py+.5-R)/R;for(let px=0;px<D;px++){const nx=(px+.5-R)/R,q=nx*nx+ny*ny;if(q>1)continue;
    const nz=Math.sqrt(1-q);
    const lat=Math.asin(-ny),lon=Math.atan2(nz,nx)+rot;
    let u=((lon/(2*Math.PI))%1+1)%1,v=lat/Math.PI+.5;
    const k=((Math.min(H-1,(v*H)|0))*W+((u*W)|0))*3;
    let l=nx*light[0]+(-ny)*light[1]+nz*light[2];l=Math.max(0,l);
    const s=amb+(1-amb)*Math.pow(l,.85), edge=1-Math.pow(1-nz,3)*.35;
    const o=(py*D+px)*4;d[o]=t[k]*s*edge;d[o+1]=t[k+1]*s*edge;d[o+2]=t[k+2]*s*edge;
    d[o+3]=q>.985?255*(1-(q-.985)/.015):255}}
  const c=document.createElement('canvas');c.width=c.height=D;c.getContext('2d').putImageData(img,0,0);return c}

/* ---------- mise en page ---------- */
let w,hh,dpr,E,M,ER,MR,moonImg,stars=[];
const LIGHT=(()=>{const v=[.55,.35,.76],n=Math.hypot(...v);return v.map(a=>a/n)})();
function layout(){dpr=Math.min(2,devicePixelRatio||1);const r=cv.getBoundingClientRect();w=r.width;hh=r.height;
  cv.width=w*dpr;cv.height=hh*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  ER=Math.min(hh*.36,w*.16);MR=ER*.32;
  E={x:ER*1.25+10,y:hh*.56};M={x:w-MR*2.6,y:hh*.34};
  moonImg=sphere(MOON,Math.round(MR*dpr),0,LIGHT,.07);
  stars=Array.from({length:Math.round(w*hh/2500)},()=>({x:Math.random()*w,y:Math.random()*hh,r:Math.random()*1.1+.2,p:Math.random()*6}))}
addEventListener('resize',layout);

/* station : posée sur le bord de la Terre, tournée vers la Lune */
function stationPos(){const a=Math.atan2(M.y-E.y,M.x-E.x)-.35;return {a,x:E.x+Math.cos(a)*ER,y:E.y+Math.sin(a)*ER}}
function drawStation(S,t,firing){ctx.save();ctx.translate(S.x,S.y);ctx.rotate(S.a+Math.PI/2);
  const k=ER/120;ctx.scale(k,k);
  ctx.fillStyle='#c9d2e0';ctx.fillRect(-4,-30,8,30);                 // mât
  ctx.fillStyle='#8a96aa';ctx.fillRect(-14,-6,28,8);                  // socle
  ctx.save();ctx.translate(0,-30);ctx.rotate(.38);                    // parabole orientée vers la Lune
  const g=ctx.createLinearGradient(-26,0,26,0);g.addColorStop(0,'#9aa6ba');g.addColorStop(.5,'#ffffff');g.addColorStop(1,'#aab4c6');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,-10,26,11,0,Math.PI,0,true);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#dfe6f0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,-12);ctx.lineTo(0,-34);ctx.lineTo(14,-12);ctx.stroke();
  ctx.fillStyle=firing?'#ff4d6d':'#3fe0ff';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(0,-34,4,0,7);ctx.fill();
  ctx.restore();ctx.restore()}

/* ---------- animation ---------- */
const TRIP=2600; // ms pour un aller-retour à l'écran
let rot=0,earthImg=null,lastRot=-9,t0=performance.now();
function frame(now){
  ctx.clearRect(0,0,w,hh);
  for(const s of stars){ctx.globalAlpha=.3+.35*Math.sin(now/800+s.p);ctx.fillStyle='#d8e7ff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill()}
  ctx.globalAlpha=1;
  rot+=.0012; if(Math.abs(rot-lastRot)>.004||!earthImg){earthImg=sphere(EARTH,Math.round(ER*dpr),rot,LIGHT,.06);lastRot=rot}

  // halo atmosphérique
  const ha=ctx.createRadialGradient(E.x,E.y,ER*.95,E.x,E.y,ER*1.22);ha.addColorStop(0,'rgba(90,180,255,.45)');ha.addColorStop(1,'rgba(90,180,255,0)');
  ctx.fillStyle=ha;ctx.beginPath();ctx.arc(E.x,E.y,ER*1.22,0,7);ctx.fill();
  ctx.drawImage(earthImg,E.x-ER,E.y-ER,ER*2,ER*2);
  const mh=ctx.createRadialGradient(M.x,M.y,MR*.9,M.x,M.y,MR*1.5);mh.addColorStop(0,'rgba(220,230,255,.18)');mh.addColorStop(1,'rgba(220,230,255,0)');
  ctx.fillStyle=mh;ctx.beginPath();ctx.arc(M.x,M.y,MR*1.5,0,7);ctx.fill();
  ctx.drawImage(moonImg,M.x-MR,M.y-MR,MR*2,MR*2);

  // trajet de l'impulsion
  const S=stationPos(), dish={x:S.x+Math.cos(S.a)*ER*.36,y:S.y+Math.sin(S.a)*ER*.36};
  const R={x:M.x-MR*.55,y:M.y+MR*.25};                                 // réflecteur
  const ph=((now-t0)%(TRIP+900))/TRIP;                                  // 0→1 : aller-retour, puis pause
  ctx.setLineDash([3,7]);ctx.strokeStyle='rgba(63,224,255,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(dish.x,dish.y);ctx.lineTo(R.x,R.y);ctx.stroke();ctx.setLineDash([]);
  let firing=false;
  if(ph<1){const go=ph<.5,p=go?ph*2:2-ph*2,col=go?'#ff4d6d':'#4dff9a';firing=ph<.06;
    const x=dish.x+(R.x-dish.x)*p,y=dish.y+(R.y-dish.y)*p,dx=(R.x-dish.x),dy=(R.y-dish.y),L=Math.hypot(dx,dy),tl=Math.min(90,L*.18)*(go?-1:1);
    const g=ctx.createLinearGradient(x,y,x+dx/L*tl,y+dy/L*tl);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.strokeStyle=g;ctx.lineWidth=4;ctx.lineCap='round';ctx.shadowColor=col;ctx.shadowBlur=18;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx/L*tl,y+dy/L*tl);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,3.2,0,7);ctx.fill();ctx.shadowBlur=0;
    if(Math.abs(ph-.5)<.04){ctx.strokeStyle='rgba(77,255,154,'+(1-Math.abs(ph-.5)/.04)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(R.x,R.y,10+(ph-.46)*300,0,7);ctx.stroke()}}
  ctx.fillStyle='#ffb547';ctx.beginPath();ctx.arc(R.x,R.y,2.5,0,7);ctx.fill();
  drawStation(S,now,firing);

  // étiquettes
  ctx.font='11px "JetBrains Mono",monospace';ctx.fillStyle='#7f95b8';ctx.textAlign='center';
  ctx.fillText('TERRE · STATION ÉMETTRICE',E.x,Math.min(hh-8,E.y+ER+26));
  ctx.fillText('LUNE · RÉFLECTEUR',Math.min(M.x,w-62),M.y+MR+24);
  ctx.textAlign='right';ctx.fillStyle=ph<.5?'#ff4d6d':ph<1?'#4dff9a':'#7f95b8';
  ctx.fillText(ph<.5?'▶ ALLER':ph<1?'◀ RETOUR · ÉCHO':'· EN ATTENTE ·',w-12,hh-10);
  requestAnimationFrame(frame)}
layout();requestAnimationFrame(frame);
})();
