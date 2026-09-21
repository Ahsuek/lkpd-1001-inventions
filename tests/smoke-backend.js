/* Smoke test backend Code.gs scoring dengan stub Google services */
const fs = require('fs'), path = require('path');

// --- stubs ---
const sheets = {};
function mkSheet(name){
  return {
    name, rows:[], headers:null, frozen:0,
    getRange(r,c,nr,nc){
      const self = this;
      return {
        setValues(v){ 
          if(r===1){ self.headers = v[0]; }
          else { while(self.rows.length < r-2+v.length) self.rows.push([]); v.forEach((row,i)=> self.rows[r-2+i] = row.slice()); }
          return this;
        },
        getValues(){
          const out=[];
          for(let i=0;i<nr;i++){ const row = self.rows[r-2+i]||[]; out.push(nc?row.slice(c-1,c-1+nc):row.slice()); }
          return out;
        },
        setFontWeight(){ return this; }
      };
    },
    getLastRow(){ return this.rows.length + (this.headers?1:0); },
    getLastColumn(){ return (this.headers||[]).length; },
    appendRow(row){ this.rows.push(row.slice()); },
    clearContents(){ this.rows=[]; this.headers=null; },
    setFrozenRows(n){ this.frozen=n; }
  };
}
global.SpreadsheetApp = { openById(){ return { getSheetByName(n){ return sheets[n]||null; }, insertSheet(n){ sheets[n]=mkSheet(n); return sheets[n]; }, getUrl(){ return 'https://docs.google.com/spreadsheets/d/TEST'; } }; } };
global.PropertiesService = { getScriptProperties(){ return { getProperty(k){ return ({SPREADSHEET_ID:'TEST',AI_API_KEY:'FAKE'})[k]||null; } }; } };
global.ContentService = { createTextOutput(s){ return { setMimeType(){ return { _body:s }; }, _body:s }; }, MimeType:{ JSON:'json' } };
global.UrlFetchApp = { fetch(){ return { getResponseCode(){ return 200; }, getContentText(){ return JSON.stringify({candidates:[{content:{parts:[{text:'{"relevance":4,"reasoning":5,"solution":4,"good":"g","improve":"i","followup":"f"}'}]}}]}); } }; } };

sheets['RESPONSES'] = mkSheet('RESPONSES');
sheets['DETAIL_AI'] = mkSheet('DETAIL_AI');
sheets['REKAP'] = mkSheet('REKAP');

