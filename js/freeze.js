'use strict';

const MMS_FREEZE = (() => {
  const KEY = 'mms-freeze-requests-v1';

  function all() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(requests) {
    localStorage.setItem(KEY, JSON.stringify(requests));
  }

  function mine() {
    const user = MMS_AUTH.currentUser();
    if (!user) return [];
    return all()
      .filter(request => request.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function daysBetween(start, end) {
    const day = 1000 * 60 * 60 * 24;
    return Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / day) + 1;
  }

  function create({ startDate, endDate, reason, notes }) {
    const user = MMS_AUTH.currentUser();
    if (!user) throw new Error('Please log in before submitting a freeze request.');
    if (!startDate || !endDate || !reason) throw new Error('Complete all required fields.');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (start < today) throw new Error('The freeze start date cannot be in the past.');
    if (end < start) throw new Error('The end date must be on or after the start date.');

    const durationDays = daysBetween(startDate, endDate);
    if (durationDays < 7 || durationDays > 60) throw new Error('A freeze request must cover between 7 and 60 days.');

    const requests = all();
    const hasPending = requests.some(item => item.userId === user.id && item.status === 'Pending');
    if (hasPending) throw new Error('You already have a pending freeze request. Cancel it before creating another.');

    const request = {
      id: crypto.randomUUID ? crypto.randomUUID() : `freeze-${Date.now()}`,
      userId: user.id,
      memberName: user.name,
      memberEmail: user.email,
      plan: user.plan || 'Not selected',
      startDate,
      endDate,
      durationDays,
      reason,
      notes: (notes || '').trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      reviewedAt: '',
      reviewNote: ''
    };
    requests.push(request);
    save(requests);
    return request;
  }

  function cancel(id) {
    const user = MMS_AUTH.currentUser();
    if (!user) throw new Error('Your session has expired.');
    const requests = all();
    const index = requests.findIndex(item => item.id === id && item.userId === user.id);
    if (index < 0) throw new Error('Freeze request could not be found.');
    if (requests[index].status !== 'Pending') throw new Error('Only pending requests can be cancelled.');
    requests[index].status = 'Cancelled';
    requests[index].cancelledAt = new Date().toISOString();
    save(requests);
    return requests[index];
  }

  return { all, mine, create, cancel };
})();

function formatFreezeDate(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderFreezeRequests() {
  const list = document.getElementById('freeze-request-list');
  const pendingCount = document.getElementById('pending-freeze-count');
  if (!list) return;
  const requests = MMS_FREEZE.mine();
  if (pendingCount) pendingCount.textContent = requests.filter(item => item.status === 'Pending').length;

  if (!requests.length) {
    list.innerHTML = '<div class="empty-state"><h2>No freeze requests yet</h2><p>Submit a request using the form above. Your history will appear here.</p></div>';
    return;
  }

  list.innerHTML = requests.map(request => `
    <article class="request-row">
      <div>
        <div class="request-heading"><h2>${formatFreezeDate(request.startDate)} – ${formatFreezeDate(request.endDate)}</h2><span class="status-badge ${request.status.toLowerCase()}">${request.status}</span></div>
        <p><strong>${request.durationDays} days</strong> · ${escapeFreezeHtml(request.reason)}</p>
        ${request.notes ? `<p class="helper-text">${escapeFreezeHtml(request.notes)}</p>` : ''}
        <p class="helper-text">Submitted ${new Date(request.createdAt).toLocaleString()}</p>
        ${request.reviewNote ? `<p class="notice">Administrator note: ${escapeFreezeHtml(request.reviewNote)}</p>` : ''}
      </div>
      ${request.status === 'Pending' ? `<button class="button button-small button-outline cancel-freeze" type="button" data-id="${request.id}">Cancel request</button>` : ''}
    </article>
  `).join('');

  list.querySelectorAll('.cancel-freeze').forEach(button => {
    button.addEventListener('click', () => {
      if (!window.confirm('Cancel this pending membership freeze request?')) return;
      try {
        MMS_FREEZE.cancel(button.dataset.id);
        showFreezeMessage('The freeze request was cancelled.');
        renderFreezeRequests();
      } catch (error) {
        showFreezeMessage(error.message, true);
      }
    });
  });
}

function escapeFreezeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

function showFreezeMessage(text, isError = false) {
  const message = document.getElementById('freeze-message');
  if (!message) return;
  message.textContent = text;
  message.className = isError ? 'form-message error' : 'form-message success';
}

const freezeForm = document.getElementById('freeze-form');
if (freezeForm) {
  const user = MMS_AUTH.currentUser();
  if (!user) {
    window.location.replace('../login.html?required=1');
  } else {
    const startInput = freezeForm.startDate;
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    startInput.min = localToday;
    freezeForm.endDate.min = localToday;
    startInput.addEventListener('change', () => { freezeForm.endDate.min = startInput.value || localToday; });

    freezeForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!freezeForm.checkValidity()) {
        freezeForm.reportValidity();
        showFreezeMessage('Please correct the highlighted fields.', true);
        return;
      }
      try {
        MMS_FREEZE.create({
          startDate: freezeForm.startDate.value,
          endDate: freezeForm.endDate.value,
          reason: freezeForm.reason.value,
          notes: freezeForm.notes.value
        });
        freezeForm.reset();
        startInput.min = localToday;
        freezeForm.endDate.min = localToday;
        showFreezeMessage('Your membership freeze request has been submitted for administrator review.');
        renderFreezeRequests();
      } catch (error) {
        showFreezeMessage(error.message, true);
      }
    });
    renderFreezeRequests();
  }
}
