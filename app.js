const NOTES=[{"id": "c2", "name": "c", "oct": 2, "label": "c", "midi": 36}, {"id": "d2", "name": "d", "oct": 2, "label": "d", "midi": 38}, {"id": "e2", "name": "e", "oct": 2, "label": "e", "midi": 40}, {"id": "f2", "name": "f", "oct": 2, "label": "f", "midi": 41}, {"id": "g2", "name": "g", "oct": 2, "label": "g", "midi": 43}, {"id": "a2", "name": "a", "oct": 2, "label": "a", "midi": 45}, {"id": "h2", "name": "h", "oct": 2, "label": "h", "midi": 47}, {"id": "c3", "name": "c", "oct": 3, "label": "c¹", "midi": 48}, {"id": "d3", "name": "d", "oct": 3, "label": "d¹", "midi": 50}, {"id": "e3", "name": "e", "oct": 3, "label": "e¹", "midi": 52}, {"id": "f3", "name": "f", "oct": 3, "label": "f¹", "midi": 53}, {"id": "g3", "name": "g", "oct": 3, "label": "g¹", "midi": 55}, {"id": "a3", "name": "a", "oct": 3, "label": "a¹", "midi": 57}, {"id": "h3", "name": "h", "oct": 3, "label": "h¹", "midi": 59}, {"id": "c4", "name": "c", "oct": 4, "label": "c²", "midi": 60}, {"id": "d4", "name": "d", "oct": 4, "label": "d²", "midi": 62}, {"id": "e4", "name": "e", "oct": 4, "label": "e²", "midi": 64}, {"id": "f4", "name": "f", "oct": 4, "label": "f²", "midi": 65}, {"id": "g4", "name": "g", "oct": 4, "label": "g²", "midi": 67}, {"id": "a4", "name": "a", "oct": 4, "label": "a²", "midi": 69}, {"id": "h4", "name": "h", "oct": 4, "label": "h²", "midi": 71}, {"id": "c5", "name": "c", "oct": 5, "label": "c³", "midi": 72}, {"id": "d5", "name": "d", "oct": 5, "label": "d³", "midi": 74}, {"id": "e5", "name": "e", "oct": 5, "label": "e³", "midi": 76}, {"id": "f5", "name": "f", "oct": 5, "label": "f³", "midi": 77}, {"id": "g5", "name": "g", "oct": 5, "label": "g³", "midi": 79}];
const APP_CONFIG=window.MUSIKTRAINER_CONFIG||{};
const STORAGE_KEY="musiktrainer_webapp_results",WEAK_KEY="musiktrainer_webapp_weak";
const TEACHER_PIN=APP_CONFIG.teacherPin||"2000";
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
 const lines=[70,90,110,130,150],c=CLEFS[clef];
 const noteHtml=items.map((n,i)=>{const x=285+i*90,y=150-(n.diatonicOffset||0)*10;let ledger="";
 if(y<=50)for(let ly=50;ly>=y;ly-=20)ledger+=`<line x1="${x-32}" y1="${ly}" x2="${x+32}" y2="${ly}" stroke="#111" stroke-width="3"/>`;
 if(y>=170)for(let ly=170;ly<=y;ly+=20)ledger+=`<line x1="${x-32}" y1="${ly}" x2="${x+32}" y2="${ly}" stroke="#111" stroke-width="3"/>`;
 return `${ledger}<ellipse cx="${x}" cy="${y}" rx="17" ry="12" transform="rotate(-18 ${x} ${y})" fill="#111"/><line x1="${x+16}" y1="${y-2}" x2="${x+16}" y2="${y-66}" stroke="#111" stroke-width="4"/>`}).join("");
 return `<svg viewBox="0 0 620 220"><rect x="1" y="1" width="618" height="218" rx="18" fill="#fff"/>${lines.map(y=>`<line x1="90" y1="${y}" x2="550" y2="${y}" stroke="#111" stroke-width="3"/>`).join("")}<text x="${c.glyphX}" y="${c.glyphY}" font-size="100" font-family="serif">${c.glyph}</text>${noteHtml}</svg>`
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
 ["Wie viele Viertelnoten entsprechen einer ganzen Note?","4",["2","3","4","8"],"𝅝 = ? × 𝅘𝅥"],
 ["Wie viele Achtelnoten entsprechen einer halben Note?","4",["2","3","4","8"],"𝅗𝅥 = ? × ♪"],
 ["Wie viele Schläge dauert eine punktierte halbe Note?","3",["1½","2","3","4"],"𝅗𝅥."],
 ["Welche Note dauert im 4/4-Takt einen Schlag?","Viertelnote",["Ganze Note","Halbe Note","Viertelnote","Achtelnote"],"4/4"],
 ["Wie viele Achtelnoten füllen einen 4/4-Takt?","8",["4","6","8","12"],"4/4"],
 ["Wie viele Sechzehntelnoten entsprechen einer Viertelnote?","4",["2","3","4","8"],"𝅘𝅥 = ? × 𝅘𝅥𝅯"],
 ["Eine punktierte Viertelnote dauert ...","1½ Schläge",["½ Schlag","1 Schlag","1½ Schläge","2 Schläge"],"𝅘𝅥."],
 ["Welche Taktart hat drei Viertelschläge?","3/4",["2/4","3/4","4/4","6/8"],"♩ ♩ ♩"],
 ["Wie viele halbe Noten passen in einen 4/4-Takt?","2",["1","2","3","4"],"4/4"],
 ["Welche Pause dauert einen ganzen 4/4-Takt?","Ganze Pause",["Halbe Pause","Ganze Pause","Viertelpause","Achtelpause"],"𝄻"]
 ];
 return d.map((x,i)=>({type:"rhythm",prompt:x[0],correct:x[1],options:x[2],display:x[3],weakKey:`rhythm:${i}`}))
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

