const NOTES=[{"id": "c2", "name": "c", "oct": 2, "label": "c", "midi": 36}, {"id": "d2", "name": "d", "oct": 2, "label": "d", "midi": 38}, {"id": "e2", "name": "e", "oct": 2, "label": "e", "midi": 40}, {"id": "f2", "name": "f", "oct": 2, "label": "f", "midi": 41}, {"id": "g2", "name": "g", "oct": 2, "label": "g", "midi": 43}, {"id": "a2", "name": "a", "oct": 2, "label": "a", "midi": 45}, {"id": "h2", "name": "h", "oct": 2, "label": "h", "midi": 47}, {"id": "c3", "name": "c", "oct": 3, "label": "c¹", "midi": 48}, {"id": "d3", "name": "d", "oct": 3, "label": "d¹", "midi": 50}, {"id": "e3", "name": "e", "oct": 3, "label": "e¹", "midi": 52}, {"id": "f3", "name": "f", "oct": 3, "label": "f¹", "midi": 53}, {"id": "g3", "name": "g", "oct": 3, "label": "g¹", "midi": 55}, {"id": "a3", "name": "a", "oct": 3, "label": "a¹", "midi": 57}, {"id": "h3", "name": "h", "oct": 3, "label": "h¹", "midi": 59}, {"id": "c4", "name": "c", "oct": 4, "label": "c²", "midi": 60}, {"id": "d4", "name": "d", "oct": 4, "label": "d²", "midi": 62}, {"id": "e4", "name": "e", "oct": 4, "label": "e²", "midi": 64}, {"id": "f4", "name": "f", "oct": 4, "label": "f²", "midi": 65}, {"id": "g4", "name": "g", "oct": 4, "label": "g²", "midi": 67}, {"id": "a4", "name": "a", "oct": 4, "label": "a²", "midi": 69}, {"id": "h4", "name": "h", "oct": 4, "label": "h²", "midi": 71}, {"id": "c5", "name": "c", "oct": 5, "label": "c³", "midi": 72}, {"id": "d5", "name": "d", "oct": 5, "label": "d³", "midi": 74}, {"id": "e5", "name": "e", "oct": 5, "label": "e³", "midi": 76}, {"id": "f5", "name": "f", "oct": 5, "label": "f³", "midi": 77}, {"id": "g5", "name": "g", "oct": 5, "label": "g³", "midi": 79}];
const APP_CONFIG=window.MUSIKTRAINER_CONFIG||{};
const STORAGE_KEY="musiktrainer_webapp_results",WEAK_KEY="musiktrainer_webapp_weak";
const TEACHER_PIN=APP_CONFIG.teacherPin||"2000";
let selectedModule="pitch",queue=[],index=0,score=0,startedAt=0,mistakes=[],locked=false,currentAudio=null,audioCtx=null,lockedConfig=null,deferredAnswers=[];
const $=id=>document.getElementById(id),shuffle=a=>[...a].sort(()=>Math.random()-.5);

document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.panel).classList.add("active")});
document.querySelectorAll(".module").forEach(m=>m.onclick=()=>{document.querySelectorAll(".module").forEach(x=>x.classList.remove("active"));m.classList.add("active");selectedModule=m.dataset.module;$("clefField").style.display=selectedModule==="pitch"?"block":"none";$("earTypeField").style.display=selectedModule==="ear"?"block":"none"});


function resolveStaffStep(note,clefKey){
 if(Number.isFinite(note.staffStep))return note.staffStep;
 if(Number.isFinite(note.step))return note.step;
 if(Number.isFinite(note.pos))return note.pos;
 return 0
}

function staffSvg(note,clefKey){
 const clef=CLEFS[clefKey]||CLEFS.treble;
 const width=560,height=250;
 const left=112,right=520;
 const top=62,lineGap=25;
 const lines=[0,1,2,3,4].map(i=>top+i*lineGap);
 const centerY=top+2*lineGap;

 // Diatonische Position relativ zur Mittellinie des jeweiligen Schlüssels.
 const step=resolveStaffStep(note,clefKey);
 const noteY=centerY-step*(lineGap/2);

 // Schlüsselgrößen und -positionen sind bewusst getrennt abgestimmt.
 const clefLayout={
  treble:{symbol:"𝄞",x:58,y:166,size:132},
  bass:{symbol:"𝄢",x:65,y:132,size:92},
  alto:{symbol:"𝄡",x:63,y:151,size:112},
  tenor:{symbol:"𝄡",x:63,y:126,size:112}
 };
 const cl=clefLayout[clefKey]||clefLayout.treble;

 let svg=`<svg class="staff-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Notensystem mit ${clef.name}">`;

 // Staff lines
 lines.forEach(y=>{
  svg+=`<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#182033" stroke-width="3.2" stroke-linecap="round"/>`;
 });

 // Clef
 svg+=`<text x="${cl.x}" y="${cl.y}" font-size="${cl.size}" font-family="'Noto Music','Bravura Text','Segoe UI Symbol','Apple Symbols',serif" fill="#182033">${cl.symbol}</text>`;

 // Ledger lines: one short line per staff-space outside the stave.
 const noteX=350;
 const ledgerHalf=28;
 if(noteY < lines[0]){
  for(let y=lines[0]-lineGap; y>=noteY-2; y-=lineGap){
   svg+=`<line x1="${noteX-ledgerHalf}" y1="${y}" x2="${noteX+ledgerHalf}" y2="${y}" stroke="#182033" stroke-width="3.2" stroke-linecap="round"/>`;
  }
 }
 if(noteY > lines[4]){
  for(let y=lines[4]+lineGap; y<=noteY+2; y+=lineGap){
   svg+=`<line x1="${noteX-ledgerHalf}" y1="${y}" x2="${noteX+ledgerHalf}" y2="${y}" stroke="#182033" stroke-width="3.2" stroke-linecap="round"/>`;
  }
 }

 // Note head and stem
 svg+=`<ellipse cx="${noteX}" cy="${noteY}" rx="18" ry="12" transform="rotate(-18 ${noteX} ${noteY})" fill="#182033"/>`;
 const stemUp=noteY>=centerY;
 if(stemUp){
  svg+=`<line x1="${noteX+16}" y1="${noteY-2}" x2="${noteX+16}" y2="${noteY-72}" stroke="#182033" stroke-width="4.5" stroke-linecap="round"/>`;
 }else{
  svg+=`<line x1="${noteX-16}" y1="${noteY+2}" x2="${noteX-16}" y2="${noteY+72}" stroke="#182033" stroke-width="4.5" stroke-linecap="round"/>`;
 }

 svg+=`</svg>`;
 return svg
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
