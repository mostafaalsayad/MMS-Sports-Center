'use strict';

const membershipUser = MMS_AUTH.currentUser();
if (!membershipUser) {
  window.location.replace('../login.html?required=1');
} else {
  document.getElementById('account-name').textContent = membershipUser.name;
  document.getElementById('current-plan').textContent = membershipUser.plan || 'Not selected';
  document.getElementById('current-status').textContent = membershipUser.membershipStatus || 'Pending';
  document.getElementById('membership-start').textContent = membershipUser.membershipStart || 'Begins after administrator approval';
  document.getElementById('membership-end').textContent = membershipUser.membershipEnd || 'Not available yet';

  const form = document.getElementById('plan-form');
  form.plan.value = membershipUser.plan || 'Active';
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const updated = MMS_AUTH.updateCurrentUser({ plan: form.plan.value, membershipStatus: 'Pending' });
      document.getElementById('current-plan').textContent = updated.plan;
      document.getElementById('current-status').textContent = updated.membershipStatus;
      authMessage(form.querySelector('.form-message'), 'Plan preference updated. Administrator approval is pending.');
    } catch (error) {
      authMessage(form.querySelector('.form-message'), error.message, true);
    }
  });
}

document.getElementById('logout-button')?.addEventListener('click', MMS_AUTH.logout);
