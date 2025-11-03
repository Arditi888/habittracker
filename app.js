// Utilities
const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>Array.from(document.querySelectorAll(sel));
const todayISO = ()=>new Date().toISOString().slice(0,10);
const pad = n => String(n).padStart(2,'0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const startOfWeekMon = (d)=>{ const x=new Date(d); const day=(x.getDay()+6)%7; x.setHours(0,0,0,0); x.setDate(x.getDate()-day); return x; };
const addDays = (d,n)=>{ const x=new Date(d); x.setDate(x.getDate()+n); return x; };

// Data
const DAILY_STEPS = [
  {time:'07:00', action:'🌅 Wake Up', details:'500 ml water + L-Carnitine 1500 mg (liquid or caps)', key:'wake'},
  {time:'07:10', action:'☕ Optional caffeine', details:'Espresso or ½ scoop Pre-Workout (only on heavy days)', key:'caffeine'},
  {time:'07:30 – 08:30', action:'🏋️‍♂️ Gym Session', details:'Push / Pull / Legs or Full Body depending on day. Sip Electrolyte Mix during.', key:'gym'},
  {time:'08:45', action:'🥤 Post-Workout', details:'Whey Isolate 1 scoop + Creatine Monohydrate 5 g', key:'post'},
  {time:'09:00 – 09:30', action:'🚿 Shower & get ready', details:'Optional breakfast: Greek yogurt or 2 boiled eggs + fruit', key:'shower'},
  {time:'12:30', action:'🍗 Lunch', details:'Chicken/fish + rice/quinoa + veggies + olive oil. Supps: 2 × Omega-3 (1000 mg) + 1 Blackstack Multivitamin', key:'lunch'},
  {time:'16:00', action:'🍌 Snack / Shake', details:'Whey Isolate 1 scoop + banana or rice cake', key:'snack'},
  {time:'18:30 – 19:00', action:'🍽 Dinner', details:'200 g lean beef/fish + veggies + ½ avocado', key:'dinner'},
  {time:'21:00', action:'🍶 Optional snack', details:'150 g Greek yogurt or casein shake', key:'lateSnack'},
  {time:'22:30', action:'🌙 Bed prep', details:'Take ZMA (1 cap) on empty stomach, stretch, no screens', key:'bedPrep'},
  {time:'23:00', action:'😴 Sleep', details:'Minimum 7–8 hours', key:'sleep'}
];
const WEEK_PLAN = [
  {day:'Monday',    focus:'Push',                workout:'Chest, Shoulders, Triceps',       cardio:'10–15 min HIIT'},
  {day:'Tuesday',   focus:'Pull',                workout:'Back, Biceps',                    cardio:'10 min incline treadmill'},
  {day:'Wednesday', focus:'Legs',                workout:'Squats, Lunges, Leg Press',       cardio:'15 min bike or stairmaster'},
  {day:'Thursday',  focus:'Upper Body Strength', workout:'Bench, Rows, Press',               cardio:'Optional 10 min walk'},
  {day:'Friday',    focus:'Full Body + HIIT',    workout:'Compound lifts + 15 min finisher', cardio:'Included in workout'},
  {day:'Saturday',  focus:'Active Recovery',     workout:'45 min walk, swim, or light jog', cardio:'Low intensity'},
  {day:'Sunday',    focus:'Rest',                workout:'Stretching or complete rest',      cardio:'Optional walk'}
];
const SUPP_RECAP = [
  {sup:'L-Carnitine', dose:'1500 mg', timing:'07:00 (fasted)', purpose:'Fat metabolism', key:'lcarnitine'},
  {sup:'Pre-Workout', dose:'½ scoop', timing:'07:10 (optional)', purpose:'Energy & focus', key:'preworkout'},
  {sup:'Electrolyte Mix', dose:'1 scoop', timing:'During training', purpose:'Hydration & endurance', key:'electrolyte'},
  {sup:'Whey Protein Isolate', dose:'1–2 scoops', timing:'Post-workout + Snack', purpose:'Recovery & muscle preservation', key:'whey'},
  {sup:'Creatine Monohydrate', dose:'5 g', timing:'Post-workout', purpose:'Strength & ATP regeneration', key:'creatine'},
  {sup:'Omega-3 Fish Oil', dose:'2 × 1000 mg', timing:'Lunch', purpose:'Heart, joints, fat burn support', key:'omega3'},
  {sup:'Applied Nutrition Blackstack', dose:'1 packet', timing:'Lunch', purpose:'Vitamins, minerals, antioxidants', key:'blackstack'},
  {sup:'ZMA', dose:'1 cap', timing:'22:30', purpose:'Sleep, testosterone, recovery', key:'zma'}
];
const SNAPSHOT_DEFAULT = [
  {day:'Mon', wake:'07:00', train:'07:30', work:'09:30–17:30', sleep:'23:00', note:'Push day — strong start'},
  {day:'Tue', wake:'07:00', train:'07:30', work:'09:30–17:30', sleep:'23:00', note:'Pull day — focus on form'},
  {day:'Wed', wake:'07:00', train:'07:30', work:'09:30–17:30', sleep:'23:00', note:'Legs — challenge yourself'},
  {day:'Thu', wake:'07:00', train:'07:30', work:'09:30–17:30', sleep:'23:00', note:'Strength — heavy compounds'},
  {day:'Fri', wake:'07:00', train:'07:30', work:'09:30–17:30', sleep:'23:00', note:'Full-body + HIIT finisher'},
  {day:'Sat', wake:'08:00', train:'Walk/Swim', work:'—', sleep:'23:00', note:'Active recovery + stretch'},
  {day:'Sun', wake:'08:00', train:'—', work:'—', sleep:'23:00', note:'Rest, prep meals, plan week'}
];

// Storage
const KEY='habit_tracker_itinerary_v1';
let state = load() || { dailyDone:{}, weekly:{}, suppsTaken:{}, snapshot:{} };
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } }
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }

