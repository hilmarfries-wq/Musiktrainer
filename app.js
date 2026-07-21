const NOTES=[{"id": "c2", "name": "c", "oct": 2, "label": "c", "midi": 36}, {"id": "d2", "name": "d", "oct": 2, "label": "d", "midi": 38}, {"id": "e2", "name": "e", "oct": 2, "label": "e", "midi": 40}, {"id": "f2", "name": "f", "oct": 2, "label": "f", "midi": 41}, {"id": "g2", "name": "g", "oct": 2, "label": "g", "midi": 43}, {"id": "a2", "name": "a", "oct": 2, "label": "a", "midi": 45}, {"id": "h2", "name": "h", "oct": 2, "label": "h", "midi": 47}, {"id": "c3", "name": "c", "oct": 3, "label": "c¹", "midi": 48}, {"id": "d3", "name": "d", "oct": 3, "label": "d¹", "midi": 50}, {"id": "e3", "name": "e", "oct": 3, "label": "e¹", "midi": 52}, {"id": "f3", "name": "f", "oct": 3, "label": "f¹", "midi": 53}, {"id": "g3", "name": "g", "oct": 3, "label": "g¹", "midi": 55}, {"id": "a3", "name": "a", "oct": 3, "label": "a¹", "midi": 57}, {"id": "h3", "name": "h", "oct": 3, "label": "h¹", "midi": 59}, {"id": "c4", "name": "c", "oct": 4, "label": "c²", "midi": 60}, {"id": "d4", "name": "d", "oct": 4, "label": "d²", "midi": 62}, {"id": "e4", "name": "e", "oct": 4, "label": "e²", "midi": 64}, {"id": "f4", "name": "f", "oct": 4, "label": "f²", "midi": 65}, {"id": "g4", "name": "g", "oct": 4, "label": "g²", "midi": 67}, {"id": "a4", "name": "a", "oct": 4, "label": "a²", "midi": 69}, {"id": "h4", "name": "h", "oct": 4, "label": "h²", "midi": 71}, {"id": "c5", "name": "c", "oct": 5, "label": "c³", "midi": 72}, {"id": "d5", "name": "d", "oct": 5, "label": "d³", "midi": 74}, {"id": "e5", "name": "e", "oct": 5, "label": "e³", "midi": 76}, {"id": "f5", "name": "f", "oct": 5, "label": "f³", "midi": 77}, {"id": "g5", "name": "g", "oct": 5, "label": "g³", "midi": 79}];
const APP_CONFIG=window.MUSIKTRAINER_CONFIG||{};
const STORAGE_KEY="musiktrainer_webapp_results",WEAK_KEY="musiktrainer_webapp_weak";
const TEACHER_PIN=APP_CONFIG.teacherPin||"2000";
const CLASS_KEY="musiktrainer_v30_classes",TEMPLATE_KEY="musiktrainer_v30_templates";
let selectedModule="pitch",queue=[],index=0,score=0,startedAt=0,mistakes=[],locked=false,currentAudio=null,audioCtx=null,lockedConfig=null,deferredAnswers=[];
const $=id=>document.getElementById(id),shuffle=a=>[...a].sort(()=>Math.random()-.5);

document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.panel).classList.add("active")});
document.querySelectorAll(".module").forEach(m=>m.onclick=()=>{document.querySelectorAll(".module").forEach(x=>x.classList.remove("active"));m.classList.add("active");selectedModule=m.dataset.module;$("clefField").style.display=selectedModule==="pitch"?"block":"none";$("earTypeField").style.display=selectedModule==="ear"?"block":"none"});

function grade(p){return p>=90?"1":p>=80?"2":p>=65?"3":p>=50?"4":p>=30?"5":"6"}
function fmt(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function getResults(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return[]}}
function saveResult(r){const d=getResults();d.push(r);localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}
function getWeak(){try{return JSON.parse(localStorage.getItem(WEAK_KEY))||{}}catch{return{}}}
function bumpWeak(key){const w=getWeak();w[key]=(w[key]||0)+1;localStorage.setItem(WEAK_KEY,JSON.stringify(w))}
function moduleName(m){return m==="pitch"?"Notenlesen":m==="rhythm"?"Rhythmus":m==="interval"?"Intervalle":"Gehörbildung"}