eval(fs.readFileSync(path.join(__dirname,'..','backend','Code.gs'),'utf8') + '\n;globalThis.GS = { saveStudentResult_, getTeacherData_, getClassRecap_ };');
(function(){
const { saveStudentResult_, getTeacherData_, getClassRecap_ } = globalThis.GS;

let fails=0;
function T(n,g,e){ const ok=JSON.stringify(g)===JSON.stringify(e); if(!ok){fails++;console.log('FAIL',n,'got',JSON.stringify(g),'exp',JSON.stringify(e));} else console.log('ok  ',n); }

const payload = {
  action:'saveResult', name:'Umar', klass:'XI MIPA 1',
  answers:{
    watch:{ s1:'Ibn al-Haytham', s2:'Al-Khwarizmi', s3:'Ibnu Sina', i1:'kamera obscura', i2:'aljabar', i3:'rumah sakit', surprise:'terkejut kamera berasal dari ilmuwan Muslim yang panjang sekali deskripsinya', newknowledge:'saya baru tahu algoritma berasal dari nama Al-Khwarizmi dan ini sangat menarik bagi saya' },
    discover:{ 0:0, 1:1, 2:2, 3:0, 4:3 }, // 4 benar = 16
    think:{ q1:'aaa', q2:'bbb', q3:'ccc' }
  },
  scores:{},
  invention:{ name:'SmartWudu', problem:'air terbuang saat wudu', inspired:'Al-Jazari', how:'sensor mengatur aliran air sehingga hemat', who:'seluruh umat muslim', benefit:'hemat air' },
  finalResult:{ challenge:'tes tantangan', answer:'jawaban final siswa yang cukup panjang dan beralasan' },
  aiFeedback:{
    think:{ relevance:5, argumentation:8, analysis:4, material_connection:5, good:'g', improve:'i', followup:'f' },
    invent:{ problem:4, creativity:4, solution:8, benefit:4, good:'g', improve:'i', scientist_connection:'s', challenge:'c' },
    final:{ relevance:4, reasoning:5, solution:4, good:'g', improve:'i', followup:'f' }
  },
  xp:0
};
const out = saveStudentResult_(payload);
T('watch=15', out.scores.watch, 15);
T('discover=16', out.scores.discover, 16);
T('think=22', out.scores.think, 22);
T('invent=20', out.scores.invent, 20);
T('final=13', out.scores.final, 13);
T('total=86', out.total, 86);
T('predikat', out.predikat, 'Baik');
T('xp=100', out.xp, 100);

// double submit → tidak duplikat (upsert)
saveStudentResult_(payload);
const resp = sheets['RESPONSES'];
T('upsert 1 row', resp.rows.length, 1);
T('total in sheet', resp.rows[0][38], 86);

// invalid
T('invalid no name', saveStudentResult_({klass:'X'}).ok, false);

// AI mis-scored over-max → di-clamp backend
const p2 = JSON.parse(JSON.stringify(payload));
p2.aiFeedback.think = { relevance:99, argumentation:99, analysis:99, material_connection:99 };
p2.aiFeedback.invent = { problem:99, creativity:99, solution:99, benefit:99 };
p2.aiFeedback.final = { relevance:99, reasoning:99, solution:99 };
const out2 = saveStudentResult_(p2);
T('clamped think=25', out2.scores.think, 25);
T('clamped invent=25', out2.scores.invent, 25);
T('clamped final=15', out2.scores.final, 15);
T('clamped total=96', out2.total, 96);

// teacher data
const t = getTeacherData_('');
T('teacher rows', t.rows.length, 1);
T('teacher name', t.rows[0].name, 'Umar');
T('teacher total', t.rows[0].total, 96);
const rec = getClassRecap_('');

/* ===== REGRESSION: payload frontend nyata =====
 * Bug: frontend lama mengirim aiFeedback TANPA komponen numerik
 * (hanya good/improve/followup), padahal backend menghitung ulang
 * Think/Invention/Final dari komponen tersebut → selalu 0.
 * W&H & Discover benar karena dihitung dari `answers`. */
// 1) Bentuk LAMA (komponen dibuang) → Think/Invent/Final 0, total = W&H+Discover
const legacyPayload = JSON.parse(JSON.stringify(payload));
legacyPayload.name = 'Legacy Student';
legacyPayload.aiFeedback = { think:{good:'g',improve:'i',followup:'f'}, invent:{good:'g',improve:'i',scientist_connection:'s',challenge:'c'}, final:{good:'g',improve:'i',followup:'f'} };
const outL = saveStudentResult_(legacyPayload);
T('legacy think=0', outL.scores.think, 0);
T('legacy invent=0', outL.scores.invent, 0);
T('legacy final=0', outL.scores.final, 0);
T('legacy total=watch+discover', outL.total, outL.scores.watch+outL.scores.discover);

// 2) Bentuk BARU (komponen numerik ikut dikirim, sesuai app.js setelah perbaikan) → skor lengkap
const fixedPayload = JSON.parse(JSON.stringify(payload));
fixedPayload.name = 'Fixed Student';
fixedPayload.aiFeedback = {
  think:{ relevance:5, argumentation:8, analysis:4, material_connection:5, good:'g', improve:'i', followup:'f' },
  invent:{ problem:4, creativity:4, solution:8, benefit:4, good:'g', improve:'i', scientist_connection:'s', challenge:'c' },
  final:{ relevance:4, reasoning:5, solution:4, good:'g', improve:'i', followup:'f' }
};
const outF = saveStudentResult_(fixedPayload);
T('fixed think=22', outF.scores.think, 22);
T('fixed invent=20', outF.scores.invent, 20);
T('fixed final=13', outF.scores.final, 13);
T('fixed total=86', outF.total, 86);
T('fixed predikat', outF.predikat, 'Baik');

// 3) Data kosong tetap aman: aiFeedback kosong → skor 0, tanpa error
const emptyPayload = JSON.parse(JSON.stringify(payload));
emptyPayload.name = 'Empty Student';
emptyPayload.aiFeedback = {};
const outE = saveStudentResult_(emptyPayload);
T('empty think=0', outE.scores.think, 0);
T('empty invent=0', outE.scores.invent, 0);
T('empty final=0', outE.scores.final, 0);
T('empty safe total', outE.total, outE.scores.watch+outE.scores.discover);
T('empty predikat', outE.predikat, 'Perlu Pengembangan');

// 4) Teacher data membaca siswa dengan mapping field yang benar
const tAll = getTeacherData_();
T('recap count', rec.count, 1);
T('recap max', rec.max, 96);
T('recap baik', rec.b, 0); T('recap sb', rec.sb, 1);
const find = n => tAll.rows.find(r=>r.name===n);
const rL = find('Legacy Student'), rF = find('Fixed Student'), rE = find('Empty Student');
T('teacher legacy think=0', rL.think, 0);
T('teacher legacy total=w+d', rL.total, rL.watch+rL.discover);
T('teacher fixed name', rF.name, 'Fixed Student');
T('teacher fixed klass', rF.klass, 'XI MIPA 1');
T('teacher fixed watch', rF.watch, 15);
T('teacher fixed discover', rF.discover, 16);
T('teacher fixed think', rF.think, 22);
T('teacher fixed invent', rF.invent, 20);
T('teacher fixed final', rF.final, 13);
T('teacher fixed total', rF.total, 86);
T('teacher fixed predikat', rF.predikat, 'Baik');
T('teacher fixed invention', rF.invention, 'SmartWudu');
T('teacher empty safe', rE.total, rE.watch+rE.discover);

console.log(fails===0 ? '\nBACKEND TESTS PASSED' : '\n'+fails+' FAILED');
process.exit(fails===0?0:1);
})();