function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)()}
function freq(m){return 440*Math.pow(2,(m-69)/12)}
function playMidi(list,sim=false){
 ensureAudio();const now=audioCtx.currentTime+0.05;
 list.forEach((m,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type="sine";osc.frequency.value=freq(m);gain.gain.setValueAtTime(0.0001,now+(sim?0:i*.75));gain.gain.exponentialRampToValueAtTime(.22,now+(sim?0:i*.75)+.03);gain.gain.exponentialRampToValueAtTime(.0001,now+(sim?0:i*.75)+.7);osc.connect(gain).connect(audioCtx.destination);osc.start(now+(sim?0:i*.75));osc.stop(now+(sim?0:i*.75)+.75)})
}

function renderQuestion(){
 locked=false;const q=queue[index];$("progressText").textContent=`Frage ${index+1} von ${queue.length}`;$("scoreText").textContent=`${score} Punkte`;$("progressFill").style.width=`${index/queue.length*100}%`;$("prompt").textContent=q.prompt;$("feedback").textContent="";
 if(q.type==="pitch")$("visual").innerHTML=drawStaff([q.note],q.clef);
 else if(q.type==="interval")$("visual").innerHTML=drawStaff(q.notes,q.clef);
 else if(q.type==="rhythm")$("visual").innerHTML=`<div style="font-size:clamp(2.2rem,8vw,4.7rem);letter-spacing:.16em">${q.display}</div>`;
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
$("startBtn").onclick=()=>{ensureAudio();let pool=selectedModule==="pitch"?pitchPool():selectedModule==="rhythm"?rhythmPool():selectedModule==="interval"?intervalPool():earPool();const count=Math.min(Number($("questionCount").value),pool.length);queue=(lockedConfig&&lockedConfig.adaptive===false)?shuffle(pool).slice(0,count):adaptivePick(pool,count);index=0;score=0;mistakes=[];deferredAnswers=[];startedAt=Date.now();$("setup").style.display="none";$("quiz").style.display="block";renderQuestion()};

function renderResults(){
 const d=getResults().slice().reverse(),body=$("resultsBody");if(!d.length){body.innerHTML='<tr><td colspan="10">Noch keine Ergebnisse gespeichert.</td></tr>';$("stats").innerHTML="";return}
 const avg=Math.round(d.reduce((s,r)=>s+r.percent,0)/d.length),best=Math.max(...d.map(r=>r.percent)),students=new Set(d.map(r=>r.name)).size,mods=new Set(d.map(r=>r.module)).size;
 $("stats").innerHTML=`<div class="stat">Tests<strong>${d.length}</strong></div><div class="stat">Durchschnitt<strong>${avg} %</strong></div><div class="stat">Schüler<strong>${students}</strong></div><div class="stat">Module<strong>${mods}</strong></div>`;
 body.innerHTML=d.map(r=>`<tr><td>${new Intl.DateTimeFormat("de-DE",{dateStyle:"short",timeStyle:"short"}).format(new Date(r.timestamp))}</td><td>${esc(r.name)}</td><td>${esc(r.klass)}</td><td>${r.module}</td><td>${esc(r.config||"–")}</td><td>${r.score}/${r.total}</td><td>${r.percent} %</td><td>${r.grade}</td><td>${fmt(r.seconds)}</td><td>${r.mistakes.length?esc(r.mistakes.join(", ")):"–"}</td></tr>`).join("")
}
$("loginBtn").onclick=()=>{if($("teacherPin").value===TEACHER_PIN){$("teacherLogin").style.display="none";$("teacherDashboard").style.display="block";renderResults()}else alert("PIN ist nicht korrekt.")};
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
(function loadTestFromUrl(){
 const hash=location.hash.startsWith("#test=")?location.hash.slice(6):"";
 if(hash)applyLockedTest(b64Decode(hash))
})();