const CLEFS={
treble:{name:"Violinschlüssel",glyph:"𝄞",glyphX:105,glyphY:151,refMidi:64},
bass:{name:"Bassschlüssel",glyph:"𝄢",glyphX:115,glyphY:144,refMidi:43},
alto:{name:"Altschlüssel",glyph:"𝄡",glyphX:112,glyphY:146,refMidi:60},
tenor:{name:"Tenorschlüssel",glyph:"𝄡",glyphX:112,glyphY:126,refMidi:57}
};

function staffStep(note,clef){return (note.midi-CLEFS[clef].refMidi)/1}
function drawStaff(items,clef){
 const c=CLEFS[clef];
 const width=620,height=220;
 const lineGap=18,top=72;
 const lines=[0,1,2,3,4].map(i=>top+i*lineGap);
 const noteStart=310;
 const clefLayout={
  treble:{x:82,y:159,size:118},
  bass:{x:89,y:132,size:82},
  alto:{x:86,y:145,size:101},
  tenor:{x:86,y:127,size:101}
 };
 const cl=clefLayout[clef]||clefLayout.treble;

 const noteHtml=items.map((n,i)=>{
  const x=noteStart+i*92;
  const y=lines[4]-(n.diatonicOffset||0)*(lineGap/2);
  let ledger="";
  if(y<lines[0]){
   for(let ly=lines[0]-lineGap;ly>=y-2;ly-=lineGap)
    ledger+=`<line x1="${x-29}" y1="${ly}" x2="${x+29}" y2="${ly}" stroke="#182033" stroke-width="3"/>`;
  }
  if(y>lines[4]){
   for(let ly=lines[4]+lineGap;ly<=y+2;ly+=lineGap)
    ledger+=`<line x1="${x-29}" y1="${ly}" x2="${x+29}" y2="${ly}" stroke="#182033" stroke-width="3"/>`;
  }
  const stemUp=y>=lines[2];
  const stem=stemUp
   ? `<line x1="${x+16}" y1="${y-2}" x2="${x+16}" y2="${y-62}" stroke="#182033" stroke-width="4"/>`
   : `<line x1="${x-16}" y1="${y+2}" x2="${x-16}" y2="${y+62}" stroke="#182033" stroke-width="4"/>`;
  return `${ledger}<ellipse cx="${x}" cy="${y}" rx="17" ry="11.5" transform="rotate(-18 ${x} ${y})" fill="#182033"/>${stem}`;
 }).join("");

 return `<svg class="staff-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Notensystem mit ${c.name}">
 <rect x="1" y="1" width="${width-2}" height="${height-2}" rx="18" fill="#fff"/>
 ${lines.map(y=>`<line x1="116" y1="${y}" x2="560" y2="${y}" stroke="#182033" stroke-width="3"/>`).join("")}
 <text x="${cl.x}" y="${cl.y}" font-size="${cl.size}" font-family="'Noto Music','Bravura Text','Segoe UI Symbol','Apple Symbols',serif" fill="#182033">${c.glyph}</text>
 ${noteHtml}
 </svg>`
}
function diatonicNumber(n){const map={c:0,d:1,e:2,f:3,g:4,a:5,h:6};return n.oct*7+map[n.name]}
function offsetForClef(n,clef){
 const refs={treble:{name:"e",oct:3},bass:{name:"g",oct:2},alto:{name:"f",oct:3},tenor:{name:"d",oct:3}};
 return diatonicNumber(n)-diatonicNumber(refs[clef])
}
function noteOptions(correct,pool){const near=pool.filter(n=>n.id!==correct.id).sort((a,b)=>Math.abs(a.midi-correct.midi)-Math.abs(b.midi-correct.midi)).slice(0,7);return shuffle([correct.label,...shuffle(near).slice(0,3).map(n=>n.label)])}

