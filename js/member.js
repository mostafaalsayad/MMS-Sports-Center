'use strict';

const member = MMS_AUTH.currentUser();
if (!member) {
  window.location.replace('../login.html?required=1');
} else {
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const firstName = member.name.split(' ')[0];
  setText('account-name', member.name);
  setText('welcome-heading', `Welcome, ${firstName}`);
  setText('membership-plan', member.plan || 'Not selected');
  setText('membership-status', member.membershipStatus || 'Pending');
  setText('member-name', member.name);
  setText('member-email', member.email);
  setText('joined-date', `Account created ${new Date(member.joinedAt).toLocaleDateString()}`);

  const preferences = member.accessibility || {};
  const selectedCount = Object.entries(preferences).filter(([key, value]) => key !== 'notes' && value === true).length;
  setText('accessibility-count', selectedCount);
  setText('profile-completion', calculateCompletion(member));
}

function calculateCompletion(user) {
  const fields = [user.name, user.email, user.phone, user.dateOfBirth, user.emergencyContact];
  const complete = fields.filter(Boolean).length;
  return `${Math.round((complete / fields.length) * 100)}%`;
}

document.getElementById('logout-button')?.addEventListener('click', MMS_AUTH.logout);
