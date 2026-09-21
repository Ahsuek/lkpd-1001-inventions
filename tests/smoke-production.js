/* Production smoke test — verifikasi fix Teacher Result (commit 996a7af) TANPA menyentuh data siswa asli.
 * Cara pakai:  node tests/smoke-production.js
 *
 * - POST 1 payload TEST ke API production (API_URL dari js/config.js).
 * - Payload menyerupai frontend SETELAH fix: aiFeedback menyertakan komponen numerik.
 * - Verifikasi response saveResult, lalu verifikasi baris muncul di teacherData.
 * - Cleanup: backend melakukan UPSERT berdasarkan kunci Nama+Kelas, jadi pengujian
 *   berulang selalu menimpa baris TEST yang sama (tidak menumpuk data sampah).
 *   API tidak menyediakan action delete (dan Code.gs tidak boleh diubah), sehingga
 *   baris "TEST AUTO 1001 / TEST" perlu dihapus manual dari Google Sheets jika diinginkan.
 */
const fs = require('fs');
const path = require('path');

const API_URL = (function(){
  // baca API_URL dari js/config.js tanpa browser
  const src = fs.readFileSync(path.join(__dirname,'..','js','config.js'),'utf8');
  const m = src.match(/API_URL:\s*"([^"]+)"/);
  return m && m[1];
})();

let fails = 0;
function T(n,g,e){ const ok=JSON.stringify(g)===JSON.stringify(e); if(!ok){fails++;console.log('FAIL',n,'got',JSON.stringify(g),'exp',JSON.stringify(e));} else console.log('ok  ',n); }

const NAME = 'TEST AUTO 1001';
const KLASS = 'TEST';

// Payload frontend pasca-fix 996a7af: komponen numerik AI ikut di S.aiFeedback dan dikirim ke saveResult
const payload = {
  action: 'saveResult',
  name: NAME,
  klass: KLASS,
  answers: {
    watch: {
      s1: 'Ibn al-Haytham', s2: 'Al-Khwarizmi', s3: 'Ibnu Sina',
      i1: 'kamera obscura', i2: 'aljabar', i3: 'rumah sakit',
      surprise: 'test otomatis — surprise panjang lebih dari lima belas karakter',
      newknowledge: 'test otomatis — newknowledge panjang lebih dari lima belas karakter'
    },
    discover: { 0:0, 1:1, 2:2, 3:0, 4:2 } // semua benar → 20
  },
  scores: { watch:15, discover:20, think:22, invent:20, final:13 },
  invention: { name:'TEST Invention', problem:'test problem', inspired:'Ibn al-Haytham', how:'test how it works', who:'test who benefits', benefit:'test benefit' },
  finalResult: { challenge:'test challenge', answer:'jawaban final test otomatis yang cukup panjang dan beralasan' },
  aiFeedback: {
    think:  { relevance:5, argumentation:8, analysis:4, material_connection:5, good:'g', improve:'i', followup:'f' },
    invent: { problem:4, creativity:4, solution:8, benefit:4, good:'g', improve:'i', scientist_connection:'s', challenge:'c' },
    final:  { relevance:4, reasoning:5, solution:4, good:'g', improve:'i', followup:'f' }
  },
  xp: 100
};

(async function(){
  if(!API_URL){ console.log('FAIL API_URL tidak ditemukan di js/config.js'); process.exit(1); }
  console.log('API:', API_URL, '\n');

  // 1) POST saveResult
  const res = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) });
  T('HTTP 200', res.status, 200);
  const out = await res.json();
  T('saveResult ok', out.ok, true);

  // 2) Backend menghitung ulang → skor resmi
  T('watch=15', out.scores.watch, 15);
  T('discover=20', out.scores.discover, 20);
  T('think=22', out.scores.think, 22);
  T('invent=20', out.scores.invent, 20);
  T('final=13', out.scores.final, 13);
  T('total=90', out.total, 90);
  T('predikat', out.predikat, 'Sangat Baik');
  T('xp=100', out.xp, 100);

  // 3) Data muncul di teacherData
  const tres = await fetch(API_URL + '?action=teacherData');
  const t = await tres.json();
  T('teacherData ok', t.ok, true);
  const row = (t.rows||[]).find(r => r.name === NAME && r.klass === KLASS);
  T('teacher row ditemukan', !!row, true);
  if(row){
    T('teacher name', row.name, NAME);
    T('teacher watch', row.watch, 15);
    T('teacher discover', row.discover, 20);
    T('teacher think', row.think, 22);
    T('teacher invent', row.invent, 20);
    T('teacher final', row.final, 13);
    T('teacher total', row.total, 90);
    T('teacher predikat', row.predikat, 'Sangat Baik');
    T('teacher invention', row.invention, 'TEST Invention');
  }

  console.log(fails===0 ? '\nPRODUCTION SMOKE TEST PASSED' : '\n'+fails+' FAILED');
  console.log('\nNOTE: baris TEST "'+NAME+'" / "'+KLASS+'" tersimpan di sheet RESPONSES (upsert: test ulang menimpa baris yang sama). Hapus manual jika perlu.');
  process.exit(fails===0?0:1);
})().catch(e=>{ console.error('ERROR:', e.message); process.exit(1); });
