// ══════════════════════════════════════════════════════════════════
//  AGENDA PRO — calendario para cuadernos tipo "Agenda"
// ══════════════════════════════════════════════════════════════════
//    openAgenda()/closeAgenda()  → abre/cierra el calendario
//    renderCalendar()            → dibuja el mes
//    addAgendaEvent()/deleteAgendaEvent() → eventos por día
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
//  AGENDA PRO
// ══════════════════════════════════════════════════════
let agendaDate = new Date();
let agendaSelectedDay = null;
let agendaEvColor = '#b87040';
const AGENDA_COLORS = ['#b87040','#3498db','#2ecc71','#e74c3c','#9b59b6','#f39c12','#1abc9c'];

function getAgendaEvents() {
  if (!S.agendaEvents) S.agendaEvents = {};
  return S.agendaEvents;
}

function openAgenda() {
  agendaDate = new Date();
  agendaSelectedDay = null;
  buildAgendaColorPick();
  renderAgendaCal();
  document.getElementById('agenda-modal').classList.add('open');
}

function closeAgenda() { document.getElementById('agenda-modal').classList.remove('open'); }

function agendaPrevMonth() { agendaDate.setMonth(agendaDate.getMonth()-1); renderAgendaCal(); }
function agendaNextMonth() { agendaDate.setMonth(agendaDate.getMonth()+1); renderAgendaCal(); }
function agendaGoToday() { agendaDate = new Date(); agendaSelectedDay = null; renderAgendaCal(); }

function renderAgendaCal() {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  document.getElementById('agenda-month-label').textContent = months[agendaDate.getMonth()] + ' ' + agendaDate.getFullYear();
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  const events = getAgendaEvents();
  const today = new Date();
  const y = agendaDate.getFullYear(), m = agendaDate.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m+1, 0);
  // days of week (Monday = 0)
  let startDow = (first.getDay() + 6) % 7;
  // prev month filler
  for (let i = 0; i < startDow; i++) {
    const prev = new Date(y, m, -startDow + i + 1);
    const d = document.createElement('div');
    d.className = 'cal-day other-month';
    d.textContent = prev.getDate();
    grid.appendChild(d);
  }
  for (let day = 1; day <= last.getDate(); day++) {
    const d = document.createElement('div');
    d.className = 'cal-day';
    d.textContent = day;
    const key = y+'-'+(m+1)+'-'+day;
    if (today.getFullYear()===y && today.getMonth()===m && today.getDate()===day) d.classList.add('today');
    if (agendaSelectedDay === key) d.classList.add('selected');
    if (events[key] && events[key].length) d.classList.add('has-events');
    d.onclick = () => { agendaSelectedDay = key; renderAgendaCal(); renderAgendaDay(key, day); };
    grid.appendChild(d);
  }
  if (agendaSelectedDay) {
    const [sy,sm,sd] = agendaSelectedDay.split('-');
    renderAgendaDay(agendaSelectedDay, parseInt(sd));
  }
}

function renderAgendaDay(key, day) {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const [y,m,d2] = key.split('-');
  const dt = new Date(parseInt(y),parseInt(m)-1,parseInt(d2));
  document.getElementById('agenda-day-title').textContent = days[dt.getDay()] + ', ' + day + ' de ' + months[parseInt(m)-1];
  const events = getAgendaEvents();
  const list = events[key] || [];
  document.getElementById('agenda-day-count').textContent = list.length ? list.length + ' evento' + (list.length>1?'s':'') : 'Sin eventos';
  const container = document.getElementById('agenda-events-list');
  container.innerHTML = '';
  if (!list.length) { container.innerHTML = '<div class="agenda-empty">Sin eventos para este día.<br>¡Agregá uno!</div>'; return; }
  const sorted = [...list].sort((a,b) => a.time.localeCompare(b.time));
  sorted.forEach((ev, i) => {
    const item = document.createElement('div');
    item.className = 'agenda-event-item';
    item.style.borderLeftColor = ev.color || '#b87040';
    item.innerHTML = `<div class="agenda-event-time">${ev.time}</div><div class="agenda-event-body"><div class="agenda-event-title">${ev.title}</div>${ev.note?`<div class="agenda-event-note">${ev.note}</div>`:''}</div><span class="agenda-event-del" onclick="deleteAgendaEvent('${key}',${i})"><svg class="icon"><use href="#i-close"/></svg></span>`;
    container.appendChild(item);
  });
}

function addAgendaEvent() {
  if (!agendaSelectedDay) { toast2('Seleccioná un día primero'); return; }
  const title = document.getElementById('agenda-ev-title').value.trim();
  if (!title) { toast2('Ingresá un título para el evento'); return; }
  const time = document.getElementById('agenda-ev-time').value || '09:00';
  const note = document.getElementById('agenda-ev-note').value.trim();
  const events = getAgendaEvents();
  if (!events[agendaSelectedDay]) events[agendaSelectedDay] = [];
  events[agendaSelectedDay].push({ title, time, note, color: agendaEvColor });
  document.getElementById('agenda-ev-title').value = '';
  document.getElementById('agenda-ev-note').value = '';
  sched();
  renderAgendaDay(agendaSelectedDay, parseInt(agendaSelectedDay.split('-')[2]));
  renderAgendaCal();
  toast2('Evento agregado');
}

function deleteAgendaEvent(key, idx) {
  const events = getAgendaEvents();
  if (!events[key]) return;
  events[key].splice(idx, 1);
  if (!events[key].length) delete events[key];
  sched();
  renderAgendaDay(key, parseInt(key.split('-')[2]));
  renderAgendaCal();
}

function buildAgendaColorPick() {
  const row = document.getElementById('agenda-color-pick');
  row.innerHTML = '';
  AGENDA_COLORS.forEach(c => {
    const d = document.createElement('div');
    d.className = 'agenda-ev-color' + (c === agendaEvColor ? ' on' : '');
    d.style.background = c;
    d.onclick = () => { agendaEvColor = c; document.querySelectorAll('.agenda-ev-color').forEach(x=>x.classList.remove('on')); d.classList.add('on'); };
    row.appendChild(d);
  });
}