function pitchPool(){
 const diff=$("difficulty").value;let pool=NOTES.filter(n=>diff==="easy"?n.midi>=52&&n.midi<=67:diff==="medium"?n.midi>=48&&n.midi<=72:true);
 const clefSel=$("clefSelect").value, clefs=clefSel==="mixed"?["treble","bass","alto","tenor"]:[clefSel];
 let out=[];clefs.forEach(c=>pool.forEach(n=>out.push({type:"pitch",prompt:`Wie heißt diese Note im ${CLEFS[c].name}?`,correct:n.label,options:noteOptions(n,pool),clef:c,note:{...n,diatonicOffset:offsetForClef(n,c)},weakKey:`pitch:${c}:${n.id}`})));
 return out;
}
function rhythmPool(){
 const d=[
 {prompt:"Wie viele Viertelnoten entsprechen einer ganzen Note?",correct:"4",options:["2","3","4","8"],visual:{kind:"equation",left:"whole",right:"quarter"}},
 {prompt:"Wie viele Achtelnoten entsprechen einer halben Note?",correct:"4",options:["2","3","4","8"],visual:{kind:"equation",left:"half",right:"eighth"}},
 {prompt:"Wie viele Schläge dauert eine punktierte halbe Note?",correct:"3",options:["1½","2","3","4"],visual:{kind:"single",note:"half",dotted:true}},
 {prompt:"Welche Note dauert im 4/4-Takt einen Schlag?",correct:"Viertelnote",options:["Ganze Note","Halbe Note","Viertelnote","Achtelnote"],visual:{kind:"time",top:4,bottom:4}},
 {prompt:"Wie viele Achtelnoten füllen einen 4/4-Takt?",correct:"8",options:["4","6","8","12"],visual:{kind:"time",top:4,bottom:4}},
 {prompt:"Wie viele Sechzehntelnoten entsprechen einer Viertelnote?",correct:"4",options:["2","3","4","8"],visual:{kind:"equation",left:"quarter",right:"sixteenth"}},
 {prompt:"Eine punktierte Viertelnote dauert ...",correct:"1½ Schläge",options:["½ Schlag","1 Schlag","1½ Schläge","2 Schläge"],visual:{kind:"single",note:"quarter",dotted:true}},
 {prompt:"Welche Taktart hat drei Viertelschläge?",correct:"3/4",options:["2/4","3/4","4/4","6/8"],visual:{kind:"sequence",notes:["quarter","quarter","quarter"]}},
 {prompt:"Wie viele halbe Noten passen in einen 4/4-Takt?",correct:"2",options:["1","2","3","4"],visual:{kind:"time",top:4,bottom:4}},
 {prompt:"Welche Pause dauert einen ganzen 4/4-Takt?",correct:"Ganze Pause",options:["Halbe Pause","Ganze Pause","Viertelpause","Achtelpause"],visual:{kind:"rest",rest:"whole"}}
 ];
 return d.map((x,i)=>({type:"rhythm",prompt:x.prompt,correct:x.correct,options:x.options,visual:x.visual,weakKey:`rhythm:${i}`}))
}

