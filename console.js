
const C=299792.458;                 // km/s (non affiché)
const BASE={A15:384402,A11:384398,A14:384405,L1:384396,L2:384400}; // km (non affiché)
const SPAN=3.2;                     // s affichées à l'oscilloscope
const $=id=>document.getElementById(id);
const scope=$('scopeCv'),traj=$('trajCv'),sx=scope.getContext('2d'),tx=traj.getContext('2d');
let shot=null,shots=[],actx=null;

function fit(cv){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;cv.getContext('2d').setTransform(d,0,0,d,0,0);return r}
let SW,SH,TW,TH;
function resize(){const a=fit(scope);SW=a.width;SH=a.height;const b=fit(traj);TW=b.width;TH=b.height;drawScope(shot?elapsed():0);drawTraj(shot?elapsed():0)}
addEventListener('resize',resize);

function beep(f,dur,vol){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(vol,actx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+dur);o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+dur)}catch(e){}}

function elapsed(){return (performance.now()-shot.t0)/1000}
const fmt=t=>t.toFixed(4).replace('.',',')+' s';

/* trace de l'oscilloscope : bruit + pic d'émission + écho */
function signal(t,tr){let v=(Math.random()-.5)*.06;
  const e=t/0.012; if(t>=0&&t<0.05) v+=0.92*Math.exp(-e)*(1+.15*Math.sin(t*900));
  if(tr!=null){const d=t-tr; if(d>=0&&d<0.06) v+=0.5*Math.exp(-d/0.01)*(1+.25*Math.sin(d*1200));}
  return v}

function grid(){sx.fillStyle='#020a06';sx.fillRect(0,0,SW,SH);sx.strokeStyle='rgba(77,255,154,.12)';sx.lineWidth=1;
  for(let i=0;i<=SPAN/0.5;i++){const x=i*0.5/SPAN*SW;sx.beginPath();sx.moveTo(x,0);sx.lineTo(x,SH);sx.stroke()}
  for(let j=0;j<=8;j++){const y=j/8*SH;sx.beginPath();sx.moveTo(0,y);sx.lineTo(SW,y);sx.stroke()}
  sx.strokeStyle='rgba(77,255,154,.3)';sx.beginPath();sx.moveTo(0,SH*.75);sx.lineTo(SW,SH*.75);sx.stroke();
  sx.fillStyle='rgba(77,255,154,.55)';sx.font='10px JetBrains Mono';
  for(let i=0;i<=6;i++)sx.fillText((i*0.5).toFixed(1).replace('.',',')+' s',i*0.5/SPAN*SW+4,SH-6)}

let trace=[];
function drawScope(t){grid();if(!trace.length)return;
  sx.save();sx.shadowColor='#4dff9a';sx.shadowBlur=8;sx.strokeStyle='#6dffad';sx.lineWidth=1.6;sx.beginPath();
  trace.forEach((p,i)=>{const x=p[0]/SPAN*SW,y=SH*.75-p[1]*SH*.7;i?sx.lineTo(x,y):sx.moveTo(x,y)});sx.stroke();sx.restore();
  const last=trace[trace.length-1];if(shot&&!shot.done){sx.fillStyle='#bfffd9';sx.beginPath();sx.arc(last[0]/SPAN*SW,SH*.75-last[1]*SH*.7,3,0,7);sx.fill()}
  if(shot&&shot.done){const x=shot.tr/SPAN*SW;sx.strokeStyle='rgba(255,181,71,.8)';sx.setLineDash([4,4]);sx.beginPath();sx.moveTo(x,0);sx.lineTo(x,SH);sx.stroke();sx.setLineDash([]);
    sx.fillStyle='#ffb547';sx.font='600 12px JetBrains Mono';const lab='ÉCHO  '+fmt(shot.tr);sx.fillText(lab,Math.min(x+8,SW-150),18);
    sx.fillStyle='#ff4d6d';sx.fillText('ÉMISSION',8,18)}}

