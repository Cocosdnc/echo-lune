
/* ---------- étoiles ---------- */
(()=>{const c=document.getElementById('stars'),x=c.getContext('2d');let s=[];
function r(){c.width=innerWidth;c.height=innerHeight;s=Array.from({length:160},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.2+.2,p:Math.random()*6}))}
function d(t){x.clearRect(0,0,c.width,c.height);for(const a of s){x.globalAlpha=.35+.35*Math.sin(t/900+a.p);x.fillStyle='#cfe6ff';x.beginPath();x.arc(a.x,a.y,a.r,0,7);x.fill()}requestAnimationFrame(d)}
addEventListener('resize',r);r();requestAnimationFrame(d)})();


/* image indisponible : on masque proprement */
document.querySelectorAll('.photo img,.moon-wrap img').forEach(i=>i.addEventListener('error',()=>{i.style.opacity=0}));
