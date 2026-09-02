/* nucleo.js — helpers, datos base y estructura común (menú, barra, footer) */
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
const pickN=(a,n)=>{const c=[...a],r=[];while(n-->0&&c.length)r.push(c.splice(rnd(c.length),1)[0]);return r};
const wpick=w=>{let s=0;w.forEach(x=>s+=x[1]);let r=Math.random()*s;for(const x of w){r-=x[1];if(r<=0)return x[0]}return w[0][0]};
const N=v=>Number.isFinite(+v)?+v:0;
const dmgS=b=>{b=N(b);return b<=0?'1d6':(b%3===0?(1+b/3)+'d6':'1d6+'+b)};

const ELM={hi:['火','Fuego'],ts:['土','Tierra'],kz:['風','Viento'],mz:['水','Agua'],tg:['天','Cielo'],ym:['闇','Oscuridad']};
const ELC={hi:'#c14b35',ts:'#a5713c',kz:'#6e8f5a',mz:'#3f7fa3',tg:'#c9a24b',ym:'#7d57a8'};
const TYN={a:'Ataque',p:'Potenciar',i:'Invocación'};
const TYC={a:'#b3402f',p:'#6e8f5a',i:'#7d57a8'};
const BUDG={a:[6,9,12,15,18],p:[2,4,6,8,10],i:[2,4,6,8,10]};

const FX={
 atk:[
  {id:'dmg',n:'Daño +1',c:1,m:9,d:'cada +3 = 1d6'},
  {id:'rng',n:'A distancia',c:1,m:1,d:''},
  {id:'tgt',n:'Objetivo adicional',c:3,m:3,d:'supera también su defensa'},
  {id:'noa',n:'Ignora absorción',c:3,m:1,d:''},
  {id:'inc',n:'Incapacitado (−1)',c:2,m:3,d:'máx. −3 (6 PdJ)'},
  {id:'mov',n:'Evitar movimiento 1 turno',c:2,m:1,d:'la víctima puede atacar'},
  {id:'frz',n:'Congelar (1.er turno)',c:5,m:1,d:'se rompe si recibe daño'},
  {id:'frx',n:'Congelar: turno extra',c:2,m:5,d:''},
  {id:'lf',n:'Robar vida',c:2,m:1,d:'roba 1 PV'},
  {id:'ki',n:'Robar Ki',c:2,m:1,d:'roba 1 PK'}],
 pot:[
  {id:'otr',n:'Potenciar a otra persona',c:1,m:4,d:'N veces = N personas'},
  {id:'rng',n:'A distancia',c:1,m:1,d:''},
  {id:'grp',n:'Todo el grupo',c:4,m:1,d:'incluye distancia'},
  {id:'car',n:'Característica +1',c:1,m:3,d:'durante 1d6 turnos'},
  {id:'cur',n:'Curación +2 PV',c:1,m:9,d:'cada 3 PV = 1d6'},
  {id:'inv',n:'Invisibilidad',c:1,m:3,d:'1 turno; se rompe al atacar'},
  {id:'fly',n:'Volar',c:1,m:3,d:'1 turno'},
  {id:'bth',n:'Respirar bajo el agua',c:1,m:1,d:'1d6 minutos'},
  {id:'dup',n:'Duplicado',c:4,m:1,d:'1d6 turnos, 5 PV'},
  {id:'dpv',n:'PV extra del duplicado',c:1,m:5,d:'+5 PV'},
  {id:'esp',n:'Espinas',c:1,m:9,d:'daño al atacante en CC'},
  {id:'vis',n:'Visión verdadera',c:4,m:1,d:'ve el Ki y a los invisibles'},
  {id:'tel',n:'Teletransporte',c:1,m:6,d:'por cada 5 m'}]
};

const NAV=[
 ['index.html','仲','Inicio'],
 ['cap01.html','心','Qué es Nakama'],
 ['cap02.html','四','El mundo de Shikoku'],
 ['cap03.html','階','Estructura social'],
 ['cap04.html','家','Los Kazoku'],
 ['cap05.html','掟','Costumbres'],
 ['cap06.html','創','Crea tu Yosai'],
 ['cap07.html','始','Primera campaña'],
 ['cap08.html','人','Crear personaje'],
 ['cap09.html','規','Reglas y dados'],
 ['cap10.html','術','Diseño de jutsu'],
 ['cap11.html','巻','Grimorio de jutsu'],
 ['cap12.html','例','Senshi de ejemplo'],
 ['cap13.html','兵','PNJ y generador'],
 ['cap14.html','獣','Bestiario'],
  ['cap15.html','言','Glosario y nombres'],
  ['cap16.html','迷','Mazmorras'],
  ['cap17.html','鴉','Karasu No Aki'],
  ['cap18.html','師','Ser Máster']
];

