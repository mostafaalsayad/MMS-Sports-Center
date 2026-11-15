'use strict';

const MMS_BOOKINGS = (() => {
  const KEY = 'mms-bookings-v1';
  const sessions = [
    { id:'gym-early', sport:'Gym', title:'Open Gym – Early Access', day:'Monday', time:'07:00', duration:90, capacity:18, location:'Fitness Suite', tags:['stepFree','beginnerFriendly'], description:'Independent gym access with a floor assistant available.' },
    { id:'gym-strength', sport:'Gym', title:'Beginner Strength Circuit', day:'Tuesday', time:'18:00', duration:60, capacity:12, location:'Studio 1', tags:['stepFree','beginnerFriendly','staffAssistance'], description:'A coached full-body circuit suitable for new members.' },
    { id:'swim-lanes', sport:'Swimming', title:'Accessible Lane Swimming', day:'Wednesday', time:'10:30', duration:60, capacity:10, location:'Main Pool', tags:['stepFree','wheelchair','staffAssistance'], description:'Quiet lane session with pool hoist and staff assistance available.' },
    { id:'swim-family', sport:'Swimming', title:'Community Swim', day:'Saturday', time:'13:00', duration:75, capacity:20, location:'Main Pool', tags:['stepFree','beginnerFriendly'], description:'Relaxed recreational swimming for mixed ability levels.' },
    { id:'basketball-social', sport:'Basketball', title:'Social Basketball', day:'Thursday', time:'19:00', duration:90, capacity:16, location:'Sports Hall', tags:['stepFree','hearingSupport','beginnerFriendly'], description:'Friendly mixed-level game with clear visual session instructions.' },
    { id:'basketball-wheelchair', sport:'Basketball', title:'Wheelchair Basketball', day:'Sunday', time:'15:00', duration:90, capacity:14, location:'Sports Hall', tags:['stepFree','wheelchair','staffAssistance'], description:'Inclusive wheelchair basketball session; sports chairs can be requested.' },
    { id:'tennis-coaching', sport:'Tennis', title:'Beginner Tennis Coaching', day:'Friday', time:'17:30', duration:60, capacity:8, location:'Indoor Court 2', tags:['stepFree','visualSupport','beginnerFriendly'], description:'Small-group coaching using high-visibility balls when requested.' },
    { id:'tennis-open', sport:'Tennis', title:'Open Court Practice', day:'Sunday', time:'09:00', duration:60, capacity:4, location:'Outdoor Court 1', tags:[], description:'Book a court place for independent practice.' }
  ];

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = items => localStorage.setItem(KEY, JSON.stringify(items));
  const currentUser = () => MMS_AUTH.currentUser();
  const all = () => read();
  const mine = () => { const user=currentUser(); return user ? read().filter(x=>x.userId===user.id) : []; };
  const sessionById = id => sessions.find(x=>x.id===id);
  const countForSession = id => read().filter(x=>x.sessionId===id && x.status==='Confirmed').length;

  function create(sessionId) {
    const user=currentUser();
    if(!user) throw new Error('Please log in before making a booking.');
    const session=sessionById(sessionId);
    if(!session) throw new Error('This session is no longer available.');
    const items=read();
    if(items.some(x=>x.userId===user.id && x.sessionId===sessionId && x.status==='Confirmed')) throw new Error('You already have a confirmed booking for this session.');
    if(countForSession(sessionId)>=session.capacity) throw new Error('This session is fully booked.');
    const booking={id:crypto.randomUUID?crypto.randomUUID():`booking-${Date.now()}`,userId:user.id,sessionId,status:'Confirmed',createdAt:new Date().toISOString()};
    items.push(booking); write(items); return booking;
  }

  function cancel(id) {
    const user=currentUser();
    const items=read();
    const index=items.findIndex(x=>x.id===id && x.userId===user?.id);
    if(index<0) throw new Error('Booking could not be found.');
    if(items[index].status==='Cancelled') throw new Error('This booking has already been cancelled.');
    items[index]={...items[index],status:'Cancelled',cancelledAt:new Date().toISOString()};
    write(items); return items[index];
  }

  return { sessions, all, mine, create, cancel, sessionById, countForSession };
})();

const ACCESS_LABELS={stepFree:'Step-free',wheelchair:'Wheelchair access',visualSupport:'Visual support',hearingSupport:'Hearing support',beginnerFriendly:'Beginner friendly',staffAssistance:'Staff assistance'};

function bookingMessage(el,text,error=false){ if(!el)return; el.textContent=text; el.className=`form-message ${error?'error':'success'}`; }
function requireMember(){ if(!MMS_AUTH.currentUser()){ window.location.href='login.html?required=1'; return false; } return true; }