function drawTraj(t){tx.clearRect(0,0,TW,TH);const ex=60,mx=TW-60,cy=TH/2;
  // Terre
  const g=tx.createRadialGradient(ex-10,cy-10,4,ex,cy,34);g.addColorStop(0,'#7fd0ff');g.addColorStop(.6,'#1f6fb5');g.addColorStop(1,'#0a2a55');
  tx.fillStyle=g;tx.beginPath();tx.arc(ex,cy,32,0,7);tx.fill();tx.fillStyle='rgba(60,170,90,.8)';tx.beginPath();tx.ellipse(ex-6,cy-6,12,8,.5,0,7);tx.fill();tx.beginPath();tx.ellipse(ex+12,cy+10,7,10,-.3,0,7);tx.fill();
  // Lune
  const m=tx.createRadialGradient(mx-5,cy-5,2,mx,cy,16);m.addColorStop(0,'#f0f3f8');m.addColorStop(1,'#7b8496');tx.fillStyle=m;tx.beginPath();tx.arc(mx,cy,15,0,7);tx.fill();
  tx.font='11px JetBrains Mono';tx.fillStyle='#7f95b8';tx.textAlign='center';tx.fillText('TERRE · Bouraké',ex,cy+52);tx.fillText('LUNE · '+$('tgt').value,mx,cy+40);
  tx.strokeStyle='rgba(127,149,184,.25)';tx.setLineDash([3,6]);tx.beginPath();tx.moveTo(ex+34,cy);tx.lineTo(mx-17,cy);tx.stroke();tx.setLineDash([]);
  if(!shot)return;const tr=shot.tr,L=mx-17-(ex+34);
  let p,col,up;
  if(t<tr/2){p=t/(tr/2);col='#ff4d6d';up=-1}else if(t<tr){p=1-(t-tr/2)/(tr/2);col='#4dff9a';up=1}else return;
  const x=ex+34+p*L,y=cy+up*6;
  tx.strokeStyle=col;tx.lineWidth=3;tx.shadowColor=col;tx.shadowBlur=14;tx.beginPath();
  const tail=Math.min(60,L*.15);tx.moveTo(x,y);tx.lineTo(up<0?x-tail:x+tail,y);tx.stroke();tx.shadowBlur=0;
  tx.fillStyle='#fff';tx.beginPath();tx.arc(x,y,3,0,7);tx.fill()}

function setSys(l,te,d){$('sLaser').textContent=l[0];$('sLaser').className=l[1];$('sTel').textContent=te[0];$('sTel').className=te[1];$('sDet').textContent=d[0];$('sDet').className=d[1]}

function loop(){if(!shot)return;const t=elapsed();
  // ajoute les points de trace jusqu'à t
  const step=SPAN/1400;let lt=trace.length?trace[trace.length-1][0]:0;
  while(lt<Math.min(t,SPAN)){lt+=step;trace.push([lt,signal(lt,lt>=shot.tr?shot.tr:null)])}
  if(!shot.done){$('roT').textContent=fmt(Math.min(t,shot.tr))}
  if(!shot.done&&t>=shot.tr){shot.done=true;beep(1320,.35,.35);
    $('roT').textContent=fmt(shot.tr);$('roT').classList.add('got');$('roState').textContent='ÉCHO REÇU';$('roState').style.color='var(--green)';
    $('roPh').textContent=shot.ph+' photons';setSys(['RECHARGE','wait'],['ALIGNÉ','ok'],['ÉCHO DÉTECTÉ','ok']);log()}
  else if(!shot.done&&t>shot.tr/2){$('roState').textContent='RETOUR…'}
  drawScope(t);drawTraj(t);
  if(t<SPAN)requestAnimationFrame(loop);else{$('fire').disabled=false;setSys(['PRÊT','ok'],['ALIGNÉ','ok'],['EN ÉCOUTE','ok'])}}

function fire(){const k=$('tgt').value;
  const d=BASE[k]+(Math.random()-.5)*2400;        // variation réaliste de quelques km
  const tr=2*d/C+(Math.random()-.5)*0.0006;         // + petite erreur instrumentale
  $('fire').disabled=true;$('roT').classList.remove('got');$('roState').style.color='';$('roPh').textContent='—';
  $('roState').textContent='ARMEMENT…';setSys(['CHARGE','wait'],['VERROUILLAGE','wait'],['EN ÉCOUTE','ok']);
  shot=null;trace=[];drawScope(0);drawTraj(0);
  setTimeout(()=>{$('roState').textContent='TIR !';setSys(['ÉMISSION','ok'],['VERROUILLÉ','ok'],['EN ÉCOUTE','wait']);
    beep(880,.18,.35);
    shot={t0:performance.now(),tr,done:false,k,ph:2+Math.floor(Math.random()*6)};
    setTimeout(()=>{if(shot&&!shot.done)$('roState').textContent='ALLER…'},60);
    requestAnimationFrame(loop)},900)}

function log(){shots.push({n:shots.length+1,g:$('grp').value||'—',k:shot.k,h:new Date().toLocaleTimeString('fr-FR'),t:shot.tr});renderLog()}
function renderLog(){const b=$('logBody');if(!shots.length){b.innerHTML='<tr><td colspan="5" class="muted">Aucun tir pour l\'instant.</td></tr>';return}
  b.innerHTML=shots.slice().reverse().map(s=>`<tr><td>${s.n}</td><td>${s.g.replace(/[<>&]/g,'')}</td><td>${s.k}</td><td>${s.h}</td><td class="t">${fmt(s.t)}</td></tr>`).join('')}
$('fire').addEventListener('click',fire);
$('clear').addEventListener('click',()=>{shots=[];renderLog()});
$('tgt').addEventListener('change',()=>{if(!shot||shot.done)drawTraj(shot?99:0)});
resize();
