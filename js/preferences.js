'use strict';

const preferenceUser = MMS_AUTH.currentUser();
if (!preferenceUser) {
  window.location.replace('../login.html?required=1');
} else {
  document.getElementById('account-name').textContent = preferenceUser.name;
  const form = document.getElementById('preferences-form');
  const saved = preferenceUser.accessibility || {};
  ['stepFree','wheelchair','visualSupport','hearingSupport','beginnerFriendly','staffAssistance'].forEach(name => {
    if (form.elements[name]) form.elements[name].checked = Boolean(saved[name]);
  });
  form.notes.value = saved.notes || '';

  form.addEventListener('submit', event => {
    event.preventDefault();
    const accessibility = {
      stepFree: form.stepFree.checked,
      wheelchair: form.wheelchair.checked,
      visualSupport: form.visualSupport.checked,
      hearingSupport: form.hearingSupport.checked,
      beginnerFriendly: form.beginnerFriendly.checked,
      staffAssistance: form.staffAssistance.checked,
      notes: form.notes.value.trim().slice(0, 500)
    };
    try {
      MMS_AUTH.updateCurrentUser({ accessibility });
      authMessage(form.querySelector('.form-message'), 'Accessibility preferences saved successfully.');
    } catch (error) {
      authMessage(form.querySelector('.form-message'), error.message, true);
    }
  });
}

document.getElementById('logout-button')?.addEventListener('click', MMS_AUTH.logout);
