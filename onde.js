/* ÉCHO-LUNE · module « choisir l'onde envoyée »
   Frise du spectre électromagnétique, choix de la longueur d'onde du laser,
   sinusoïde qui s'étire ou se contracte, colorée comme la lumière (gris si invisible). */
(()=>{
const $=id=>document.getElementById(id);
const LMIN=100, LMAX=1500;            // nm : zone sélectionnable (UV → visible → IR)
const VIS0=380, VIS1=750;             // nm : limites du visible

/* couleur d'une longueur d'onde visible (approximation classique) */
function rgbOf(l){
  let r=0,g=0,b=0;
  if(l>=380&&l<440){r=-(l-440)/60;b=1}
  else if(l<490){g=(l-440)/50;b=1}
  else if(l<510){g=1;b=-(l-510)/20}
  else if(l<580){r=(l-510)/70;g=1}
  else if(l<645){r=1;g=-(l-645)/65}
  else if(l<=750){r=1}
  let f=1; if(l<420) f=.35+.65*(l-380)/40; else if(l>700) f=.35+.65*(750-l)/50;
  const c=v=>Math.round(255*Math.pow(Math.max(0,v)*f,.8));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}
const GREY='#8d97aa';
function info(l){
  if(l<VIS0) return {dom:'Ultraviolet',nom:'invisible pour l\'œil',col:GREY,vis:false};
  if(l>VIS1) return {dom:'Infrarouge',nom:'invisible pour l\'œil',col:GREY,vis:false};
  const nom=l<450?'violet':l<495?'bleu':l<570?'vert':l<590?'jaune':l<620?'orange':'rouge';
  return {dom:'Lumière visible',nom,col:rgbOf(l),vis:true};
}
const nf=n=>n.toLocaleString('fr-FR');

let lam=532, shown=532, phase=0;
const spec=$('specCv'), sin=$('sinCv'), full=$('fullCv');
function fit(cv){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);return {c,w:r.width,h:r.height}}
let S,N,F;
function resize(){S=fit(spec);N=fit(sin);F=fit(full);drawFull();drawSpec()}

/* --- vue d'ensemble : tout le spectre électromagnétique (échelle logarithmique) --- */
const BANDS=[ // [nom, λ min (m), λ max (m)]
  ['Rayons γ',1e-14,1e-11],['Rayons X',1e-11,1e-8],['UV',1e-8,3.8e-7],['Visible',3.8e-7,7.5e-7],
  ['Infrarouge',7.5e-7,1e-3],['Micro-ondes',1e-3,1e-1],['Radio',1e-1,1e3]];
const LG0=-14, LG1=3;
const xFull=(m,w)=>(Math.log10(m)-LG0)/(LG1-LG0)*w;
function drawFull(){const {c,w,h}=F;c.clearRect(0,0,w,h);const y=18,bh=26;
  BANDS.forEach(([n,a,b],i)=>{const x0=xFull(a,w),x1=xFull(b,w);
    if(n==='Visible'){const g=c.createLinearGradient(x0,0,x1,0);[380,440,490,530,580,620,700].forEach(l=>g.addColorStop((l-380)/370,rgbOf(l)));c.fillStyle=g}
    else c.fillStyle=i%2?'#1b2a45':'#22355a';
    c.fillRect(x0,y,x1-x0,bh);
    c.fillStyle=n==='Visible'?'#fff':'#9fb3d4';c.font='11px "JetBrains Mono",monospace';c.textAlign='center';
    if(n!=='Visible') c.fillText(n,(x0+x1)/2,y+bh+14);});
  // zone zoomée en dessous
  const z0=xFull(LMIN*1e-9,w),z1=xFull(LMAX*1e-9,w);
  c.strokeStyle='#3fe0ff';c.lineWidth=1.5;c.strokeRect(z0-1,y-4,z1-z0+2,bh+8);
  c.fillStyle='#3fe0ff';c.textAlign='center';c.fillText('zoom ↓',(z0+z1)/2,y-7);
  c.fillStyle='#ffffff';c.font='600 11px "JetBrains Mono",monospace';c.fillText('Visible',xFull(5.6e-7,w),y+bh+14);
  c.fillStyle='#7f95b8';c.font='10px "JetBrains Mono",monospace';c.textAlign='left';c.fillText('petites longueurs d\'onde',0,h-2);c.textAlign='right';c.fillText('grandes longueurs d\'onde',w,h-2);
}

/* --- frise zoomée : 100 nm → 1 500 nm, cliquable --- */
const PAD=14;
const xOf=(l,w)=>PAD+(l-LMIN)/(LMAX-LMIN)*(w-2*PAD);
const lOf=(x,w)=>Math.round(Math.max(LMIN,Math.min(LMAX,LMIN+(x-PAD)/(w-2*PAD)*(LMAX-LMIN))));
function drawSpec(){const {c,w,h}=S;c.clearRect(0,0,w,h);const y=22,bh=34;
  // UV et IR : gris hachuré
  [[LMIN,VIS0],[VIS1,LMAX]].forEach(([a,b])=>{const x0=xOf(a,w),x1=xOf(b,w);c.fillStyle='#2a3242';c.fillRect(x0,y,x1-x0,bh);
    c.save();c.beginPath();c.rect(x0,y,x1-x0,bh);c.clip();c.strokeStyle='rgba(141,151,170,.35)';c.lineWidth=1;
    for(let x=x0-bh;x<x1;x+=8){c.beginPath();c.moveTo(x,y+bh);c.lineTo(x+bh,y);c.stroke()}c.restore()});
  for(let l=VIS0;l<VIS1;l++){c.fillStyle=rgbOf(l);c.fillRect(xOf(l,w),y,xOf(l+1,w)-xOf(l,w)+1,bh)}
  c.font='600 12px "JetBrains Mono",monospace';c.textAlign='center';
  c.fillStyle='#b9c4d8';c.fillText('ULTRAVIOLET',(xOf(LMIN,w)+xOf(VIS0,w))/2,y-7);c.fillText('INFRAROUGE',(xOf(VIS1,w)+xOf(LMAX,w))/2,y-7);
  c.fillStyle='#fff';c.fillText('VISIBLE',(xOf(VIS0,w)+xOf(VIS1,w))/2,y-7);
  // graduations
  c.font='10.5px "JetBrains Mono",monospace';c.fillStyle='#7f95b8';c.strokeStyle='#7f95b8';
  for(let l=100;l<=1500;l+=100){const x=xOf(l,w);c.beginPath();c.moveTo(x,y+bh);c.lineTo(x,y+bh+5);c.stroke();if(l%200===100||l===1500)c.fillText(l,x,y+bh+17)}
  c.textAlign='right';c.fillText('λ (nm)',w-2,y+bh+30);
  // curseur
  const x=xOf(lam,w),I=info(lam);
  c.fillStyle='#fff';c.beginPath();c.moveTo(x,y+bh+1);c.lineTo(x-7,y+bh+11);c.lineTo(x+7,y+bh+11);c.closePath();c.fill();
  c.strokeStyle='#fff';c.lineWidth=2.5;c.strokeRect(x-2,y-3,4,bh+6);
}
let drag=false;
function pick(ev){const r=spec.getBoundingClientRect();set(lOf(ev.clientX-r.left,r.width))}
spec.addEventListener('pointerdown',ev=>{drag=true;spec.setPointerCapture(ev.pointerId);pick(ev)});
spec.addEventListener('pointermove',ev=>{if(drag)pick(ev)});
spec.addEventListener('pointerup',()=>drag=false);
document.querySelectorAll('[data-lam]').forEach(b=>b.addEventListener('click',()=>set(+b.dataset.lam)));
$('lamRange').addEventListener('input',e=>set(+e.target.value));
$('lamRange').min=LMIN;$('lamRange').max=LMAX;

function set(l){lam=l;$('lamRange').value=l;const I=info(l);
  $('lamVal').textContent=nf(l)+' nm';$('lamVal').style.color=I.vis?I.col:GREY;
  $('lamDom').textContent=I.dom+' · '+I.nom;
  document.querySelectorAll('[data-lam]').forEach(b=>b.classList.toggle('on',+b.dataset.lam===l));
  drawSpec();document.dispatchEvent(new CustomEvent('onde',{detail:get()}))}
function get(){const I=info(lam);return {lam,col:I.col,vis:I.vis,dom:I.dom,nom:I.nom}}

/* --- sinusoïde : la période à l'écran est proportionnelle à λ --- */
function drawSin(){const {c,w,h}=N;c.clearRect(0,0,w,h);
  shown+=(lam-shown)*.12;                           // s'étire / se contracte en douceur
  const col=info(lam).vis?info(Math.round(shown)).col:GREY;
  const k=(w-40)/(LMAX*2.2);                        // px par nm : ≥ 2 périodes à 1 500 nm
  const P=shown*k, A=h*.26, cy=h*.46, x0=20, x1=w-20;
  // axe
  c.strokeStyle='rgba(127,149,184,.35)';c.lineWidth=1;c.beginPath();c.moveTo(x0,cy);c.lineTo(x1,cy);c.stroke();
  // onde
  c.save();c.shadowColor=col;c.shadowBlur=info(lam).vis?12:0;c.strokeStyle=col;c.lineWidth=3;c.beginPath();
  for(let x=x0;x<=x1;x+=1){const y=cy-A*Math.sin(2*Math.PI*(x-x0)/P-phase);x===x0?c.moveTo(x,y):c.lineTo(x,y)}
  c.stroke();c.restore();
  // repère λ entre deux crêtes
  const q=((phase/(2*Math.PI))%1+1)%1;                 // position de la 1re crête
  let xc=x0+(q+.25)*P; while(xc<x0+P*.2) xc+=P;
  if(xc+P<x1){const yt=cy-A-14;
    c.strokeStyle='#fff';c.fillStyle='#fff';c.lineWidth=1.5;c.setLineDash([3,4]);
    [xc,xc+P].forEach(x=>{c.beginPath();c.moveTo(x,cy-A);c.lineTo(x,yt-6);c.stroke()});c.setLineDash([]);
    c.beginPath();c.moveTo(xc,yt);c.lineTo(xc+P,yt);c.stroke();
    [[xc,1],[xc+P,-1]].forEach(([x,s])=>{c.beginPath();c.moveTo(x,yt);c.lineTo(x+7*s,yt-4);c.lineTo(x+7*s,yt+4);c.closePath();c.fill()});
    c.font='600 13px "JetBrains Mono",monospace';c.textAlign='center';c.fillText('λ = '+nf(lam)+' nm',xc+P/2,yt-9);}
  // légende
  c.textAlign='left';c.font='12px "JetBrains Mono",monospace';c.fillStyle='#7f95b8';
  c.fillText('λ : longueur d\'onde = distance entre deux crêtes · schéma, pas à l\'échelle',x0,h-8);
  phase+=.06; requestAnimationFrame(drawSin);
}

addEventListener('resize',resize);resize();set(532);requestAnimationFrame(drawSin);
window.ONDE={get};
})();
