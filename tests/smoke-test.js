/* Smoke test logika scoring (Node, tanpa browser) */
global.localStorage = { _d:{}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=v;}, removeItem(k){delete this._d[k];} };
global.window = global;
const fs = require('fs');
const path = require('path');
const jsDir = path.join(__dirname, '..', 'js');
const code = fs.readFileSync(path.join(jsDir,'state.js'),'utf8')
  + '\n' + fs.readFileSync(path.join(jsDir,'quiz-data.js'),'utf8')
  + '\n;globalThis.API = { clamp, predicateOf, levelOf, computeTotal, setMissionScore, missionStatus, loadState, saveState, defaultState, getS:()=>S, setS:(v)=>{S=v} };';
eval(code);
(function(){
const { clamp, predicateOf, levelOf, computeTotal, setMissionScore, missionStatus, loadState, saveState, defaultState } = globalThis.API;
Object.defineProperty(globalThis, 'S', { get:()=>globalThis.API.getS(), set:(v)=>globalThis.API.setS(v) });

let fails = 0;
function T(name, got, exp){ const ok = got===exp; if(!ok){fails++; console.log('FAIL', name, 'got', got, 'exp', exp);} else console.log('ok  ', name); }


// clamp & predicate
T('clamp neg', clamp(-5, 15), 0);
T('clamp over', clamp(30, 15), 15);
T('clamp normal', clamp(12, 15), 12);
T('predicate 87', predicateOf(87), 'Baik');
T('predicate 95', predicateOf(95), 'Sangat Baik');
T('predicate 75', predicateOf(75), 'Cukup');
T('predicate 60', predicateOf(60), 'Perlu Pengembangan');
T('level 0', levelOf(0), 'Explorer');
T('level 100', levelOf(100), 'Innovation Pioneer');
T('level 50', levelOf(50), 'Thinker');

// setMissionScore → XP akumulatif
setMissionScore('watch', 14, 15);
setMissionScore('discover', 18, 20);
setMissionScore('think', 22, 25);
setMissionScore('invent', 21, 25);
setMissionScore('final', 12, 15);
T('total 87', computeTotal(), 87);
T('xp 100', S.xp, 100);

// quiz scoring sama seperti app.js
let ans = {0:0,1:1,2:2,3:0,4:2}; // semua benar
let qscore = QUIZ.reduce((s,q,i)=> s + (ans[i]===q.correct ? 4:0), 0);
T('quiz full 20', qscore, 20);
ans = {0:1,1:1,2:2,3:1,4:2}; // 3 benar
T('quiz 12', QUIZ.reduce((s,q,i)=> s + (ans[i]===q.correct ? 4:0), 0), 12);

// missionStatus locking
S = defaultState();
T('status m1 active', missionStatus(0), 'active');
T('status m2 locked', missionStatus(1), 'locked');
setMissionScore('watch', 15, 15);
T('status m1 done', missionStatus(0), 'done');
T('status m2 active', missionStatus(1), 'active');
T('status m3 locked', missionStatus(2), 'locked');

// persist
S.studentName='Aisyah'; S.studentClass='X MIPA 1'; saveState();
const loaded = loadState();
T('persist name', loaded.studentName, 'Aisyah');
T('persist score', loaded.scores.watch, 15);

// simulasi rekomputasi backend (mirror Code.gs)
function clampB(n,max){n=Number(n);if(isNaN(n))n=0;return Math.max(0,Math.min(max,Math.round(n)));}
const td={relevance:5,argumentation:8,analysis:4,material_connection:5}; // AI claims total 25 (valid)
const think = clampB(td.relevance,5)+clampB(td.argumentation,10)+clampB(td.analysis,5)+clampB(td.material_connection,5);
T('think 22', think, 22);
const over={relevance:9,argumentation:20,analysis:4,material_connection:5};
const thinkOver = clampB(over.relevance,5)+clampB(over.argumentation,10)+clampB(over.analysis,5)+clampB(over.material_connection,5);
T('think clamped 24', thinkOver, 24);
const final = clampB(4,5)+clampB(5,5)+clampB(4,5);
T('final 13', final, 13);

console.log(fails===0 ? '\nALL TESTS PASSED' : '\n'+fails+' TEST(S) FAILED');
process.exit(fails===0?0:1);
})();