function renderSessionCards(){
  const grid=document.getElementById('session-grid'); if(!grid)return;
  const sport=document.getElementById('sport-filter');
  const accessibility=document.getElementById('access-filter');
  const query=document.getElementById('session-search');
  const message=document.getElementById('booking-message');
  const draw=()=>{
    const selectedSport=sport?.value||'all'; const access=accessibility?.value||'all'; const term=(query?.value||'').trim().toLowerCase();
    const mine=MMS_AUTH.currentUser()?MMS_BOOKINGS.mine():[];
    const filtered=MMS_BOOKINGS.sessions.filter(s=>(selectedSport==='all'||s.sport===selectedSport)&&(access==='all'||s.tags.includes(access))&&(!term||`${s.title} ${s.sport} ${s.location}`.toLowerCase().includes(term)));
    grid.innerHTML=filtered.length?'':'<div class="empty-state"><h2>No matching sessions</h2><p>Try changing one or more filters.</p></div>';
    filtered.forEach(session=>{
      const remaining=Math.max(0,session.capacity-MMS_BOOKINGS.countForSession(session.id));
      const already=mine.some(x=>x.sessionId===session.id&&x.status==='Confirmed');
      const card=document.createElement('article'); card.className='session-card';
      card.innerHTML=`<div class="session-card-head"><span class="sport-pill">${session.sport}</span><span class="availability ${remaining===0?'full':''}">${remaining} place${remaining===1?'':'s'} left</span></div><h2>${session.title}</h2><p>${session.description}</p><dl class="session-meta"><div><dt>Day</dt><dd>${session.day}</dd></div><div><dt>Time</dt><dd>${session.time}</dd></div><div><dt>Duration</dt><dd>${session.duration} minutes</dd></div><div><dt>Location</dt><dd>${session.location}</dd></div></dl><div class="tag-row light-tags">${session.tags.map(t=>`<span>${ACCESS_LABELS[t]}</span>`).join('')||'<span>Standard session</span>'}</div><button class="button button-block book-button" data-session="${session.id}" ${remaining===0||already?'disabled':''}>${already?'Already booked':remaining===0?'Fully booked':'Book this session'}</button>`;
      grid.appendChild(card);
    });
  };
  [sport,accessibility,query].forEach(el=>el?.addEventListener(el===query?'input':'change',draw));
  grid.addEventListener('click',event=>{
    const button=event.target.closest('.book-button'); if(!button)return;
    if(!MMS_AUTH.currentUser()){ window.location.href='login.html?required=1'; return; }
    try { MMS_BOOKINGS.create(button.dataset.session); bookingMessage(message,'Booking confirmed. It is now visible in your member area.'); draw(); }
    catch(error){ bookingMessage(message,error.message,true); }
  });
  draw();
}

function renderMyBookings(){
  const list=document.getElementById('my-bookings'); if(!list)return;
  const message=document.getElementById('booking-message');
  const draw=()=>{
    const bookings=MMS_BOOKINGS.mine().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    document.getElementById('booking-count').textContent=bookings.filter(x=>x.status==='Confirmed').length;
    if(!bookings.length){ list.innerHTML='<div class="empty-state"><h2>No bookings yet</h2><p>Browse the timetable and reserve your first sports session.</p><a class="button" href="../sessions.html">Browse sessions</a></div>'; return; }
    list.innerHTML='';
    bookings.forEach(booking=>{
      const session=MMS_BOOKINGS.sessionById(booking.sessionId); if(!session)return;
      const item=document.createElement('article'); item.className='booking-row';
      item.innerHTML=`<div><span class="sport-pill">${session.sport}</span><h2>${session.title}</h2><p>${session.day} at ${session.time} · ${session.location}</p><small>Booked ${new Date(booking.createdAt).toLocaleString()}</small></div><div class="booking-actions"><span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>${booking.status==='Confirmed'?`<button class="button button-small button-outline cancel-booking" data-id="${booking.id}">Cancel</button>`:''}</div>`;
      list.appendChild(item);
    });
  };
  list.addEventListener('click',event=>{ const button=event.target.closest('.cancel-booking'); if(!button)return; if(!confirm('Cancel this booking?'))return; try{MMS_BOOKINGS.cancel(button.dataset.id);bookingMessage(message,'Booking cancelled successfully.');draw();}catch(error){bookingMessage(message,error.message,true);} });
  draw();
}

document.addEventListener('DOMContentLoaded',()=>{ renderSessionCards(); renderMyBookings(); });