(function(){
  const page=(document.body.dataset.page||'')+'.html';
  const links=NAV.map(n=>`<a href="${n[0]}"${n[0]===page?' class="active"':''}><span class="kn">${n[1]}</span>${n[2]}</a>`).join('');
  document.getElementById('navmount').outerHTML=`
    <div id="progress"></div>
    <header class="topbar"><span class="logo">仲間 NAKAMA</span><div style="flex:1"></div><input id="topSearch" class="filter" placeholder="Buscar…" style="max-width:200px;margin:0 10px;display:none"><button class="burger" id="burger" aria-label="Abrir menú">☰</button></header>
    <aside id="sidenav">
      <div class="brand"><div class="bk">仲</div><div><b>NAKAMA</b><small>JUEGO DE ROL</small></div></div>
      <input id="globalSearch" class="filter" placeholder="Buscar capítulos, jutsus, criaturas…" aria-label="Buscar en toda la web" style="margin:10px 0 4px">
      <nav>${links}</nav>
      <div class="sfoot">Edición web del manuscrito original.<br>Erratas corregidas · reglas intactas.</div>
    </aside>`;
  const sn=$('#sidenav');
  $('#burger').addEventListener('click',()=>sn.classList.toggle('open'));
  $$('#sidenav nav a').forEach(a=>a.addEventListener('click',()=>sn.classList.remove('open')));
  // búsqueda global
  const gSearch=$('#globalSearch'), topSearch=$('#topSearch');
  function doSearch(v){
    v=v.toLowerCase();
    $$('#sidenav nav a').forEach(a=>a.style.display=a.textContent.toLowerCase().includes(v)?'':'none');
    if($('#grQ')){ $('#grQ').value=v; $('#grQ').dispatchEvent(new Event('input')); }
    if($('#beQ')){ $('#beQ').value=v; $('#beQ').dispatchEvent(new Event('input')); }
    if($('#kzFilter')){ $('#kzFilter').value=v; $('#kzFilter').dispatchEvent(new Event('input')); }
  }
  if(gSearch) gSearch.addEventListener('input',e=>doSearch(e.target.value));
  if(topSearch){ topSearch.style.display='block'; topSearch.addEventListener('input',e=>{doSearch(e.target.value); if(gSearch) gSearch.value=e.target.value;}); }
  let busy=false;
  addEventListener('scroll',()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{const h=document.documentElement;$('#progress').style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';busy=false})},{passive:true});
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]');
    if(!a)return;
    const id=a.getAttribute('href').slice(1);
    if(!id)return;
    const t=document.getElementById(id);
    if(!t)return;
    e.preventDefault();sn.classList.remove('open');
    t.scrollIntoView({behavior:'smooth',block:'start'});
    if(history.replaceState)history.replaceState(null,'','#'+id);
  });
  const f=document.createElement('footer');
  f.innerHTML=`<div class="wrap"><div class="fkanji">仲間</div><p><b style="color:#c9a24b">NAKAMA</b> · Un juego de rol de Jose Casado, Xavier Borrut, Daniel Rosas, Daniel Lorente, Txell Pérez y Miguel Angel Zarza.<br>Edición web del manuscrito: erratas corregidas, maquetación renovada, reglas intactas. Grimorio, bestiario y generadores creados para esta edición siguiendo las reglas del libro. Las ilustraciones son emblemas kanji y mapas decorativos creados para esta edición.</p></div>`;
  document.body.appendChild(f);
  // back to top
  const bt=document.createElement('button'); bt.textContent='↑'; bt.setAttribute('aria-label','Volver arriba');
  bt.style.cssText='position:fixed;right:16px;bottom:16px;width:42px;height:42px;border-radius:50%;border:1px solid #c9a24b;background:#201b2b;color:#c9a24b;font:700 18px serif;cursor:pointer;display:none;z-index:90';
  document.body.appendChild(bt);
  bt.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
  addEventListener('scroll',()=>bt.style.display=scrollY>400?'block':'none',{passive:true});
  // TOC sticky for long chapters
  const chap=document.querySelector('.chap');
  if(chap && chap.querySelectorAll('h3').length>=4){
    const toc=document.createElement('nav'); toc.className='toc';
    toc.style.cssText='position:sticky;top:70px;background:#fffaf0;border:1px solid #cdbf9d;border-radius:10px;padding:10px 14px;margin:14px 0;font-size:12.5px;z-index:2';
    toc.innerHTML='<b style="color:#b4872f">En esta página</b><ul style="margin:8px 0 0;padding-left:16px">'+[...chap.querySelectorAll('h3')].map((h,i)=>{if(!h.id) h.id='sec'+i; return `<li><a href="#${h.id}" style="color:#5f5343;text-decoration:none">${h.textContent}</a></li>`}).join('')+'</ul>';
    chap.insertBefore(toc, chap.querySelector('.pdf-text')||chap.firstChild);
  }
  // SEO/OG/json-ld
  if(!document.querySelector('meta[name="description"]')){
    const m=document.createElement('meta'); m.name='description';
    m.content=document.title+' — Nakama, juego de rol de fortalezas y clanes. Manuscrito p.'+(document.querySelector('.chap-num')?.textContent||'');
    document.head.appendChild(m);
  }
  if(!document.querySelector('meta[property="og:image"]')){
    const o=document.createElement('meta'); o.setAttribute('property','og:image'); o.content='assets/img/pdf/p01_00_p1.webp';
    document.head.appendChild(o);
  }
  const ld=document.createElement('script'); ld.type='application/ld+json';
  ld.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Book","name":"Nakama","author":["Jose Casado","Xavier Borrut"],"inLanguage":"es","bookFormat":"https://schema.org/EBook","url":location.href});
  document.head.appendChild(ld);
  if(!document.querySelector('link[rel="manifest"]')){
    const ml=document.createElement('link'); ml.rel='manifest'; ml.href='manifest.json';
    document.head.appendChild(ml);
  }
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
})();