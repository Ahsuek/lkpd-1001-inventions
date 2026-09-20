/* ===== State + localStorage ===== */
const STORAGE_KEY = '1001inventions_state_v1';

const MISSION_KEYS = ['watch', 'discover', 'think', 'invent', 'final'];
const MISSION_META = [
  { key:'watch',   num:'01', name:'WATCH & HUNT', short:'WATCH & HUNT', xp:15, max:15 },
  { key:'discover',num:'02', name:'DISCOVER',     short:'DISCOVER',     xp:20, max:20 },
  { key:'think',   num:'03', name:'THINK DEEPER', short:'THINK',        xp:25, max:25 },
  { key:'invent',  num:'04', name:'INVENT',       short:'INVENT',       xp:25, max:25 },
  { key:'final',   num:'05', name:'FINAL CHALLENGE', short:'FINAL',     xp:15, max:15 }
];

function defaultState(){
  return {
    studentName:'', studentClass:'',
    currentMission:null,
    answers:{},
    scores:{ watch:0, discover:0, think:0, invent:0, final:0 },
    xp:0,
    aiFeedback:{},       // per mission: {good, improve, followup, ...}
    invention:null,      // {name, problem, inspired, how, who, benefit, sketch}
    finalResult:null,
    submissionStatus:'draft' // draft | pending | submitted
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const s = JSON.parse(raw);
    return Object.assign(defaultState(), s);
  }catch(e){ return null; }
}
let S = loadState() || defaultState();

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
  catch(e){ console.warn('localStorage gagal:', e); }
}

function clamp(n, max){ n = Number(n); if(isNaN(n)) n = 0; return Math.max(0, Math.min(max, n)); }

function computeTotal(){
  const t = MISSION_KEYS.reduce((a,k)=> a + clamp(S.scores[k], {watch:15,discover:20,think:25,invent:25,final:15}[k]), 0);
  return Math.round(t);
}

function predicateOf(total){
  if(total >= 90) return 'Sangat Baik';
  if(total >= 80) return 'Baik';
  if(total >= 70) return 'Cukup';
  return 'Perlu Pengembangan';
}

function levelOf(xp){
  if(xp >= 81) return 'Innovation Pioneer';
  if(xp >= 61) return 'Inventor';
  if(xp >= 41) return 'Thinker';
  if(xp >= 21) return 'Discoverer';
  return 'Explorer';
}

function missionStatus(idx){ // idx 0..4
  if(S.scores[MISSION_KEYS[idx]] > 0 || (idx===0 && isWatchDone())) return 'done';
  if(idx===0) return 'active';
  const prev = missionStatus(idx-1);
  return prev==='done' ? 'active' : 'locked';
}
function isWatchDone(){
  const a = S.answers.watch || {};
  return ['s1','s2','s3','i1','i2','i3','surprise','newknowledge'].every(k=> (a[k]||'').trim().length>1);
}
function highestOpenMission(){
  for(let i=0;i<5;i++){ if(missionStatus(i)==='active') return i; }
  return 4;
}
function allDone(){
  return MISSION_KEYS.every(k=> clamp(S.scores[k],999) > 0 || k==='watch' && isWatchDone());
}
function setMissionScore(key, val, max){
  S.scores[key] = clamp(val, max);
  S.xp = MISSION_KEYS.reduce((a,k)=> a + (S.scores[k]>0 ? MISSION_META.find(m=>m.key===k).xp : 0), 0);
  saveState();
}