// Tabs
$$('.tab').forEach(btn=>btn.addEventListener('click', ()=>{
  $$('.tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const id = btn.dataset.page;
  $$('.page').forEach(p=>p.hidden = p.id !== 'page-'+id);
  if(id==='daily') renderDaily();
  if(id==='weekly') renderWeekly();
  if(id==='supps') renderSupps();
  if(id==='snapshot') renderSnapshot();
}));

// Daily
function renderDaily(){
  const dateInput = $('#dailyDate');
  if(!dateInput.value) dateInput.value = todayISO();
  const iso = dateInput.value;
  const done = state.dailyDone[iso] || {};
  const tb = $('#dailyTable tbody'); tb.innerHTML='';
  DAILY_STEPS.forEach(step=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="nowrap">${step.time}</td><td>${step.action}</td><td>${step.details}</td>`;
    const td = document.createElement('td');
    const chk = document.createElement('input'); chk.type='checkbox'; chk.checked = !!done[step.key];
    chk.onchange = ()=>{
      (state.dailyDone[iso] ||= {});
      if(chk.checked){ state.dailyDone[iso][step.key]=true; }
      else delete state.dailyDone[iso][step.key];
      save();
    };
    td.appendChild(chk);
    tr.appendChild(td);
    tb.appendChild(tr);
  });
}
$('#btnDailyToday').onclick = ()=>{ $('#dailyDate').value = todayISO(); renderDaily(); };
$('#dailyDate').addEventListener('change', renderDaily);
$('#btnDailyReset').onclick = ()=>{ const iso=$('#dailyDate').value||todayISO(); delete state.dailyDone[iso]; save(); renderDaily(); };

// Weekly
let weekOffset = 0;
function weekKeyForOffset(off=0){
  const start = startOfWeekMon(new Date());
  start.setDate(start.getDate() + off*7);
  const year = start.getFullYear();
  const first = startOfWeekMon(new Date(year,0,4));
  const week = Math.round((start - first)/(7*24*3600*1000)) + 1;
  return {start, key:`${year}-W${String(week).padStart(2,'0')}`};
}
function renderWeekly(){
  const {start, key} = weekKeyForOffset(weekOffset);
  $('#weekLabel').textContent = `${key} (${ymd(start)} → ${ymd(addDays(start,6))})`;
  const tb=$('#weeklyTable tbody'); tb.innerHTML='';
  for(let i=0;i<7;i++){
    const cfg = WEEK_PLAN[i];
    const date = addDays(start,i);
    const iso = ymd(date);
    const wk = (state.weekly[key] ||= {});
    const day = (wk[iso] ||= {workout:false, cardio:false});
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${cfg.day}</td><td class="nowrap">${iso}</td><td>${cfg.focus}</td><td>${cfg.workout}</td><td>${cfg.cardio}</td>`;
    const tdW = document.createElement('td');
    const tdC = document.createElement('td');
    const ckw = document.createElement('input'); ckw.type='checkbox'; ckw.checked = !!day.workout;
    const ckc = document.createElement('input'); ckc.type='checkbox'; ckc.checked = !!day.cardio;
    ckw.onchange = ()=>{ day.workout = !!ckw.checked; save(); };
    ckc.onchange = ()=>{ day.cardio  = !!ckc.checked; save(); };
    tdW.appendChild(ckw); tdC.appendChild(ckc);
    tr.appendChild(tdW); tr.appendChild(tdC);
    tb.appendChild(tr);
  }
}
$('#btnWeekThis').onclick = ()=>{ weekOffset=0; renderWeekly(); };
$('#btnWeekPrev').onclick = ()=>{ weekOffset--; renderWeekly(); };
$('#btnWeekNext').onclick = ()=>{ weekOffset++; renderWeekly(); };
$('#btnWeekReset').onclick = ()=>{ const {key}=weekKeyForOffset(weekOffset); delete state.weekly[key]; save(); renderWeekly(); };

// Supplements
function renderSupps(){
  const dateInput = $('#suppsDate');
  if(!dateInput.value) dateInput.value = todayISO();
  const iso = dateInput.value;
  const taken = state.suppsTaken[iso] || {};
  const tb = $('#suppsTable tbody'); tb.innerHTML='';
  SUPP_RECAP.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.sup}</td><td>${r.dose}</td><td>${r.timing}</td><td>${r.purpose}</td>`;
    const td = document.createElement('td');
    const chk = document.createElement('input'); chk.type='checkbox'; chk.checked = !!taken[r.key];
    chk.onchange = ()=>{
      (state.suppsTaken[iso] ||= {});
      if(chk.checked){ state.suppsTaken[iso][r.key]=true; } else delete state.suppsTaken[iso][r.key];
      save();
    };
    td.appendChild(chk); tr.appendChild(td); tb.appendChild(tr);
  });
}
$('#btnSuppsToday').onclick = ()=>{ $('#suppsDate').value = todayISO(); renderSupps(); };
$('#suppsDate').addEventListener('change', renderSupps);
$('#btnSuppsReset').onclick = ()=>{ const iso=$('#suppsDate').value||todayISO(); delete state.suppsTaken[iso]; save(); renderSupps(); };

// Snapshot
let snapOffset = 0;
function renderSnapshot(){
  const start = startOfWeekMon(new Date());
  start.setDate(start.getDate()+snapOffset*7);
  const year = start.getFullYear();
  const first = startOfWeekMon(new Date(year,0,4));
  const week = Math.round((start - first)/(7*24*3600*1000)) + 1;
  const key = `${year}-W${String(week).padStart(2,'0')}`;
  $('#snapWeekLabel').textContent = `${key} (${ymd(start)} → ${ymd(addDays(start,6))})`;
  const tb=$('#snapshotTable tbody'); tb.innerHTML='';
  const weekObj = (state.snapshot[key] ||= {});
  for(let i=0;i<7;i++){
    const cfg = SNAPSHOT_DEFAULT[i];
    const date = addDays(start,i);
    const iso = ymd(date);
    const row = (weekObj[iso] ||= {note:'', done:false});
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${cfg.day}</td><td class="nowrap">${iso}</td><td>${cfg.wake}</td><td>${cfg.train}</td><td>${cfg.work}</td><td>${cfg.sleep}</td>`;
    const tdNote = document.createElement('td');
    const note = document.createElement('textarea'); note.placeholder = cfg.note; note.value=row.note||''; note.oninput = ()=>{ row.note = note.value; save(); };
    tdNote.appendChild(note);
    const tdDone = document.createElement('td');
    const chk = document.createElement('input'); chk.type='checkbox'; chk.checked = !!row.done; chk.onchange = ()=>{ row.done = !!chk.checked; save(); };
    tdDone.appendChild(chk);
    tr.appendChild(tdNote); tr.appendChild(tdDone);
    tb.appendChild(tr);
  }
}
$('#btnSnapThis').onclick = ()=>{ snapOffset=0; renderSnapshot(); };
$('#btnSnapPrev').onclick = ()=>{ snapOffset--; renderSnapshot(); };
$('#btnSnapNext').onclick = ()=>{ snapOffset++; renderSnapshot(); };
$('#btnSnapReset').onclick = ()=>{
  const start = startOfWeekMon(new Date()); start.setDate(start.getDate()+snapOffset*7);
  const year = start.getFullYear();
  const first = startOfWeekMon(new Date(year,0,4));
  const week = Math.round((start - first)/(7*24*3600*1000)) + 1;
  const key = `${year}-W${String(week).padStart(2,'0')}`;
  delete state.snapshot[key]; save(); renderSnapshot();
};

// Init
(function init(){
  renderDaily();
})();