function rhythmNoteSvg(type,{x=90,y=105,dotted=false}={}){
 const filled=type==="quarter"||type==="eighth"||type==="sixteenth";
 const hasStem=type!=="whole";
 const flags=type==="eighth"?1:type==="sixteenth"?2:0;
 let s=`<ellipse cx="${x}" cy="${y}" rx="18" ry="12" transform="rotate(-18 ${x} ${y})" fill="${filled?"#182033":"white"}" stroke="#182033" stroke-width="4"/>`;
 if(hasStem){
  s+=`<line x1="${x+16}" y1="${y-2}" x2="${x+16}" y2="${y-76}" stroke="#182033" stroke-width="5" stroke-linecap="round"/>`;
  for(let i=0;i<flags;i++){
   const fy=y-75+i*18;
   s+=`<path d="M ${x+16} ${fy} C ${x+48} ${fy+7}, ${x+49} ${fy+34}, ${x+25} ${fy+43}" fill="none" stroke="#182033" stroke-width="6" stroke-linecap="round"/>`;
  }
 }
 if(dotted)s+=`<circle cx="${x+43}" cy="${y-2}" r="6" fill="#182033"/>`;
 return s
}
function rhythmRestSvg(type,{x=100,y=105}={}){
 if(type==="whole")return `<rect x="${x-25}" y="${y-15}" width="50" height="15" rx="2" fill="#182033"/>`;
 if(type==="half")return `<rect x="${x-25}" y="${y}" width="50" height="15" rx="2" fill="#182033"/>`;
 if(type==="quarter")return `<path d="M ${x+8} ${y-55} C ${x-12} ${y-37}, ${x+19} ${y-27}, ${x-2} ${y-9} C ${x-20} ${y+7}, ${x+16} ${y+11}, ${x-3} ${y+34} C ${x-12} ${y+44}, ${x-2} ${y+54}, ${x+8} ${y+46}" fill="none" stroke="#182033" stroke-width="8" stroke-linecap="round"/>`;
 return `<circle cx="${x+4}" cy="${y-26}" r="9" fill="#182033"/><path d="M ${x+8} ${y-20} C ${x+34} ${y-8}, ${x+24} ${y+17}, ${x-2} ${y+36}" fill="none" stroke="#182033" stroke-width="6" stroke-linecap="round"/>`;
}
function rhythmVisualSvg(v){
 const frame=(content,width=520)=>`<svg class="rhythm-svg" viewBox="0 0 ${width} 210" role="img" aria-label="Rhythmusnotation"><rect x="1" y="1" width="${width-2}" height="208" rx="18" fill="#fff"/>${content}</svg>`;
 if(!v)return frame(`<text x="260" y="120" text-anchor="middle" font-size="38" font-family="system-ui">Rhythmus</text>`);
 if(v.kind==="single")return frame(rhythmNoteSvg(v.note,{x:260,y:125,dotted:v.dotted}));
 if(v.kind==="rest")return frame(rhythmRestSvg(v.rest,{x:260,y:105}));
 if(v.kind==="time")return frame(`<text x="260" y="88" text-anchor="middle" font-size="70" font-weight="800" font-family="system-ui">${v.top}</text><text x="260" y="166" text-anchor="middle" font-size="70" font-weight="800" font-family="system-ui">${v.bottom}</text>`);
 if(v.kind==="sequence"){
  const gap=125,start=260-((v.notes.length-1)*gap)/2;
  return frame(v.notes.map((n,i)=>rhythmNoteSvg(n,{x:start+i*gap,y:125})).join(""));
 }
 if(v.kind==="equation"){
  return frame(
   rhythmNoteSvg(v.left,{x:110,y:125})+
   `<text x="205" y="132" text-anchor="middle" font-size="48" font-weight="700" font-family="system-ui">=</text>`+
   `<text x="285" y="132" text-anchor="middle" font-size="48" font-weight="700" font-family="system-ui">? ×</text>`+
   rhythmNoteSvg(v.right,{x:410,y:125})
  );
 }
 return frame("");
}

function intervalPool(){
 const names={1:"Sekunde",2:"Terz",3:"Quarte",4:"Quinte",5:"Sexte",6:"Septime",7:"Oktave"},p=NOTES.filter(n=>n.midi>=52&&n.midi<=72),out=[];
 p.slice(0,8).forEach(a=>[1,2,3,4,5,7].forEach(dist=>{const ai=diatonicNumber(a),b=p.find(n=>diatonicNumber(n)-ai===dist);if(b){const vals=Object.values(names);out.push({type:"interval",prompt:"Welches Intervall ist notiert?",correct:names[dist],options:shuffle([names[dist],...shuffle(vals.filter(x=>x!==names[dist])).slice(0,3)]),clef:"treble",notes:[{...a,diatonicOffset:offsetForClef(a,"treble")},{...b,diatonicOffset:offsetForClef(b,"treble")}],weakKey:`interval:${dist}`})}}));
 return out
}
function earPool(){
 const type=$("earType").value, out=[];
 const tones=NOTES.filter(n=>n.midi>=60&&n.midi<=71);
 if(type==="tone"||type==="mixed") tones.forEach(n=>out.push({type:"ear-tone",prompt:"Welcher Ton erklingt?",correct:n.label,options:noteOptions(n,tones),midi:[n.midi],weakKey:`ear-tone:${n.id}`}));
 const intervals={2:"Sekunde",4:"Terz",5:"Quarte",7:"Quinte",9:"Sexte",12:"Oktave"};
 if(type==="interval"||type==="mixed") Object.entries(intervals).forEach(([semi,name])=>{const base=60;out.push({type:"ear-interval",prompt:"Welches Intervall hörst du?",correct:name,options:shuffle([name,...shuffle(Object.values(intervals).filter(x=>x!==name)).slice(0,3)]),midi:[base,base+Number(semi)],weakKey:`ear-int:${semi}`})});
 if(type==="chord"||type==="mixed") [["Dur",[60,64,67]],["Moll",[60,63,67]]].forEach(x=>out.push({type:"ear-chord",prompt:"Klingt der Akkord in Dur oder Moll?",correct:x[0],options:["Dur","Moll"],midi:x[1],simultaneous:true,weakKey:`ear-chord:${x[0]}`}));
 return out
}
function adaptivePick(pool,count){
 const weak=getWeak(),weighted=[];pool.forEach(q=>{const w=Math.min(4,1+(weak[q.weakKey]||0));for(let i=0;i<w;i++)weighted.push(q)});
 const result=[],used=new Set();while(result.length<count&&weighted.length){const q=weighted[Math.floor(Math.random()*weighted.length)];const key=q.weakKey+"-"+result.length;if(!used.has(q.weakKey)||pool.length<count){result.push(q);used.add(q.weakKey)}weighted.splice(weighted.indexOf(q),1)}
 return shuffle(result)
}

