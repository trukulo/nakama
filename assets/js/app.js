/* app.js — lógica interactiva; cada módulo se activa solo si su HTML existe en la página */
(function(){
/* ---------- constructor de personaje ---------- */
const S_STATS=[
 {id:'ini',n:'Iniciativa',b:0,st:1,f:v=>'+'+N(v)},
 {id:'atme',n:'Ataque melee',b:0,st:1,f:v=>'+'+N(v)},
 {id:'dame',n:'Daño melee',b:0,st:1,f:v=>'1d6'+(N(v)>0?'+'+N(v):'')},
 {id:'defme',n:'Defensa melee',b:10,st:1,f:null},
 {id:'atdi',n:'Ataque distancia',b:0,st:1,f:v=>'+'+N(v)},
 {id:'dadi',n:'Daño distancia',b:0,st:1,f:v=>'1d6'+(N(v)>0?'+'+N(v):'')},
 {id:'defdi',n:'Defensa distancia',b:10,st:1,f:null},
 {id:'abs',n:'Absorción',b:0,st:1,f:null},
 {id:'pv',n:'Puntos de vida',b:20,st:5,f:null},
 {id:'ck',n:'Control de Ki',b:0,st:1,f:v=>'+'+N(v)}];
const S_ADV=[
 {id:'cer',n:'Certero',c:2,d:'Repite los 1 en el daño'},
 {id:'fuin',n:'Sellos mágicos (Fuinjutsu)',c:2,d:'Magia de sellos'},
 {id:'kage',n:'Especialista Kage',c:1,d:'Repite 1 tirada de Kage al día'},
 {id:'reik',n:'Especialista Reikon',c:1,d:'Repite 1 tirada de Reikon al día'},
 {id:'shis',n:'Especialista Shisen',c:1,d:'Repite 1 tirada de Shisen al día'},
 {id:'mad',n:'Madera de héroe',c:2,d:'Críticos incluso malherido'},
 {id:'chi',n:'Magia de sangre (Chijutsu)',c:1,d:'Paga jutsu con PV'},
 {id:'rec',n:'Recuperación mejorada',c:1,d:'+1 PV y PK extra'},
 {id:'sue',n:'Suerte',c:5,d:'Repite una tirada por escena'},
 {id:'acu',n:'Acumulador de Ki',c:2,d:'+1d6 de Ki al descansar'}];
const S_SK=[
 ['Shisen',['Advertir/Notar','Atletismo','Buscar/Rastrear','Cabalgar','Nadar/Navegar','Supervivencia/Cazar']],
 ['Kage',['Callejeo','Disfraz','Mecanismos','Robar bolsillos','Rumores','Sigilo']],
 ['Reikon',['Comercio','Etiqueta','Ocultismo','Música','Sanación/Hierbas','Tradición/Historia']]];
let st={},adv={},ki='none',pk=0,jut=[],skl={};
function resetStats(){S_STATS.forEach(s=>st[s.id]=N(s.b));}
function resetSkills(){skl={};S_SK.forEach(([,l])=>l.forEach(n=>skl[n]=0));}
resetStats();resetSkills();
let budget=10;const lim=()=>budget>=20?4:3;
const pts=(v,b,s)=>N((N(v)-N(b))/(N(s)||1));
function renderStats(){
  const box=$('#bStats');if(!box)return;box.innerHTML='';
  S_STATS.forEach(s=>{
    const r=document.createElement('div');r.className='srow';
    const p=N(pts(st[s.id],s.b,s.st));
    if(p>lim())r.classList.add('err');
    r.innerHTML=`<div class="n"><b>${s.n}</b></div>
      <span class="stp"><button data-s="${s.id}" data-d="-1">−</button><span class="q">${p}</span><button data-s="${s.id}" data-d="1">+</button></span>
      <span class="v">${s.f?s.f(N(st[s.id])):N(st[s.id])}</span><span class="pc">${p} PC</span>`;
    box.appendChild(r);
  });
  $$('button[data-s]',box).forEach(b=>b.addEventListener('click',()=>{
    const s=S_STATS.find(x=>x.id===b.dataset.s);
    const np=N(pts(st[s.id],s.b,s.st))+ +b.dataset.d;
    if(np<0||np>lim())return;
    st[s.id]=N(s.b)+np*N(s.st);renderStats();calc();
  }));
}
function renderAdv(){
  const box=$('#bAdv');if(!box)return;box.innerHTML='';
  S_ADV.forEach(a=>{
    const l=document.createElement('label');
    l.innerHTML=`<input type="checkbox" data-a="${a.id}" ${adv[a.id]?'checked':''}><span><b>${a.n} · ${N(a.c)} PC</b>${a.d}</span>`;
    box.appendChild(l);
  });
  $$('input[data-a]',box).forEach(c=>c.addEventListener('change',()=>{adv[c.dataset.a]=c.checked;calc();}));
}
function renderSkills(){
  const box=$('#bSkills');if(!box)return;box.innerHTML='';
  S_SK.forEach(([g,list])=>{
    const h=document.createElement('div');h.style.cssText='color:#c9a24b;font:700 14px var(--fd);margin:14px 0 4px';h.textContent=g;box.appendChild(h);
    list.forEach(n=>{
      const r=document.createElement('div');r.className='srow'+(N(skl[n])>lim()?' err':'');
      r.innerHTML=`<div class="n">${n}</div>
        <span class="stp"><button data-k="${n}" data-d="-1">−</button><span class="q">${N(skl[n])}</span><button data-k="${n}" data-d="1">+</button></span>
        <span class="v">${N(skl[n])}</span><span class="pc">${N(skl[n])} PH</span>`;
      box.appendChild(r);
    });
  });
  $$('button[data-k]',box).forEach(b=>b.addEventListener('click',()=>{
    const n=b.dataset.k,v=N(skl[n])+ +b.dataset.d;
    if(v<0||v>lim())return;skl[n]=v;renderSkills();calc();
  }));
}
function renderJut(){
  const box=$('#bJutsu');if(!box)return;box.innerHTML='';
  jut.forEach((j,i)=>{
    j.n=j.n||'';j.lv=N(j.lv)||1;
    const r=document.createElement('div');r.className='srow';
    r.innerHTML=`<div class="n"><input type="text" data-ji="${i}" value="${j.n}" placeholder="nombre del jutsu"></div>
      <select data-jl="${i}">${Array.from({length:9},(_,k)=>`<option value="${k+1}" ${k+1===j.lv?'selected':''}>nivel ${k+1}</option>`).join('')}</select>
      <span class="pc">${j.lv} PC</span><button class="rm" data-jr="${i}">×</button>`;
    box.appendChild(r);
  });
  $$('select[data-jl]',box).forEach(s=>s.addEventListener('change',()=>{jut[+s.dataset.jl].lv=N(s.value)||1;calc();}));
  $$('input[data-ji]',box).forEach(ip=>ip.addEventListener('input',()=>{jut[+ip.dataset.ji].n=ip.value;}));
  $$('button[data-jr]',box).forEach(b=>b.addEventListener('click',()=>{jut.splice(+b.dataset.jr,1);renderJut();calc();}));
}
function updKi(){if(!$('#bKiQ'))return;$('#bKiQ').textContent=ki==='mana'?N(pk)/5:N(pk);$('#bKiV').textContent=N(pk);
  $('#bKiPC').textContent=(ki==='mana'?N(pk)/5:N(pk))+' PC';}
function calc(){
  if(!$('#bPC'))return;
  let pc=N(S_STATS.reduce((a,s)=>a+N(pts(st[s.id],s.b,s.st)),0));
  pc+=N(S_ADV.reduce((a,x)=>a+(adv[x.id]?N(x.c):0),0));
  pc+=N(ki==='mana'?N(pk)/5:N(pk));
  pc+=N(jut.reduce((a,j)=>a+N(j.lv),0));
  const ph=N(Object.values(skl).reduce((a,v)=>a+N(v),0));
  $('#bPC').innerHTML=`<b>${pc}/${N(budget)}</b><span>PC gastados</span>`;
  $('#bPC').classList.toggle('over',pc>budget);
  $('#bPH').innerHTML=`<b>${ph}/${N(budget)}</b><span>PH gastados</span>`;
  $('#bPH').classList.toggle('over',ph>budget);
  $('#bLim').innerHTML=`<b>${lim()}</b><span>máximo por valor</span>`;
  $('#bDef').innerHTML=`<b>${N(st.defme)} / ${N(st.defdi)}</b><span>defensas CC / Dis</span>`;
  const w=[];
  if(pc>budget)w.push(`Te has pasado del presupuesto en ${pc-budget} PC.`);
  if(ph>budget)w.push(`Te has pasado en ${ph-budget} PH.`);
  if(!w.length)w.push('');
  $('#bWarn').textContent=w.join(' ');
}

/* ---------- taller de jutsu ---------- */
let jt='atk',jLvlV=1,jq={},invPC=4;
function renderFx(){
  const box=$('#jFx');if(!box)return;box.innerHTML='';
  (FX[jt]||[]).forEach(f=>{
    const q=N(jq[f.id]);
    const r=document.createElement('div');r.className='jrow';
    r.innerHTML=`<div class="n">${f.n}${f.d?`<small>${f.d}</small>`:''}</div>
      <span class="stp"><button data-f="${f.id}" data-d="-1">−</button><span class="q">${q}</span><button data-f="${f.id}" data-d="1">+</button></span>
      <span class="cst">${q?N(f.c)*q+' PdJ':'—'}</span>`;
    box.appendChild(r);
  });
  $$('button[data-f]',box).forEach(b=>b.addEventListener('click',()=>{
    const id=b.dataset.f,f=FX[jt].find(x=>x.id===id);
    jq[id]=Math.max(0,Math.min(N(f.m),N(jq[id])+ +b.dataset.d));renderFx();jcalc();
  }));
}
function jcalc(){
  if(!$('#jPdJ'))return;
  let total,level;
  if(jt==='inv'){total=2+N(invPC);level=Math.max(1,Math.ceil(total/2));}
  else{const base=jt==='atk'?6:2,per=jt==='atk'?3:2;
    let eff=0;(FX[jt]||[]).forEach(f=>eff+=N(f.c)*N(jq[f.id]));
    total=base+per*(N(jLvlV)-1)+eff;level=N(jLvlV);}
  $('#jPdJ').textContent=N(total);$('#jNiv').textContent=N(level);
  $('#jPC').textContent=N(level)+' PC';$('#jDif').textContent=8+N(level);$('#jKi').textContent=N(level);
  $('#jWarn').textContent=(jt!=='inv'&&jLvlV>3)?'Con 10 PC solo puedes permitirte jutsu de nivel ≤ 3 aprox.':'';
}

/* ---------- grimorio ---------- */
let grS={ty:'all',lv:0,el:'all',q:''};
function grRender(){
  if(!$('#grGrid')||typeof GRIM==='undefined')return;
  const list=GRIM.filter(j=>(grS.ty==='all'||j[0]===grS.ty)&&(!grS.lv||j[1]===grS.lv)&&(grS.el==='all'||j[2]===grS.el)&&(!grS.q||(j[3]+' '+j[4].map(x=>x[0]).join(' ')).toLowerCase().includes(grS.q.toLowerCase())));
  $('#grCount').textContent=`Mostrando ${list.length} de ${GRIM.length} jutsus · presupuesto de PdJ verificado`;
  const g=$('#grGrid');g.innerHTML='';
  list.forEach(j=>{
    const ty=j[0],lv=N(j[1]),el=j[2],n=j[3],fx=j[4],fl=j[5];
    const tot=fx.reduce((a,x)=>a+N(x[1]),0),bud=BUDG[ty][lv-1];
    const br=fx.map(x=>`<div class="gbr"><span>${x[0]}</span><b>${N(x[1])} PdJ</b></div>`).join('');
    g.insertAdjacentHTML('beforeend',`<article class="gcard" style="--gc:${TYC[ty]}">
      <span class="gtype">${TYN[ty]}</span>
      <h4>${n}<span class="kn" style="color:${ELC[el]}">${ELM[el][0]} ${ELM[el][1]}</span></h4>
      <div class="gmeta"><span class="gm l">Nivel ${lv}</span><span class="gm">PdJ ${tot}/${bud}</span><span class="gm">${lv} PC</span><span class="gm">Dif. ${8+lv}</span><span class="gm">${lv} Ki${ty==='i'?' +1/turno':''}</span></div>
      ${br}
      <p class="gfx">${fl}</p></article>`);
  });
}

/* ---------- bestiario ---------- */
let beS={lv:0,el:'all',q:''};
const beRows=$$('#beTable .be-row'),beGrps=$$('#beTable .be-grp');
function beFilter(){
  if(!$('#beCount'))return;
  const q=beS.q.toLowerCase();let vis=0;
  beRows.forEach(r=>{
    const ok=(!beS.lv||r.dataset.l==beS.lv)&&(beS.el==='all'||r.dataset.el===beS.el)&&(!q||r.textContent.toLowerCase().includes(q));
    r.style.display=ok?'':'none';if(ok)vis++;
  });
  beGrps.forEach(g=>{g.style.display=beRows.some(r=>r.dataset.l===g.dataset.l&&r.style.display!=='none')?'':'none'});
  $('#beCount').textContent=`Mostrando ${vis} de ${beRows.length} criaturas del bestiario oficial`;
}

/* ---------- utilidades de generadores ---------- */
function pickJutsus(maxLv,n,el,ty){
  if(typeof GRIM==='undefined')return [];
  let p=GRIM.filter(j=>j[1]<=maxLv&&(!ty||j[0]===ty));
  const pe=p.filter(j=>j[2]===el);
  return pickN(pe.length>=n?pe:p,n);
}
function jutsuLine(j){
  if(!Array.isArray(j)||j.length<5)return '';
  const effects=Array.isArray(j[4])?j[4].map(x=>Array.isArray(x)?x[0]:String(x)).join('; '):'';
  return `<div class="gjs"><b>${j[3]||'Jutsu'}</b> · ${TYN[j[0]]||'Jutsu'} · nivel ${N(j[1])} · dif. ${8+N(j[1])} · ${N(j[1])} Ki${effects?` — ${effects}`:''}</div>`;
}
function pickGrim(type,lv,el,used){
  if(typeof GRIM==='undefined')return null;
  let p=GRIM.filter(g=>g[0]===type&&g[1]===lv&&g[2]===el&&!used.has(g[3]));
  if(!p.length)p=GRIM.filter(g=>g[0]===type&&g[1]===lv&&!used.has(g[3]));
  if(!p.length)return null;
  const g=pick(p);used.add(g[3]);return g;
}

/* ---------- generador de Senshi ---------- */
let SG_LAST=null;
function runSG(){
  if(!$('#sgGo')||!SG_LASTinit())return;
}
function SG_LASTinit(){return true;}
function runSG2(){
  const b=N($('#sgPc').value)||10;
  const yv=$('#sgYos').value;
  const yos=yv==='any'?pick(YOS):YOS.find(y=>y[0]===yv);
  const el=yos[0];
  const av=$('#sgArch').value;
  const arcKey=av==='any'?pick(Object.keys(SG_ARC)):av;
  const A=SG_ARC[arcKey];if(!A)return;
  const s=A[b]||A[10];
  const female=Math.random()<.5;
  const [nm,mean]=pick(female?NF:NM);
  const house=pick(HOUSES[el]);
  const school=pick(['Kage','Reikon','Shisen','Kansei']);
  const used=new Set(), jutsus=[];
  (s.ju||[]).forEach(L=>{
    const ty=A.ty==='x'?pick(['a','p']):A.ty;
    if(!ty)return;
    const g=pickGrim(ty,L,el,used);
    if(g)jutsus.push(g);
  });
  const ph=b, cap=b>=20?4:3;
  const pool=school==='Kansei'?[...SKP.Kage,...SKP.Reikon,...SKP.Shisen]:SKP[school];
  const kmin=Math.ceil(ph/cap);
  const k=Math.min(pool.length,kmin+rnd(2));
  const chosen=pickN(pool,Math.max(k,kmin));
  const gskl={};chosen.forEach(x=>gskl[x]=0);
  let left=ph,guard=0;
  while(left>0&&guard++<999){const sk2=pick(chosen);if(gskl[sk2]<cap){gskl[sk2]++;left--;}}
  // Características especiales: 60% de los Senshi tienen 1-2 (hasta 2 PC con 10, hasta 3 PC con 20)
  const advPicks=[];
  if(Math.random()<0.6){
    const maxAdvCost=b>=20?3:b>=15?2:2;
    // ponderar: Certero/Madera para builds físicos, Suerte raro, Recuperación muy común
    const poolAdv=[...S_ADV].sort(()=>Math.random()-0.5);
    let cost=0;
    for(const a of poolAdv){
      if(cost+a.c>maxAdvCost) continue;
      // afinidad por arquetipo
      if(a.id==='cer' && !['espadachin','arquero','equilibrado'].includes(arcKey) && Math.random()<0.7) continue;
      if(a.id==='mad' && arcKey!=='tanque' && Math.random()<0.6) continue;
      if(a.id==='sue' && Math.random()<0.85) continue; // Suerte cara, más rara
      if(Math.random()<0.45){
        advPicks.push(a);
        cost+=a.c;
        if(advPicks.length>=2 || cost>=maxAdvCost) break;
      }
    }
    // si no cogió nada pero tocaba, fuerza una barata
    if(!advPicks.length && Math.random()<0.5){
      const cheap=poolAdv.find(a=>a.c===1);
      if(cheap) advPicks.push(cheap);
    }
  }
  SG_LAST={b,el,yos,arcKey,A,s,nm,mean,house,school,jutsus,gskl,advPicks,
    app:`Pelo ${pick(SG_HAIR_C)} ${pick(SG_HAIR_S)}, ojos ${pick(SG_EYE)}, complexión ${pick(SG_BOD)}. Viste colores ${ELCOL[el]} y luce ${pick(SG_TREND)}.`,
    pers:pick(SG_PERS),concept:pick(SG_CONCEPT),rasgo:pick(QK),mot:pick(MOT),sec:pick(SEC)};
  const c=SG_LAST, col=ELC[el];
  const skillsLine=Object.entries(c.gskl).filter(([,v])=>N(v)>0).map(([n2,v])=>`${n2} ${N(v)}`).join(', ');
  const advLine=c.advPicks.length?c.advPicks.map(a=>`${a.n} (${a.c} PC)`).join(' · '):'—';
  $('#sgOut').innerHTML=`
    <h4>${nm} <small style="font:400 13px var(--fb);color:#6f6350">(${mean})</small></h4>
    <p class="gsub">${yos[1]} · Kazoku ${house} · Escuela ${school} · ${A.n} (${b} PC) · concepto: ${c.concept}</p>
    <p class="gline">${c.app} <b>Personalidad:</b> ${c.pers}.</p>
    <table class="tb" style="--c:${col};margin-top:6px">
      <tr><th>In</th><th>At CC</th><th>Daño CC</th><th>At Dis</th><th>Daño Dis</th><th>Def CC</th><th>Def Dis</th><th>Abs</th><th>PV</th><th>CK</th><th>PK</th></tr>
      <tr><td>+${N(s.in)}</td><td>+${N(s.atm)}</td><td>${dmgS(s.dtm)}</td><td>+${N(s.atd)}</td><td>${dmgS(s.dtd)}</td><td>${10+N(s.dfm)}</td><td>${10+N(s.dfd)}</td><td>${N(s.ab)}</td><td>${20+N(s.pvx)*5}</td><td>+${N(s.ck)}</td><td>${N(s.pk)?N(s.pk)*5:'—'}</td></tr>
    </table>
    ${c.advPicks.length?`<p class="gline"><b>Características especiales:</b> ${advLine}</p>`:''}
    ${c.jutsus.length?`<p class="gline" style="margin:2px 0 0"><b>Jutsu (Maná · ${N(s.pk)*5} PK):</b></p>${c.jutsus.map(jutsuLine).join('')}`:'<p class="gline"><b>Jutsu:</b> ninguno; su fuerza es el acero.</p>'}
    <p class="gline"><b>Habilidades (${ph} PH):</b> ${skillsLine}</p>
    <p class="gline"><b>Rasgo:</b> ${c.rasgo}.</p>
    <p class="gline"><b>Motivación:</b> ${c.mot}.</p>
    <p class="gline"><b>Secreto (solo el DJ):</b> ${c.sec}.</p>
    <div class="bld-bar" style="margin:14px 0 0"><button class="btn-t solid" id="sgLoad">↑ Cargar en el constructor</button></div>`;
}

/* ---------- diseñador / generador de jutsu / grimorio personal ---------- */
let MYJ=[];
try{MYJ=JSON.parse(localStorage.getItem('nakama_myjutsu')||'[]')||[]}catch(e){MYJ=[]}
function jSaveLS(){try{localStorage.setItem('nakama_myjutsu',JSON.stringify(MYJ))}catch(e){}}
function jdName(ty,el){
  const n=JN_NOUN[el][rnd(JN_NOUN[el].length)];
  if(ty==='a')return Math.random()<.55?JN_FORM[rnd(JN_FORM.length)]+' '+n:n+' '+JR_TIT[rnd(JR_TIT.length)];
  if(ty==='p')return JN_POT[rnd(JN_POT.length)]+' de '+n;
  return 'Llamado del '+n;
}
function jrLabel(ty,id,n){
  if(ty==='a'){
    if(id==='dmg')return `Daño +${n} (${dmgS(n)})`;
    if(id==='rng')return 'A distancia';
    if(id==='tgt')return `Objetivo adicional${n>1?' ×'+n:''}`;
    if(id==='noa')return 'Ignora absorción';
    if(id==='inc')return `Incapacita −${n}`;
    if(id==='mov')return `Evita movimiento ${n} turno${n>1?'s':''}`;
    if(id==='frz')return 'Congela el 1.er turno';
    if(id==='frx')return `Congela: +${n} turno${n>1?'s':''}`;
    if(id==='lf')return `Roba ${n} PV`;
    if(id==='ki')return `Roba ${n} PK`;
  }else{
    if(id==='otr')return `Potencia a otra persona${n>1?' ×'+n:''}`;
    if(id==='rng')return 'A distancia';
    if(id==='grp')return 'Todo el grupo (incluye distancia)';
    if(id==='car')return `Característica +${n} a repartir (1d6 turnos)`;
    if(id==='cur')return `Curación ${n*2} PV`;
    if(id==='inv')return `Invisibilidad ${n} turno${n>1?'s':''}`;
    if(id==='fly')return `Volar ${n} turno${n>1?'s':''}`;
    if(id==='bth')return 'Respirar bajo el agua 1d6 min';
    if(id==='dup')return 'Duplicado (5 PV, 1d6 turnos)';
    if(id==='dpv')return `+${n*5} PV al duplicado`;
    if(id==='esp')return `Espinas ${n}`;
    if(id==='vis')return 'Visión verdadera';
    if(id==='tel')return `Teletransporte ${n*5} m`;
  }
  return id;
}
function jrCreature(pc){
  pc=N(pc);
  const core=pick(MCORE),mat=pick(MMAT);
  const s={in:0,atm:0,dtm:0,dfm:0,dfd:0,ab:0,ck:0,pk:0,pvx:0};
  const w=[['atm',3],['dtm',3],['pvx',3],['in',3],['dfm',2],['dfd',2],['ab',2],['ck',1],['pk',1]];
  let pts=pc,guard=0;
  while(pts>0&&guard++<999){const k=wpick(w);if(s[k]>=MCAP[k]){s.pvx++;pts--;continue}s[k]++;pts--}
  return {nm:core[0]+' '+mat,ty:core[2],sp:core[1],s,pc};
}
function jrCrLine(c){const s=c.s;return `In +${N(s.in)} · At +${N(s.atm)} · ${dmgS(s.dtm)} · Def ${10+N(s.dfm)}/${10+N(s.dfd)} · Abs ${N(s.ab)} · PV ${20+N(s.pvx)*5}${(s.ck||s.pk)?` · CK +${N(s.ck)} · PK ${N(s.pk)*5}`:''}`}
function jCardHTML(j,opts){
  const ty=j[0],lv=N(j[1]),el=j[2],nm=j[3],fx=j[4],fl=j[5];
  const tot=fx.reduce((a,x)=>a+N(x[1]),0),bud=BUDG[ty][lv-1];
  const br=fx.map(x=>`<div class="gbr"><span>${x[0]}</span><b>${N(x[1])} PdJ</b></div>`).join('');
  const save=opts&&opts.save?`<div class="bld-bar" style="margin:10px 0 0"><button class="btn-t" data-jsave="${encodeURIComponent(JSON.stringify(j))}">Guardar en mi grimorio</button></div>`:'';
  const del=opts&&opts.del!==undefined?`<button class="rm" data-jdel="${opts.del}" title="Eliminar" style="position:absolute;top:8px;right:8px">×</button>`:'';
  return `<article class="gcard" style="--gc:${TYC[ty]}">${del}<span class="gtype">${TYN[ty]}</span><h4>${nm}<span class="kn" style="color:${ELC[el]}">${ELM[el][0]} ${ELM[el][1]}</span></h4><div class="gmeta"><span class="gm l">Nivel ${lv}</span><span class="gm">PdJ ${tot}/${bud}</span><span class="gm">${lv} PC</span><span class="gm">Dif. ${8+lv}</span><span class="gm">${lv} Ki${ty==='i'?' +1/turno':''}</span></div>${br}<p class="gfx">${fl}</p>${save}</article>`;
}
function jrMake(ty,lv,el){
  if(ty==='i'){
    const B=BUDG.i[lv-1],pc=B-2;
    const c=jrCreature(pc);
    const fx=[['Invocación (base)',2]];if(pc>0)fx.push(['Criatura '+pc+' PC',pc]);
    const fl=`Invoca a ${c.nm} (${c.ty.toLowerCase()}, ${c.sp}) — ${jrCrLine(c)}. Mientras permanezca, gasta 1 PK extra por turno; solo una criatura por combate.`;
    return ['i',lv,el,'Llamado del '+JN_NOUN[el][rnd(JN_NOUN[el].length)],fx,fl];
  }
  const pool=ty==='a'?FX.atk:FX.pot;
  const B=BUDG[ty][lv-1];
  const counts={};pool.forEach(f=>counts[f.id]=0);
  let left=B;
  while(left>0){
    const opts=pool.filter(f=>{
      if(f.c>left||counts[f.id]>=f.m)return false;
      if(ty==='p'&&(f.id==='rng'||f.id==='otr')&&counts.grp>0)return false;
      if(ty==='p'&&f.id==='dpv'&&counts.dup===0)return false;
      return true;
    });
    if(!opts.length)break;
    const f=opts[rnd(opts.length)];
    let n=1;
    if(Math.random()<.3&&f.c*2<=left&&counts[f.id]+2<=f.m)n=2;
    counts[f.id]+=n;left-=f.c*n;
  }
  if(left>0){const fill=ty==='a'?'dmg':(counts.cur<9?'cur':'esp');counts[fill]=(counts[fill]||0)+left;left=0}
  const fx=pool.filter(f=>counts[f.id]>0).map(f=>[jrLabel(ty,f.id,counts[f.id]),N(f.c)*counts[f.id]]);
  const nn=JN_NOUN[el][rnd(JN_NOUN[el].length)];
  if(ty==='a'){
    const nm=Math.random()<.55?JN_FORM[rnd(JN_FORM.length)]+' '+nn:nn+' '+JR_TIT[rnd(JR_TIT.length)];
    return ['a',lv,el,nm,fx,JR_A[rnd(JR_A.length)].replace('{n}',nn.toLowerCase())];
  }
  return ['p',lv,el,JN_POT[rnd(JN_POT.length)]+' de '+nn,fx,JR_P[rnd(JR_P.length)].replace('{n}',nn.toLowerCase()).replace('{N}',nn)];
}
const JD={ty:'a',lv:1,el:'hi',nm:'',counts:{},cr:null};
function jdSpent(){
  if(JD.ty==='i')return 2+(JD.cr?N(JD.cr.pc):0);
  return (FX[JD.ty]||[]).reduce((a,f)=>a+N(f.c)*N(JD.counts[f.id]),0);
}
function jdDraft(){
  if(JD.ty==='i'){
    const pc=JD.cr?N(JD.cr.pc):0;
    const fx=[['Invocación (base)',2]];if(pc>0)fx.push(['Criatura '+pc+' PC',pc]);
    const fl=JD.cr?`Invoca a ${JD.cr.nm} (${JD.cr.ty.toLowerCase()}, ${JD.cr.sp}) — ${jrCrLine(JD.cr)}. 1 PK extra por turno; una sola criatura por combate.`:'Sin criatura aún: sube los PC.';
    return ['i',JD.lv,JD.el,JD.nm||'Sin nombre aún',fx,fl];
  }
  const fx=[];
  (FX[JD.ty]||[]).forEach(f=>{const q=N(JD.counts[f.id]);if(q>0)fx.push([jrLabel(JD.ty,f.id,q),N(f.c)*q])});
  return [JD.ty,JD.lv,JD.el,JD.nm||'Sin nombre aún',fx,`Técnica de ${TYN[JD.ty]} de ${ELM[JD.el][1]} creada a medida; su autor aún no ha escrito su leyenda.`];
}
function jdPrev(){const p=$('#jdPrev');if(p)p.innerHTML=jCardHTML(jdDraft())}
function jdCalc(){
  if(!$('#jdPdJ'))return;
  const spent=jdSpent(),bud=BUDG[JD.ty][JD.lv-1];
  $('#jdPdJ').textContent=spent+'/'+bud;
  $('#jdPc').textContent=JD.lv;$('#jdDif').textContent=8+JD.lv;$('#jdKi').textContent=JD.lv;
  let w='';
  if(spent>bud){
    const f=JD.ty==='a'?(s)=>6+3*(s-1):(s)=>2*s;
    let L=1;while(L<9&&f(L)<spent)L++;
    w=`Te has pasado: ${spent} PdJ no caben en nivel ${JD.lv} (${bud}).${L<=9?` Con ese gasto, sería un jutsu de nivel ${L}.`:''}`;
  }
  $('#jdWarn').textContent=w;
  jdPrev();
}
function jdFxRender(){
  const box=$('#jdFx');if(!box)return;box.innerHTML='';
  if(JD.ty==='i'){
    const pc=JD.cr?N(JD.cr.pc):0;
    const r=document.createElement('div');r.className='srow';
    r.innerHTML=`<div class="n"><b>PC de la criatura invocada</b><small>1 PC = 1 PdJ · máximo ${BUDG.i[JD.lv-1]-2} PC en nivel ${JD.lv}</small></div>
      <span class="stp"><button data-jc="-">−</button><span class="q">${pc}</span><button data-jc="+">+</button></span>
      <span class="v" style="min-width:150px;font-size:11px">${JD.cr?JD.cr.nm:'—'}</span><span class="pc">${pc} PdJ</span>`;
    box.appendChild(r);
    $$('button[data-jc]',box).forEach(b=>b.addEventListener('click',()=>{
      let pc2=N(JD.cr?JD.cr.pc:0)+(b.dataset.jc==='+'?1:-1);
      pc2=Math.max(0,Math.min(BUDG.i[JD.lv-1]-2,pc2));
      JD.cr=jrCreature(pc2);jdFxRender();jdCalc();
    }));
    return;
  }
  (FX[JD.ty]||[]).forEach(f=>{
    const q=N(JD.counts[f.id]);
    const r=document.createElement('div');r.className='srow';
    r.innerHTML=`<div class="n"><b>${f.n}</b>${f.d?`<small>${f.d}</small>`:''}</div>
      <span class="stp"><button data-jf="${f.id}" data-d="-1">−</button><span class="q">${q}</span><button data-jf="${f.id}" data-d="1">+</button></span>
      <span class="v">${N(f.c)*q}</span><span class="pc">PdJ</span>`;
    box.appendChild(r);
  });
  $$('button[data-jf]',box).forEach(b=>b.addEventListener('click',()=>{
    const f=FX[JD.ty].find(x=>x.id===b.dataset.jf);if(!f)return;
    if(+b.dataset.d>0){
      if(JD.counts[f.id]>=f.m)return;
      if(JD.ty==='p'&&(f.id==='rng'||f.id==='otr')&&JD.counts.grp>0)return;
      if(JD.ty==='p'&&f.id==='dpv'&&!JD.counts.dup)return;
      JD.counts[f.id]++;
    }else{if(JD.counts[f.id]<=0)return;JD.counts[f.id]--}
    jdFxRender();jdCalc();
  }));
}
function jpRender(){
  const g=$('#jpGrid');if(!g)return;
  g.innerHTML=MYJ.map((j,i)=>jCardHTML(j,{del:i})).join('');
  const c=$('#jpCount');
  if(c)c.textContent=MYJ.length?`Tienes ${MYJ.length} jutsu${MYJ.length>1?'s':''} guardado${MYJ.length>1?'s':''} en este navegador.`:'Aún no has guardado ningún jutsu: diseña uno arriba o genera algunos al azar.';
}

/* ---------- mazmorra ---------- */
function dg32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function dgStats(pc,R){
  const s={in:0,atm:0,dtm:0,dfm:0,dfd:0,ab:0,ck:0,pk:0,pvx:0};
  const arch=['bruto','tanque','veloz','chamán'][Math.floor(R()*4)];
  const w=MW[arch];
  const wwp=()=>{let t=0;w.forEach(x=>t+=x[1]);let r=R()*t;for(const x of w){r-=x[1];if(r<=0)return x[0]}return w[0][0]};
  let pts=Math.max(0,N(pc)),guard=0;
  while(pts>0&&guard++<999){const k=wwp();if(s[k]>=MCAP[k]){s.pvx++;pts--;continue}s[k]++;pts--}
  return {s,arch};
}
function dgLine(s){return `In +${N(s.in)} · At +${N(s.atm)} · ${dmgS(s.dtm)} · Def ${10+N(s.dfm)}/${10+N(s.dfd)} · Abs ${N(s.ab)} · PV ${20+N(s.pvx)*5}`}
function dgLineN(s){return `In +${N(s.in)} · At CC +${N(s.atm)} · ${dmgS(s.dtm)} · At Dis +${N(s.atd)} · ${dmgS(s.dtd)} · Def ${N(s.dfm)}/${N(s.dfd)} · Abs ${N(s.ab)} · PV ${N(s.pv)} · CK +${N(s.ck)} · PK ${N(s.pk)||'—'}`}
function dgJutsus(maxLv,n,el,R){
  if(typeof GRIM==='undefined'||!Array.isArray(GRIM))return [];
  let p=GRIM.filter(j=>Array.isArray(j)&&j[0]==='a'&&N(j[1])<=maxLv&&Array.isArray(j[4]));
  const pe=p.filter(j=>j[2]===el);
  const pool=(pe.length>=n?pe:p).slice();
  const out=[];
  while(out.length<n&&pool.length)out.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  return out;
}
function dgMon(pc,el,R){
  const core=MCORE[Math.floor(R()*MCORE.length)];
  const mat=MMAT[Math.floor(R()*MMAT.length)];
  const {s,arch}=dgStats(pc,R);
  const ju=arch==='chamán'?dgJutsus(Math.max(1,Math.min(4,Math.floor(N(pc)/7))),1,el,R):[];
  return {core,mat,s,arch,pc:N(pc),ju};
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function dgTheme(lvl){
  return [
    {name:'Ruinas ocupadas',desc:'bandidos, alimañas y trampas sencillas',pc:5,boss:20},
    {name:'Guarida infestada',desc:'bestias, saqueadores y guardianes',pc:10,boss:25},
    {name:'Cripta sellada',desc:'guardianes, espíritus y muertos inquietos',pc:15,boss:30},
    {name:'Fortaleza',desc:'enemigos veteranos y defensas preparadas',pc:20,boss:35},
    {name:'Corazón del sello',desc:'máxima amenaza y un jefe excepcional',pc:25,boss:40}
  ][lvl-1];
}
function dgRoomCount(size){return size<=23?12:size<=29?16:20;}
function dgCarveH(g,W,H,x1,x2,y){for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)if(x>0&&x<W-1&&y>0&&y<H-1&&g[y][x]==='#')g[y][x]=',';}
function dgCarveV(g,W,H,y1,y2,x){for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)if(x>0&&x<W-1&&y>0&&y<H-1&&g[y][x]==='#')g[y][x]=',';}
function dgMakeMap(size,R){
  const W=size,H=size,target=dgRoomCount(size),CS=24;
  for(let attempt=0;attempt<80;attempt++){
    const g=Array.from({length:H},()=>Array(W).fill('#'));
    const rooms=[];
    const hits=(x,y,w,h)=>rooms.some(r=>x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y);
    let tries=size*28;
    while(tries--&&rooms.length<target){
      const w=3+Math.floor(R()*4),h=3+Math.floor(R()*4);
      const x=1+Math.floor(R()*(W-w-2)),y=1+Math.floor(R()*(H-h-2));
      if(hits(x,y,w,h))continue;
      for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)g[yy][xx]='r';
      rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});
    }
    if(rooms.length<target)continue;
    // Minimum spanning tree: every room is reachable, then add a few loops.
    const connected=[rooms[0]],remaining=rooms.slice(1),links=[];
    while(remaining.length){
      let bi=0,bj=0,bd=Infinity;
      for(let i=0;i<remaining.length;i++)for(let j=0;j<connected.length;j++){
        const d=Math.abs(remaining[i].cx-connected[j].cx)+Math.abs(remaining[i].cy-connected[j].cy);
        if(d<bd){bd=d;bi=i;bj=j;}
      }
      const a=remaining.splice(bi,1)[0],b=connected[bj];
      connected.push(a);links.push([a,b]);
    }
    const extra=Math.max(1,Math.floor(target/5));
    for(let i=0;i<extra;i++){
      const a=rooms[Math.floor(R()*rooms.length)],b=rooms[Math.floor(R()*rooms.length)];
      if(a!==b)links.push([a,b]);
    }
    const doorCandidates=[];
    const carve=(a,b)=>{
      if(R()<.5){dgCarveH(g,W,H,a.cx,b.cx,a.cy);dgCarveV(g,W,H,a.cy,b.cy,b.cx);}
      else{dgCarveV(g,W,H,a.cy,b.cy,a.cx);dgCarveH(g,W,H,a.cx,b.cx,b.cy);}
    };
    links.forEach(([a,b])=>{
      carve(a,b);
      // First corridor cell outside each room becomes the door location.
      [[a,b],[b,a]].forEach(([from,to])=>{
        const sx=from.cx,sy=from.cy;let dx=Math.sign(to.cx-sx),dy=Math.sign(to.cy-sy);
        let x=sx,y=sy,guard=0;
        while(guard++<W+H){
          const nx=x+(dx||0),ny=y+(dy||0);
          if(nx<0||nx>=W||ny<0||ny>=H)break;
          if(g[ny][nx]===','){doorCandidates.push({x:nx,y:ny});break;}
          x=nx;y=ny;
          if(x===to.cx&&y===to.cy)break;
          // For L corridors, switch axis once we hit the corridor leg.
          if(dx&&dy&&Math.abs(to.cx-x)<1) {dx=0;}
          if(dx&&dy&&Math.abs(to.cy-y)<1) {dy=0;}
        }
      });
    });
    // Deduplicate and keep doors only where a corridor touches a room.
    const doors=[],seen=new Set();
    for(const d of doorCandidates){
      const key=d.x+','+d.y;if(seen.has(key))continue;
      const adj=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>g[d.y+dy]?.[d.x+dx]==='r');
      if(!adj.length)continue;
      seen.add(key);doors.push({x:d.x,y:d.y,dx:adj[0][0],dy:adj[0][1],secret:R()<.2});
    }
    // Fallback: if a connector did not yield a visible door, find one automatically.
    if(doors.length<Math.max(4,target-2)){
      for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
        if(g[y][x]!==',')continue;
        const adj=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>g[y+dy][x+dx]==='r');
        if(adj.length&&!seen.has(x+','+y)){seen.add(x+','+y);doors.push({x,y,dx:adj[0][0],dy:adj[0][1],secret:R()<.16});}
      }
    }
    return {W,H,CS,g,rooms,doors};
  }
  throw new Error('No se pudo construir una distribución de salas válida');
}
function dunGoRun(){
  const out=$('#dunOut');
  if(!out)return;
  const size=Math.max(23,Math.min(37,N($('#dgSize').value)||29));
  const lvl=Math.max(1,Math.min(5,N($('#dgLvl').value)||1));
  const seed=String($('#dgSeed').value||'').trim();
  let R=Math.random;
  if(seed){let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}R=dg32((h>>>0)||1)}
  const pickS=a=>Array.isArray(a)&&a.length?a[Math.floor(R()*a.length)]:'';
  try {
    const {W,H,CS,g,rooms,doors}=dgMakeMap(size,R);
    const walk=(x,y)=>x>=0&&x<W&&y>=0&&y<H&&g[y][x]!=='#';
    let ent=rooms[0];rooms.forEach(r=>{if(r.cx+r.cy<ent.cx+ent.cy)ent=r;});
    let boss=rooms.find(r=>r!==ent);let best=-1;
    rooms.forEach(r=>{if(r===ent)return;const d=Math.abs(r.cx-ent.cx)+Math.abs(r.cy-ent.cy);if(d>best){best=d;boss=r;}});
    if(!boss)throw new Error('No se pudo asignar la sala del jefe');
    const stair=(x,y)=>{if(x>0&&x<W-1&&y>0&&y<H-1&&g[y][x]!=='#'){g[y][x]='>';return true}return false};
    if(!stair(boss.cx+1,boss.cy)&&!stair(boss.cx-1,boss.cy)&&!stair(boss.cx,boss.cy+1))stair(boss.cx,boss.cy-1);
    const corr=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]===',')corr.push([x,y]);
    const traps=[];const trapN=Math.min(7,2+lvl);
    for(let i=0;i<trapN&&corr.length;i++){const c=corr.splice(Math.floor(R()*corr.length),1)[0];g[c[1]][c[0]]='*';traps.push({tr:pickS(DG_TRAP)});}
    const theme=dgTheme(lvl),lvlPC=theme.pc,bossPC=theme.boss;
    const tplPc=lvl<=2?10:lvl===3?20:30;
    const npcTpl=TPL[tplPc]||TPL[10]||[];if(!npcTpl.length)throw new Error('No hay perfiles de PNJ disponibles');
    const el=pickS(YOS)[0];const data=new Map();rooms.forEach(r=>data.set(r,{}));
    data.get(ent).kind='entrada';data.get(boss).kind='jefe';
    rooms.forEach(r=>{
      if(r===ent||r===boss)return;
      const d=data.get(r),roll=R();
      if(roll<.48)d.kind='monstruo',d.mons=[dgMon(lvlPC,el,R)].concat(R()<.35?[dgMon(lvlPC,el,R)]:[]);
      else if(roll<.62)d.kind='pnj';
      else if(roll<.75)d.kind='tesoro',d.loot=pickS(LOOT),d.guard=R()<.35?dgMon(lvlPC,el,R):null;
      else if(roll<.84)d.kind='trampa',d.tr=pickS(DG_TRAP);
      else d.kind='vacia',d.flavor=pickS(DG_EMPTY),d.statues=R()<.45?(R()<.4?2:1):0;
    });
    if(!rooms.some(r=>data.get(r).kind==='pnj')){const c=rooms.find(r=>data.get(r).kind==='vacia')||rooms.find(r=>r!==ent&&r!==boss);if(c)data.get(c).kind='pnj';}
    rooms.forEach(r=>{
      const d=data.get(r);d.stpos=[];
      if(d.statues&&r.w>=3&&r.h>=3){d.stpos.push([r.x,r.cy]);if(d.statues>1)d.stpos.push([r.x+r.w-1,r.cy]);}
      if(d.kind==='pnj'){
        const t=npcTpl[Math.floor(R()*npcTpl.length)],nm=pickS(R()<.5?NF:NM),yy=pickS(YOS);
        d.npc={an:t[0],s:t[1],nm:nm[0],mean:nm[1],yos:yy,house:pickS(HOUSES[yy[0]]),role:pickS(DG_ROLE),school:pickS(['Kage','Reikon','Shisen','Kansei']),mot:pickS(MOT),ju:lvl>=2?dgJutsus(Math.min(5,lvl),1,yy[0],R):[],pcPc:tplPc};
      }
    });
    const bossName=pickS(S1)+pickS(S2),bossTitle=pickS(TITLE),bossCore=pickS(MCORE),bossMat=pickS(MMAT);
    data.get(boss).boss={name:bossName,title:bossTitle,core:bossCore,mat:bossMat,pc:bossPC,st:dgStats(bossPC,R).s,ju:dgJutsus(Math.min(5,lvl+1),lvl>=3?2:1,el,R)};
    const others=rooms.filter(r=>r!==ent).sort((a,b)=>(a.cy-b.cy)||(a.cx-b.cx));const num=new Map();num.set(ent,1);others.forEach((r,i)=>num.set(r,i+2));
    const BLUE='#4a7ab5',NAVY='#18385f',PAPER='#fffdf3';let s=`<rect width="${W*CS}" height="${H*CS}" fill="${BLUE}"/>`;
    let grid=`<defs><pattern id="dg-grid" width="${CS}" height="${CS}" patternUnits="userSpaceOnUse"><path d="M ${CS} 0 L 0 0 0 ${CS}" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="1"/></pattern></defs><rect width="${W*CS}" height="${H*CS}" fill="url(#dg-grid)"/>`;s+=grid;
    let floor='';for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]!=='#')floor+=`<rect x="${x*CS}" y="${y*CS}" width="${CS}" height="${CS}"/>`;s+=`<g fill="${PAPER}">${floor}</g>`;
    let walls='';for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(g[y][x]==='#')continue;const X=x*CS,Y=y*CS;if(!walk(x,y-1))walls+=`<line x1="${X}" y1="${Y}" x2="${X+CS}" y2="${Y}"/>`;if(!walk(x,y+1))walls+=`<line x1="${X}" y1="${Y+CS}" x2="${X+CS}" y2="${Y+CS}"/>`;if(!walk(x-1,y))walls+=`<line x1="${X}" y1="${Y}" x2="${X}" y2="${Y+CS}"/>`;if(!walk(x+1,y))walls+=`<line x1="${X+CS}" y1="${Y}" x2="${X+CS}" y2="${Y+CS}"/>`;};s+=`<g stroke="${NAVY}" stroke-width="2.6" stroke-linecap="square">${walls}</g>`;
    let doorG='',secG='';doors.forEach(d=>{if(d.dx!==0){const x=(d.x+(d.dx>0?1:0))*CS,y1=d.y*CS+3,y2=d.y*CS+CS-3;if(d.secret)secG+=`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`;else doorG+=`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x-4}" y1="${y1}" x2="${x+4}" y2="${y1}"/><line x1="${x-4}" y1="${y2}" x2="${x+4}" y2="${y2}"/>`;}else{const y=(d.y+(d.dy>0?1:0))*CS,x1=d.x*CS+3,x2=d.x*CS+CS-3;if(d.secret)secG+=`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;else doorG+=`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y-4}" x2="${x1}" y2="${y+4}"/><line x1="${x2}" y1="${y-4}" x2="${x2}" y2="${y+4}"/>`;}});s+=`<g stroke="${NAVY}" stroke-width="3">${doorG}</g><g stroke="${NAVY}" stroke-width="2.4" stroke-dasharray="4 3">${secG}</g>`;
    let stat='';rooms.forEach(r=>(data.get(r).stpos||[]).forEach(p=>{const cx=p[0]*CS+CS/2,cy=p[1]*CS+CS/2;stat+=`<circle cx="${cx}" cy="${cy-5}" r="3.2" fill="${NAVY}"/><rect x="${cx-3.5}" y="${cy-1}" width="7" height="6" fill="${NAVY}"/><line x1="${cx-5.5}" y1="${cy+6.5}" x2="${cx+5.5}" y2="${cy+6.5}" stroke="${NAVY}" stroke-width="1.6"/>`}));s+=stat;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]==='>'){const X=x*CS,Y=y*CS;s+=`<g stroke="${NAVY}" stroke-width="1.8"><line x1="${X+5}" y1="${Y+7}" x2="${X+CS-5}" y2="${Y+7}"/><line x1="${X+7}" y1="${Y+12}" x2="${X+CS-7}" y2="${Y+12}"/><line x1="${X+9}" y1="${Y+17}" x2="${X+CS-9}" y2="${Y+17}"/></g>`;}
    let trap='';for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]==='*'){const cx=x*CS+CS/2,cy=y*CS+CS/2;trap+=`<line x1="${cx-4.5}" y1="${cy-4.5}" x2="${cx+4.5}" y2="${cy+4.5}"/><line x1="${cx-4.5}" y1="${cy+4.5}" x2="${cx+4.5}" y2="${cy-4.5}"/>`;}s+=`<g stroke="${NAVY}" stroke-width="2">${trap}</g>`;
    let nums='';rooms.forEach(r=>{nums+=`<text x="${r.cx*CS+CS/2}" y="${r.cy*CS+CS/2+4.5}" text-anchor="middle" font-family="sans-serif" font-size="12.5" font-weight="700" fill="${NAVY}">${num.get(r)}</text>`;});s+=nums;
    const ecx=ent.cx*CS+CS/2,ecy=ent.cy*CS+CS/2;s+=`<line x1="5" y1="${ecy}" x2="${Math.max(16,ecx-10)}" y2="${ecy}" stroke="${NAVY}" stroke-width="3"/><polygon points="${Math.max(16,ecx-8)},${ecy-5.5} ${Math.max(26,ecx+2)},${ecy} ${Math.max(16,ecx-8)},${ecy+5.5}" fill="${NAVY}"/>`;
    const rows=[['door','Puerta'],['secret','Puerta secreta'],['stairs','Escaleras'],['statue','Estatua'],['trap','Trampa'],['arrow','Entrada']],LW=142,LH=rows.length*17+16,LX=W*CS-LW-10,LY=10;let lg=`<rect x="${LX}" y="${LY}" width="${LW}" height="${LH}" rx="5" fill="${PAPER}" stroke="${NAVY}" stroke-width="1.8"/>`;rows.forEach((r,i)=>{const y=LY+16+i*17,ix=LX+10,tx=LX+36;let icon='';if(r[0]==='door')icon=`<line x1="${ix+5}" y1="${y-6}" x2="${ix+5}" y2="${y+2}" stroke="${NAVY}" stroke-width="2.6"/><line x1="${ix+1}" y1="${y-6}" x2="${ix+9}" y2="${y-6}" stroke="${NAVY}" stroke-width="2"/><line x1="${ix+1}" y1="${y+2}" x2="${ix+9}" y2="${y+2}" stroke="${NAVY}" stroke-width="2"/>`;if(r[0]==='secret')icon=`<line x1="${ix}" y1="${y-2}" x2="${ix+11}" y2="${y-2}" stroke="${NAVY}" stroke-width="2" stroke-dasharray="3 2.5"/>`;if(r[0]==='stairs')icon=`<path d="M${ix} ${y-5}h11M${ix+2} ${y-2}h7M${ix+4} ${y+1}h3" fill="none" stroke="${NAVY}" stroke-width="1.6"/>`;if(r[0]==='statue')icon=`<circle cx="${ix+5.5}" cy="${y-4}" r="2.6" fill="${NAVY}"/><rect x="${ix+3}" y="${y-1}" width="5" height="4.5" fill="${NAVY}"/>`;if(r[0]==='trap')icon=`<path d="m${ix+1} ${y-6} 9 8m0-8-9 8" stroke="${NAVY}" stroke-width="1.8"/>`;if(r[0]==='arrow')icon=`<path d="M${ix} ${y-2}h7l-2-3m2 3-2 3" fill="none" stroke="${NAVY}" stroke-width="2.2"/>`;lg+=icon+`<text x="${tx}" y="${y+2.5}" font-family="sans-serif" font-size="10.5" fill="${NAVY}">${r[1]}</text>`;});s+=lg;s+=`<text x="10" y="${H*CS-10}" font-family="sans-serif" font-size="10.5" fill="${PAPER}" font-weight="600">1 casilla ≈ 3 m · ${esc(theme.name)}</text><rect x="1.5" y="1.5" width="${W*CS-3}" height="${H*CS-3}" fill="none" stroke="${NAVY}" stroke-width="3" pointer-events="none"/>`;
    const mapSvg=`<svg class="dsvg" viewBox="0 0 ${W*CS} ${H*CS}" role="img" aria-label="Mapa de la mazmorra en papel cuadriculado azul">${s}</svg>`;
    const compass=(a,b)=>{const dx=b.cx-a.cx,dy=b.cy-a.cy,ns=dy<-1?'norte':dy>1?'sur':null,ew=dx>1?'este':dx<-1?'oeste':null;if(ns&&ew)return 'al '+(ns==='norte'?'nor':'sur')+ew;if(ns)return 'al '+ns;if(ew)return 'al '+ew;return 'junto a la entrada';};
    let list='';[ent,...others].forEach(r=>{const d=data.get(r),n=num.get(r),pos=compass(ent,r);let body='';if(d.kind==='entrada')body='Los Senshi descienden hasta una sala de piedra seca. Desde aquí, todo está por descubrir.';else if(d.kind==='jefe'){const b=d.boss;body=`<b>${esc(b.name)}, ${esc(b.title)}</b> — ${esc(b.core[2])} (${esc(b.core[1])}) · ${b.pc} PC<br>${dgLine(b.st)}${b.ju.map(j=>jutsuLine(j)).join('')}La escalera al siguiente sótano aguarda tras el sello.`;}else if(d.kind==='monstruo')body=d.mons.map(m=>`<b>${esc(m.core[0])} ${esc(m.mat)}</b> — ${esc(m.core[2])} (${esc(m.core[1])}) · ${m.pc} PC · ${esc(m.arch)}<br>${dgLine(m.s)}${m.ju?.length?jutsuLine(m.ju[0]):''}`).join('<br>');else if(d.kind==='pnj'){const n2=d.npc;body=`<b>${esc(n2.nm)}</b> (${esc(n2.mean)}) — ${esc(n2.role)} · ${esc(n2.yos[1])} · Kazoku ${esc(n2.house)}<br>${esc(n2.an)} (${n2.pcPc} PC) · Escuela ${esc(n2.school)}<br>${dgLineN(n2.s)}${n2.ju?.length?jutsuLine(n2.ju[0]):''}<i>Motivación: ${esc(n2.mot)}.</i>`;}else if(d.kind==='tesoro')body=`${d.guard?`<b>Guardián:</b> ${esc(d.guard.core[0])} ${esc(d.guard.mat)} (${esc(d.guard.core[2])}) · ${d.guard.pc} PC<br>${dgLine(d.guard.s)}<br>`:''}<b>Tesoro:</b> ${esc(d.loot)}`;else if(d.kind==='trampa')body=`<b>Trampa:</b> ${esc(d.tr.n)} (Detectar Dif ${d.tr.d}) — ${esc(d.tr.e)}`;else body=`${d.statues?`<b>${d.statues===2?'Dos estatuas sin rostro vigilan la sala':'Una estatua sin rostro vigila la sala'}</b> (en el mapa). `:''}Parece vacía: ${esc(d.flavor)}.`;const tag=d.kind==='entrada'?' · ENTRADA':d.kind==='jefe'?' · SALA DEL JEFE':'';list+=`<div class="gjs"><b>Sala ${n} — ${pos}${tag}</b><br>${body}</div>`;});
    const trapHtml=traps.length?`<p class="gline section-kicker"><b>Trampas de pasillo</b> (marcadas con ×)</p>`+traps.map(t=>`<div class="gjs"><b>${esc(t.tr.n)}</b> (Detectar Dif ${t.tr.d}) — ${esc(t.tr.e)}</div>`).join(''):'';
    const secretN=doors.filter(d=>d.secret).length,dname=`${pickS(DG_PLACE)} ${pickS(DG_EPIT)}`;
    out.innerHTML=`<h4>${esc(dname)}</h4><p class="gsub">${esc(theme.name)} · ${W}×${H} · ${rooms.length} salas · ${doors.length} puertas (${secretN} secretas) · sello ${ELM[el][0]} ${ELM[el][1]} · ${seed?`semilla «${esc(seed)}»`:'sin semilla'}</p><div class="dg-note"><b>${esc(theme.name)}</b>: ${esc(theme.desc)}. Nivel ${lvl} de 5.</div>${mapSvg}<p class="gline section-kicker"><b>Clave de salas</b> — los números corresponden al mapa</p>${list}${trapHtml}<p class="gline section-kicker"><b>Encuentros errantes:</b> tira 3d6 al explorar un pasillo nuevo o hacer ruido; con 9 o menos aparece un monstruo errante de ${lvlPC} PC.</p><p class="gline gfootnote">Monstruos, PNJ y jutsu se generan con los datos integrados; el jefe guarda la escalera al siguiente sótano.</p>`;
  } catch(err) {
    console.error('Error generando mazmorra', err, {size,lvl,seed});
    out.innerHTML='<div class="gen-error"><b>No se pudo generar esta mazmorra.</b><br>El generador ha intentado construir un mapa válido y ha fallado. Prueba otra semilla. Si vuelve a ocurrir, revisa la consola.</div>';
  }
}
/* ================= ARRANQUE CONDICIONADO POR PÁGINA ================= */
(function(){
  /* cap02: mapa */
  if($('.map .lm')) $$('.map .lm').forEach(l=>l.addEventListener('click',()=>{
    const t=$('#'+l.dataset.target); if(!t)return;
    t.scrollIntoView({behavior:'smooth',block:'center'});
    t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash');
  }));
  /* cap03: pirámide */
  if($('#pyrLayers')){
    const layers=$$('#pyrLayers .layer'),pleg=$$('#pleg li');
    const pOn=i=>{layers.forEach(l=>l.classList.toggle('on',l.dataset.i==String(i)));pleg.forEach(li=>li.classList.toggle('on',li.dataset.i==String(i)));};
    layers.forEach(l=>{l.addEventListener('mouseenter',()=>pOn(l.dataset.i));l.addEventListener('mouseleave',()=>pOn(-1));});
    pleg.forEach(li=>{li.addEventListener('mouseenter',()=>pOn(li.dataset.i));li.addEventListener('mouseleave',()=>pOn(-1));});
  }
  /* cap04: casas */
  if($('#kzTabs')){
    $$('#kzTabs button').forEach(b=>b.addEventListener('click',()=>{
      $$('#kzTabs button').forEach(x=>x.classList.toggle('on',x===b));
      $$('.kz-panel').forEach(p=>p.classList.toggle('on',p.id===b.dataset.p));
    }));
    $('#kzFilter').addEventListener('input',e=>{
      const q=e.target.value.toLowerCase();
      $$('.kz-panel .chip').forEach(c=>{c.style.display=c.textContent.toLowerCase().includes(q)?'':'none'});
    });
  }
  /* cap09: dados */
  if($('#d1')){
    const PIPS={1:[4],2:[2,6],3:[2,4,6],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
    const face=(el,v)=>$$('.p',el).forEach((p,i)=>p.classList.toggle('on',PIPS[v].includes(i)));
    ['d1','d2','d3'].forEach(id=>{const d=$('#'+id);d.setAttribute('role','img');d.setAttribute('aria-label','dado 3');for(let i=0;i<9;i++){const p=document.createElement('span');p.className='p';d.appendChild(p);}face(d,3);});
    const PIPoff=el=>{const on=$$('.p',el).map((p,i)=>p.classList.contains('on')?i:-1).filter(i=>i>=0);
      for(const k in PIPS){if(PIPS[k].length===on.length&&PIPS[k].every((v,i)=>v===on[i]))return +k;}return 1;};
    const dice=[$('#d1'),$('#d2'),$('#d3')];
    $('#btnRoll').addEventListener('click',()=>{
      const out=$('#dOut'),btn=$('#btnRoll');btn.disabled=true;let t=0;
      dice.forEach(d=>d.classList.add('rolling'));
      const iv=setInterval(()=>{
        dice.forEach(d=>face(d,1+Math.floor(Math.random()*6)));
        if(++t>=9){clearInterval(iv);dice.forEach(d=>d.classList.remove('rolling'));
          const v=dice.map(d=>PIPoff(d)); const sum=v[0]+v[1]+v[2];
          const mod=N($('#dMod').value)||0, dif=N($('#dDif').value)||10, tot=sum+mod;
          let ex='';
          if(sum<=3)ex=' <span class="ko">¡Pifia!</span>';
          else if(sum>=16)ex=' <span class="ok">¡Crítico!</span>';
          const ok=tot>=dif;
          out.innerHTML=`Dados: <b>${v.join(' + ')}</b> → <b>${sum}</b>${mod?(mod>0?' + '+mod:' − '+Math.abs(mod)):''} = <b>${tot}</b> contra <b>${dif}</b> → <span class="${ok?'ok':'ko'}">${ok?'¡ÉXITO!':'FALLO'}</span>.${ex}`;
          btn.disabled=false;
        }
      },90);
    });
  }
  /* cap10: taller */
  if($('#jLvlRow')){
    renderFx();jcalc();
    $('#jLvlNote').textContent='base 6 PdJ +3 por nivel';
    $$('input[name=jtype]').forEach(r=>r.addEventListener('change',()=>{
      jt=r.value;jq={};
      $('#jLvlRow').style.display=jt==='inv'?'none':'flex';
      $('#jInvRow').style.display=jt==='inv'?'flex':'none';
      $('#jLvlNote').textContent=jt==='atk'?'base 6 PdJ +3 por nivel':'base 2 PdJ +2 por nivel';
      renderFx();jcalc();
    }));
    $('#jLvlRow').addEventListener('click',e=>{const b=e.target.closest('button[data-l]');if(!b)return;
      jLvlV=Math.max(1,Math.min(9,jLvlV+ +b.dataset.l));$('#jLvl').textContent=jLvlV;jcalc();});
    $('#jInvRow').addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;
      invPC=Math.max(0,Math.min(60,invPC+ +b.dataset.i));$('#jInvPC').textContent=invPC;jcalc();});
  }
  /* cap11: grimorio + filtros */
  if($('#grGrid')){
    grRender();
    $$('#grTabs button').forEach(b=>b.addEventListener('click',()=>{$$('#grTabs button').forEach(x=>x.classList.toggle('on',x===b));grS.ty=b.dataset.t;grRender();}));
    $$('#grLv button').forEach(b=>b.addEventListener('click',()=>{$$('#grLv button').forEach(x=>x.classList.toggle('on',x===b));grS.lv=+b.dataset.l;grRender();}));
    $$('#grEl button').forEach(b=>b.addEventListener('click',()=>{$$('#grEl button').forEach(x=>x.classList.toggle('on',x===b));grS.el=b.dataset.e;grRender();}));
    $('#grQ').addEventListener('input',e=>{grS.q=e.target.value;grRender();});
  }
  /* cap11: diseñador de jutsu */
  if($('#jdFx')){
    jdFxRender();jdCalc();
    $('#jdTy').addEventListener('change',e=>{JD.ty=e.target.value;JD.counts={};if(JD.ty==='i'&&!JD.cr)JD.cr=jrCreature(0);jdFxRender();jdCalc()});
    $('#jdLv').addEventListener('change',e=>{JD.lv=N(e.target.value)||1;if(JD.ty==='i'&&JD.cr&&JD.cr.pc>BUDG.i[JD.lv-1]-2)JD.cr=jrCreature(BUDG.i[JD.lv-1]-2);jdFxRender();jdCalc()});
    $('#jdEl').addEventListener('change',e=>{JD.el=e.target.value;jdCalc()});
    $('#jdNm').addEventListener('input',e=>{JD.nm=e.target.value;jdPrev()});
    $('#jdDice').addEventListener('click',()=>{JD.nm=jdName(JD.ty,JD.el);$('#jdNm').value=JD.nm;jdPrev()});
    $('#jdSave').addEventListener('click',()=>{
      const spent=jdSpent(),bud=BUDG[JD.ty][JD.lv-1];
      if(spent>bud){$('#jdWarn').textContent=`No se puede guardar: gasta ${spent} PdJ y el nivel ${JD.lv} admite ${bud}.`;return}
      const d=jdDraft();
      if(!JD.nm){JD.nm=jdName(JD.ty,JD.el);$('#jdNm').value=JD.nm;d[3]=JD.nm}
      MYJ.push(d);jSaveLS();jpRender();
      const b=$('#jdSave');b.textContent='✓ Guardado';setTimeout(()=>b.textContent='Guardar en mi grimorio',1600);
    });
  }
  /* cap11: generador aleatorio de jutsu */
  if($('#jrGo')){
    $('#jrGo').addEventListener('click',()=>{
      const tyS=$('#jrTy').value;
      const ty=tyS==='any'?pick(['a','p','i']):tyS;
      let lv=N($('#jrLv').value);if(!lv)lv=1+rnd(5);
      const elS=$('#jrEl').value;
      const el=elS==='any'?pick(YOS)[0]:elS;
      const n=Math.max(1,Math.min(6,N($('#jrN').value)||1));
      const names=new Set();const cards=[];
      for(let i=0;i<n;i++){
        let j=jrMake(ty,lv,el),g=0;
        while(names.has(j[3])&&g++<9)j=jrMake(ty,lv,el);
        names.add(j[3]);cards.push(j);
      }
      $('#jrMsg').textContent=`${n} jutsu${n>1?'s':''} · ${TYN[ty]} · nivel ${lv} · ${ELM[el][1]} ${ELM[el][0]} — cada uno gasta exactamente su presupuesto de PdJ.`;
      $('#jrOut').innerHTML=cards.map(j=>jCardHTML(j,{save:true})).join('');
    });
    $('#jrOut').addEventListener('click',e=>{
      const b=e.target.closest('[data-jsave]');if(!b||b.disabled)return;
      try{
        MYJ.push(JSON.parse(decodeURIComponent(b.dataset.jsave)));jSaveLS();jpRender();
        b.textContent='✓ En tu grimorio';b.disabled=true;
      }catch(err){}
    });
  }
  /* cap11: grimorio personal */
  if($('#jpGrid')){
    $('#jpGrid').addEventListener('click',e=>{
      const b=e.target.closest('[data-jdel]');if(!b)return;
      MYJ.splice(N(b.dataset.jdel),1);jSaveLS();jpRender();
    });
    jpRender();
  }
  /* cap14: bestiario + monstruos */
  if($('#beTable')){
    beFilter();
    $$('#beLv button').forEach(b=>b.addEventListener('click',()=>{$$('#beLv button').forEach(x=>x.classList.toggle('on',x===b));beS.lv=+b.dataset.l;beFilter();}));
    $$('#beEl button').forEach(b=>b.addEventListener('click',()=>{$$('#beEl button').forEach(x=>x.classList.toggle('on',x===b));beS.el=b.dataset.e;beFilter();}));
    const beQ=$('#beQ');if(beQ)beQ.addEventListener('input',e=>{beS.q=e.target.value;beFilter();});
  }
  if($('#monGo')) $('#monGo').addEventListener('click',()=>{
    const pc=N($('#monPc').value)||10;
    const ev=$('#monEl').value;
    const el=ev==='any'?pick(YOS)[0]:ev;
    const [cjp,csp,ctype]=pick(MCORE);
    let name;
    if(pc<=10){name=`${cjp} ${pick(MMAT)}`}
    else if(pc===20){name=`${cjp} ${pick(MPLACE)}`}
    else{name=`${pick(S1)+pick(S2)}, ${pick(TITLE)}`}
    const size=pc<=5?pick(['pequeño','mediano']):pc<=10?pick(['mediano','mediano','grande']):pc<=20?pick(['mediano','grande']):pc<=30?'grande':pick(['grande','colosal']);
    const arch=pc<10?pick(['bruto','veloz','tanque']):pick(['bruto','tanque','veloz','chamán']);
    let ju=[];
    if(arch==='chamán'||(pc>=20&&Math.random()<.35)){
      const n=pc>=30?2:1;
      const lvmax=pc<=5?1:pc<=10?2:pc<=30?3:4;
      ju=pickJutsus(lvmax,n,el,'a');
    }
    const juPC=ju.reduce((a,j)=>a+N(j[1]),0);
    let pts=Math.max(0,pc-juPC);
    const s={in:0,atm:0,dtm:0,dfm:0,dfd:0,ab:0,ck:0,pk:0,pvx:0};
    const w=MW[arch];
    while(pts>0){
      const k=wpick(w);
      if(s[k]>=MCAP[k]){s.pvx++;pts--;continue;}
      s[k]++;pts--;
    }
    if(ju.length&&s.pk===0)s.pk=1;
    const col=ELC[el];
    const traits=pickN(MTRT,pc>=20?2:1);
    $('#monOut').innerHTML=`
      <h4>${name}</h4>
      <p class="gsub">${ctype} (${csp}) · ${ELM[el][1]} ${ELM[el][0]} · Tamaño ${size} · Amenaza ${THREAT[pc]} (${pc} PC)</p>
      <table class="tb" style="--c:${col};margin-top:6px">
        <tr><th>In</th><th>At CC</th><th>Daño CC</th><th>Def CC</th><th>Def Dis</th><th>Abs</th><th>PV</th>${(s.ck||s.pk)?'<th>CK</th><th>PK</th>':''}</tr>
        <tr><td>+${N(s.in)}</td><td>+${N(s.atm)}</td><td>${dmgS(s.dtm)}</td><td>${10+N(s.dfm)}</td><td>${10+N(s.dfd)}</td><td>${N(s.ab)}</td><td>${20+N(s.pvx)*5}</td>${(s.ck||s.pk)?`<td>+${N(s.ck)}</td><td>${N(s.pk)*5||'—'}</td>`:''}</tr>
      </table>
      ${ju.length?`<p class="gline" style="margin:2px 0 0"><b>Poderes:</b></p>${ju.map(jutsuLine).join('')}`:''}
      <p class="gline"><b>Rasgos:</b> ${traits.join(' · ')}.</p>
      <p class="gline"><b>Comportamiento:</b> ${pick(MCOM)}.</p>
      <p class="gline"><b>Botín:</b> ${pick(LOOT)}.</p>
      <p class="gline"><b>Si nadie lo detiene:</b> ${pick(CONS)}.</p>
      <p class="gline" style="font-size:11px;color:#8a8271;margin-top:10px">Construida con las reglas de invocación: PC en características y jutsu sobre el perfil base. Ajusta libremente como DJ.</p>`;
  });
  /* cap13: PNJ */
  if($('#pnjGo')) $('#pnjGo').addEventListener('click',()=>{
    const pc=N($('#pnjPc').value)||10;
    const yv=$('#pnjYos').value;
    const yos=yv==='any'?pick(YOS):YOS.find(y=>y[0]===yv);
    const female=Math.random()<.5;
    const [nm,mean]=pick(female?NF:NM);
    const house=pick(HOUSES[yos[0]]);
    const school=pick(['Kage','Reikon','Shisen','Kansei']);
    const [an,s]=pick(TPL[pc]||TPL[10]);
    const pool=school==='Kansei'?[...SKP.Kage,...SKP.Reikon,...SKP.Shisen]:SKP[school];
    const skills=pickN(pool,3+rnd(2)).map(k=>`${k} ${1+rnd(2)}`).join(', ');
    const maxLv=pc===10?2:3;
    const js=N(s.ju)>0?pickJutsus(maxLv,N(s.ju),yos[0]).map(jutsuLine).join(''):'<div class="gjs"><i>Sin jutsu: su fuerza es la espada.</i></div>';
    const col=ELC[yos[0]];
    $('#pnjOut').innerHTML=`
      <h4>${nm} <small style="font:400 13px var(--fb);color:#6f6350">(${mean})</small></h4>
      <p class="gsub">${yos[1]} · Kazoku ${house} · Escuela ${school} · ${an} (${pc} PC)</p>
      <table class="tb" style="--c:${col};margin-top:6px">
        <tr><th>In</th><th>At CC</th><th>Daño CC</th><th>At Dis</th><th>Daño Dis</th><th>Def CC</th><th>Def Dis</th><th>Abs</th><th>PV</th><th>CK</th><th>PK</th></tr>
        <tr><td>+${N(s.in)}</td><td>+${N(s.atm)}</td><td>${dmgS(s.dtm)}</td><td>+${N(s.atd)}</td><td>${dmgS(s.dtd)}</td><td>${N(s.dfm)}</td><td>${N(s.dfd)}</td><td>${N(s.ab)}</td><td>${N(s.pv)}</td><td>+${N(s.ck)}</td><td>${N(s.pk)||'—'}</td></tr>
      </table>
      <p class="gline"><b>Habilidades:</b> ${skills}</p>
      <p class="gline" style="margin:4px 0 0"><b>Jutsu:</b></p>${js}
      <p class="gline"><b>Rasgo:</b> ${pick(QK)}.</p>
      <p class="gline"><b>Motivación:</b> ${pick(MOT)}.</p>
      <p class="gline"><b>Secreto (solo el DJ):</b> ${pick(SEC)}.</p>`;
  });
  /* cap16: mazmorras */
  if($('#dunGo')) $('#dunGo').addEventListener('click',dunGoRun);
  /* cap08: constructor */
  if($('#bStats')){
    renderStats();renderAdv();renderSkills();renderJut();calc();
    $('#bAddJ').addEventListener('click',()=>{if(jut.length>=6)return;jut.push({n:'',lv:1});renderJut();calc();});
    const expJ=$('#bExportJSON'), expP=$('#bExportPDF');
    if(expJ) expJ.addEventListener('click',()=>{
      const data={name:$('#bName')?.value||'',kazoku:$('#bKaz')?.value||'',concept:$('#bCon')?.value||'',budget,stats:st,adv,pk,ki,jut,skills:skl};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(data.name||'senshi')+'.json'; a.click();
    });
    if(expP) expP.addEventListener('click',()=>window.print());
    $('#bKi').addEventListener('change',e=>{ki=e.target.value;pk=0;$('#bKiRow').style.display=ki==='none'?'none':'flex';
      $('#bKiLabel').textContent=ki==='mana'?'Puntos de Ki (Maná · 1 PC = +5 PK)':'Rabia (1 PC = +1)';updKi();calc();});
    $('#bKiRow').addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b)return;
      if(ki==='mana')pk=Math.max(0,Math.min(60,N(pk)+5*(b.dataset.a==='+'?1:-1)));
      else pk=Math.max(0,Math.min(lim(),N(pk)+(b.dataset.a==='+'?1:-1)));
      updKi();calc();});
    $('#bBudget').addEventListener('change',e=>{budget=N(e.target.value)||10;calc();});
    $$('.bld-bar [data-tpl]').forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.tpl;
      resetStats();resetSkills();adv={};ki='none';pk=0;jut=[];
      const T={tanque:{ini:0,atme:1,dame:1,defme:11,defdi:11,atdi:0,dadi:0,abs:3,pv:35,ck:0},
        dpsme:{ini:3,atme:3,dame:3,defme:10,defdi:10,atdi:0,dadi:0,abs:0,pv:25,ck:0},
        equi:{ini:2,atme:2,dame:2,defme:12,defdi:10,atdi:0,dadi:0,abs:1,pv:25,ck:0},
        cura:{ini:0,atme:0,dame:0,defme:10,defdi:10,atdi:0,dadi:0,abs:1,pv:30,ck:2}}[k];
      if(T){Object.assign(st,T);if(k==='cura'){ki='mana';pk=15;jut=[{n:'Curación',lv:2}];}}
      $('#bKi').value=ki;$('#bKiRow').style.display=ki==='none'?'none':'flex';
      $('#bKiLabel').textContent=ki==='mana'?'Puntos de Ki (Maná · 1 PC = +5 PK)':'Rabia (1 PC = +1)';
      renderStats();renderAdv();renderSkills();renderJut();updKi();calc();
    }));
  }
  /* cap08: generador de Senshi */
  if($('#sgGo')){
    $('#sgGo').addEventListener('click',runSG2);
    $('#sgOut').addEventListener('click',e=>{
      if(e.target.id!=='sgLoad'||!SG_LAST)return;
      const c=SG_LAST,s=c.s;
      budget=N(c.b)||10;$('#bBudget').value=String(budget);
      resetStats();resetSkills();adv={};jut=[];
      st.ini=N(s.in);st.atme=N(s.atm);st.dame=N(s.dtm);st.atdi=N(s.atd);st.dadi=N(s.dtd);
      st.defme=10+N(s.dfm);st.defdi=10+N(s.dfd);st.abs=N(s.ab);st.pv=20+N(s.pvx)*5;st.ck=N(s.ck);
      jut=c.jutsus.map(g=>({n:g[3],lv:N(g[1])||1}));
      Object.assign(skl,c.gskl);
      (c.advPicks||[]).forEach(a=>adv[a.id]=true);
      ki=N(s.pk)>0?'mana':'none';pk=N(s.pk)*5;
      $('#bName').value=c.nm;$('#bKaz').value=`${c.house} (${c.yos[1]})`;$('#bCon').value=c.concept;
      $('#bKi').value=ki;$('#bKiRow').style.display=ki==='none'?'none':'flex';
      $('#bKiLabel').textContent='Puntos de Ki (Maná · 1 PC = +5 PK)';
      renderStats();renderAdv();renderSkills();renderJut();updKi();calc();
      $('#builder').scrollIntoView({behavior:'smooth',block:'start'});
    });
    /* llegada desde index con ?gen=1 */
    if(new URLSearchParams(location.search).get('gen')) runSG2();
  }
})();
})();