function ensureAudio(){
 const AudioClass=window.AudioContext||window.webkitAudioContext;
 if(!AudioClass)return false;
 try{
  if(!audioCtx)audioCtx=new AudioClass();
  if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
  return true
 }catch{return false}
}
function freq(m){return 440*Math.pow(2,(m-69)/12)}
function playMidi(list,sim=false){
 ensureAudio();const now=audioCtx.currentTime+0.05;
 list.forEach((m,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type="sine";osc.frequency.value=freq(m);gain.gain.setValueAtTime(0.0001,now+(sim?0:i*.75));gain.gain.exponentialRampToValueAtTime(.22,now+(sim?0:i*.75)+.03);gain.gain.exponentialRampToValueAtTime(.0001,now+(sim?0:i*.75)+.7);osc.connect(gain).connect(audioCtx.destination);osc.start(now+(sim?0:i*.75));osc.stop(now+(sim?0:i*.75)+.75)})
}

function renderQuestion(){
 locked=false;const q=queue[index];$("progressText").textContent=`Frage ${index+1} von ${queue.length}`;$("scoreText").textContent=`${score} Punkte`;$("progressFill").style.width=`${index/queue.length*100}%`;$("prompt").textContent=q.prompt;$("feedback").textContent="";
 if(q.type==="pitch")$("visual").innerHTML=drawStaff([q.note],q.clef);
 else if(q.type==="interval")$("visual").innerHTML=drawStaff(q.notes,q.clef);
 else if(q.type==="rhythm")$("visual").innerHTML=rhythmVisualSvg(q.visual);
 else $("visual").innerHTML=`<div class="audio-box"><button class="audio-btn" id="playAudio">▶ Hörbeispiel abspielen</button><p class="sub">Du kannst das Beispiel mehrfach anhören.</p></div>`;
 if(q.type.startsWith("ear")){$("playAudio").onclick=()=>playMidi(q.midi,q.simultaneous);setTimeout(()=>$("playAudio").click(),250)}
 $("answers").innerHTML="";q.options.forEach(opt=>{const b=document.createElement("button");b.className="answer";b.textContent=opt;b.onclick=()=>choose(b,opt,q);$("answers").appendChild(b)})
}
function choose(button,sel,q){
 if(locked)return;locked=true;document.querySelectorAll(".answer").forEach(b=>b.disabled=true);
 const isCorrect=sel===q.correct;
 if(isCorrect)score++;else{mistakes.push(`${q.correct} (gewählt: ${sel})`);bumpWeak(q.weakKey)}
 const immediate=!(lockedConfig&&lockedConfig.feedback==="off");
 if(immediate){
   if(isCorrect){button.classList.add("correct");$("feedback").textContent="Richtig!"}
   else{button.classList.add("wrong");document.querySelectorAll(".answer").forEach(b=>{if(b.textContent===q.correct)b.classList.add("correct")});$("feedback").textContent=`Richtig wäre: ${q.correct}`}
 }else{
   button.classList.add("correct");$("feedback").textContent="Antwort gespeichert.";
   deferredAnswers.push({correct:isCorrect,expected:q.correct,selected:sel})
 }
 setTimeout(()=>{index++;index<queue.length?renderQuestion():finish()},immediate?700:350)
}
function finish(){
 $("quiz").style.display="none";$("result").style.display="block";const percent=Math.round(score/queue.length*100),secs=Math.round((Date.now()-startedAt)/1000),g=grade(percent),name=$("studentName").value.trim()||"Ohne Namensangabe",klass=$("studentClass").value.trim()||"–";
 $("resultName").textContent=`${name} · ${klass} · ${moduleName(selectedModule)}`;$("resultPoints").textContent=`${score} / ${queue.length}`;$("resultPercent").textContent=`${percent} %`;$("resultGrade").textContent=g;$("resultTime").textContent=fmt(secs);
 $("review").innerHTML=mistakes.length?`<h3>Zu wiederholen</h3><ul>${mistakes.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"<h3>Alle Aufgaben richtig gelöst.</h3>";
 const config=lockedConfig?`${lockedConfig.title} · ${lockedConfig.summary}`:(selectedModule==="pitch"?CLEFS[$("clefSelect").value]?.name||"Gemischt":selectedModule==="ear"?$("earType").options[$("earType").selectedIndex].text:$("difficulty").options[$("difficulty").selectedIndex].text);
 saveResult({timestamp:new Date().toISOString(),name,klass,module:moduleName(selectedModule),config,score,total:queue.length,percent,grade:g,seconds:secs,mistakes})
}
$("startBtn").onclick=()=>{if(selectedModule==="ear")ensureAudio();let pool=selectedModule==="pitch"?pitchPool():selectedModule==="rhythm"?rhythmPool():selectedModule==="interval"?intervalPool():earPool();const count=Math.min(Number($("questionCount").value),pool.length);queue=(lockedConfig&&lockedConfig.adaptive===false)?shuffle(pool).slice(0,count):adaptivePick(pool,count);index=0;score=0;mistakes=[];deferredAnswers=[];startedAt=Date.now();$("setup").style.display="none";$("quiz").style.display="block";renderQuestion()};

function renderResults(){
 const d=getResults().slice().reverse(),body=$("resultsBody");if(!d.length){body.innerHTML='<tr><td colspan="10">Noch keine Ergebnisse gespeichert.</td></tr>';$("stats").innerHTML="";return}
 const avg=Math.round(d.reduce((s,r)=>s+r.percent,0)/d.length),best=Math.max(...d.map(r=>r.percent)),students=new Set(d.map(r=>r.name)).size,mods=new Set(d.map(r=>r.module)).size;
 $("stats").innerHTML=`<div class="stat">Tests<strong>${d.length}</strong></div><div class="stat">Durchschnitt<strong>${avg} %</strong></div><div class="stat">Schüler<strong>${students}</strong></div><div class="stat">Module<strong>${mods}</strong></div>`;
 body.innerHTML=d.map(r=>`<tr><td>${new Intl.DateTimeFormat("de-DE",{dateStyle:"short",timeStyle:"short"}).format(new Date(r.timestamp))}</td><td>${esc(r.name)}</td><td>${esc(r.klass)}</td><td>${r.module}</td><td>${esc(r.config||"–")}</td><td>${r.score}/${r.total}</td><td>${r.percent} %</td><td>${r.grade}</td><td>${fmt(r.seconds)}</td><td>${r.mistakes.length?esc(r.mistakes.join(", ")):"–"}</td></tr>`).join("")
}
$("loginBtn").onclick=()=>{if($("teacherPin").value===TEACHER_PIN){$("teacherLogin").style.display="none";$("teacherDashboard").style.display="block";renderResults();renderClasses();renderTemplates()}else alert("PIN ist nicht korrekt.")};
$("clearBtn").onclick=()=>{if(confirm("Alle lokal gespeicherten Ergebnisse löschen?")){localStorage.removeItem(STORAGE_KEY);renderResults()}};
function download(content,name,type){const b=new Blob([content],{type}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
$("exportBtn").onclick=()=>{const d=getResults();if(!d.length)return alert("Keine Ergebnisse vorhanden.");const rows=[["Datum","Name","Klasse","Modul","Konfiguration","Punkte","Gesamt","Prozent","Note","Zeit Sekunden","Fehler"],...d.map(r=>[r.timestamp,r.name,r.klass,r.module,r.config,r.score,r.total,r.percent,r.grade,r.seconds,r.mistakes.join(" | ")])];download("\ufeff"+rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(";")).join("\n"),"Musiktrainer_2_Ergebnisse.csv","text/csv")};
$("backupBtn").onclick=()=>download(JSON.stringify({results:getResults(),weak:getWeak()},null,2),"Musiktrainer_2_Sicherung.json","application/json");
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);localStorage.setItem(STORAGE_KEY,JSON.stringify(d.results||[]));localStorage.setItem(WEAK_KEY,JSON.stringify(d.weak||{}));renderResults();alert("Sicherung importiert.")}catch{alert("Ungültige Sicherungsdatei.")}};r.readAsText(f)};

function b64Encode(obj){
 const bytes=new TextEncoder().encode(JSON.stringify(obj));
 let binary="";bytes.forEach(b=>binary+=String.fromCharCode(b));
 return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")
}
function b64Decode(str){
 try{
  str=str.replace(/-/g,"+").replace(/_/g,"/");
  while(str.length%4)str+="=";
  const binary=atob(str),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes))
 }catch{return null}
}
function labelFor(selectId){const s=$(selectId);return s.options[s.selectedIndex].text}
function buildConfig(){
 const module=$("builderModule").value;
 return {
  v:1,title:$("builderTitle").value.trim()||"Musiktest",
  klass:$("builderClass").value.trim(),module,
  count:Number($("builderCount").value),
  clef:$("builderClef").value,difficulty:$("builderDifficulty").value,
  earType:$("builderEar").value,feedback:$("builderFeedback").value,
  adaptive:$("builderAdaptive").checked,
  summary:module==="pitch"?`${labelFor("builderClef")}, ${labelFor("builderDifficulty")}, ${$("builderCount").value} Fragen`:
          module==="ear"?`${labelFor("builderEar")}, ${$("builderCount").value} Fragen`:
          `${moduleName(module)}, ${labelFor("builderDifficulty")}, ${$("builderCount").value} Fragen`
 }
}
function makeTestLink(){
 const cfg=buildConfig(),url=new URL(location.href);
 url.search="";url.hash="test="+b64Encode(cfg);
 return url.toString()
}
$("builderModule").onchange=()=>{
 const m=$("builderModule").value;
 $("builderClefField").classList.toggle("hidden",m!=="pitch");
 $("builderEarField").classList.toggle("hidden",m!=="ear")
};
$("generateLinkBtn").onclick=()=>{
 $("generatedLink").value=makeTestLink();
 $("builderOutput").classList.remove("hidden")
};
$("copyLinkBtn").onclick=async()=>{
 try{await navigator.clipboard.writeText($("generatedLink").value);$("copyLinkBtn").textContent="Kopiert";setTimeout(()=>$("copyLinkBtn").textContent="Kopieren",1200)}
 catch{$("generatedLink").select();document.execCommand("copy")}
};
$("previewTestBtn").onclick=()=>window.open(makeTestLink(),"_blank");

function applyLockedTest(cfg){
 if(!cfg||!["pitch","rhythm","interval","ear"].includes(cfg.module))return;
 lockedConfig=cfg;selectedModule=cfg.module;
 document.body.classList.add("locked-test");
 $("lockedTestTitle").textContent=cfg.title||"Vorbereiteter Test";
 $("lockedTestSummary").textContent=cfg.summary||moduleName(cfg.module);
 $("studentClass").value=cfg.klass||"";
 $("studentClass").readOnly=Boolean(cfg.klass);
 $("questionCount").value=String(cfg.count||10);
 $("clefSelect").value=cfg.clef||"treble";
 $("difficulty").value=cfg.difficulty||"medium";
 $("earType").value=cfg.earType||"tone";
 document.querySelectorAll(".module").forEach(m=>m.classList.toggle("active",m.dataset.module===cfg.module));
 $("clefField").style.display=cfg.module==="pitch"?"block":"none";
 $("earTypeField").style.display=cfg.module==="ear"?"block":"none";
 document.title=`${cfg.title||"Musiktest"} · Musiktrainer Web-App`
}

function loadClasses(){try{return JSON.parse(localStorage.getItem(CLASS_KEY)||"[]")}catch{return []}}
function saveClasses(items){localStorage.setItem(CLASS_KEY,JSON.stringify(items))}
function loadTemplates(){try{return JSON.parse(localStorage.getItem(TEMPLATE_KEY)||"[]")}catch{return []}}
function saveTemplates(items){localStorage.setItem(TEMPLATE_KEY,JSON.stringify(items))}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function linkForConfig(cfg){
 const url=new URL(location.href);url.search="";url.hash="test="+b64Encode(cfg);return url.toString()
}
function refreshProfiles(){
 const select=$("studentProfile");if(!select)return;
 select.innerHTML='<option value="">Profil auswählen</option>';
 loadClasses().forEach(cls=>cls.students.forEach(name=>{
  const opt=document.createElement("option");
  opt.value=JSON.stringify({name,klass:cls.name});
  opt.textContent=`${name} · ${cls.name}`;
  select.appendChild(opt)
 }))
}
function renderClasses(){
 const host=$("classList");if(!host)return;
 const classes=loadClasses();
 if(!classes.length){host.innerHTML='<p class="empty">Noch keine Klassen gespeichert.</p>';refreshProfiles();return}
 host.innerHTML=classes.map(cls=>`
 <article class="library-item">
  <div><strong>${esc(cls.name)}</strong><span>${cls.students.length} Schülerprofile</span></div>
  <div class="mini-actions">
   <button class="secondary edit-class" data-id="${cls.id}">Bearbeiten</button>
   <button class="danger delete-class" data-id="${cls.id}">Löschen</button>
  </div>
 </article>`).join("");
 host.querySelectorAll(".edit-class").forEach(b=>b.onclick=()=>{
  const cls=loadClasses().find(x=>x.id===b.dataset.id);if(!cls)return;
  $("className").value=cls.name;
  $("classStudents").value=cls.students.join("\n");
  $("className").dataset.editId=cls.id
 });
 host.querySelectorAll(".delete-class").forEach(b=>b.onclick=()=>{
  if(!confirm("Diese Klasse löschen?"))return;
  saveClasses(loadClasses().filter(x=>x.id!==b.dataset.id));
  renderClasses()
 });
 refreshProfiles()
}
function renderTemplates(){
 const host=$("testLibrary");if(!host)return;
 const templates=loadTemplates();
 if(!templates.length){host.innerHTML='<p class="empty">Noch keine Testvorlagen gespeichert.</p>';return}
 host.innerHTML=templates.map(t=>`
 <article class="library-item">
  <div><strong>${esc(t.config.title)}</strong><span>${esc(t.config.summary)}</span></div>
  <div class="mini-actions">
   <button class="primary open-template" data-id="${t.id}">Öffnen</button>
   <button class="secondary copy-template" data-id="${t.id}">Link kopieren</button>
   <button class="danger delete-template" data-id="${t.id}">Löschen</button>
  </div>
 </article>`).join("");
 host.querySelectorAll(".open-template").forEach(b=>b.onclick=()=>{
  const t=loadTemplates().find(x=>x.id===b.dataset.id);
  if(t)window.open(linkForConfig(t.config),"_blank")
 });
 host.querySelectorAll(".copy-template").forEach(b=>b.onclick=async()=>{
  const t=loadTemplates().find(x=>x.id===b.dataset.id);if(!t)return;
  const link=linkForConfig(t.config);
  try{await navigator.clipboard.writeText(link);b.textContent="Kopiert";setTimeout(()=>b.textContent="Link kopieren",1200)}
  catch{prompt("Link kopieren:",link)}
 });
 host.querySelectorAll(".delete-template").forEach(b=>b.onclick=()=>{
  if(!confirm("Diese Testvorlage löschen?"))return;
  saveTemplates(loadTemplates().filter(x=>x.id!==b.dataset.id));
  renderTemplates()
 })
}
if($("studentProfile"))$("studentProfile").onchange=()=>{
 if(!$("studentProfile").value)return;
 try{
  const p=JSON.parse($("studentProfile").value);
  $("studentName").value=p.name;
  $("studentClass").value=p.klass
 }catch{}
};
if($("saveClassBtn"))$("saveClassBtn").onclick=()=>{
 const name=$("className").value.trim();
 const students=[...new Set($("classStudents").value.split(/\n|,/).map(x=>x.trim()).filter(Boolean))];
 if(!name)return alert("Bitte einen Klassennamen eingeben.");
 const items=loadClasses(),editId=$("className").dataset.editId;
 if(editId){
  const item=items.find(x=>x.id===editId);
  if(item){item.name=name;item.students=students}
 }else items.push({id:uid(),name,students});
 saveClasses(items);
 $("className").value="";
 $("classStudents").value="";
 delete $("className").dataset.editId;
 renderClasses()
};
if($("saveTemplateBtn"))$("saveTemplateBtn").onclick=()=>{
 const cfg=buildConfig(),items=loadTemplates();
 items.unshift({id:uid(),createdAt:new Date().toISOString(),config:cfg});
 saveTemplates(items);
 renderTemplates();
 alert("Testvorlage wurde gespeichert.")
};
renderClasses();
renderTemplates();
refreshProfiles();

(function loadTestFromUrl(){
 const hash=location.hash.startsWith("#test=")?location.hash.slice(6):"";
 if(hash)applyLockedTest(b64Decode(hash))
})();
