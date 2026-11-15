'use strict';

const profileUser = MMS_AUTH.currentUser();
if (!profileUser) {
  window.location.replace('../login.html?required=1');
} else {
  document.getElementById('account-name').textContent = profileUser.name;
  const form = document.getElementById('profile-form');
  form.name.value = profileUser.name || '';
  form.email.value = profileUser.email || '';
  form.phone.value = profileUser.phone || '';
  form.dateOfBirth.value = profileUser.dateOfBirth || '';
  form.emergencyContact.value = profileUser.emergencyContact || '';

  form.addEventListener('submit', event => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    if (!form.checkValidity()) {
      form.reportValidity();
      authMessage(message, 'Please correct the highlighted fields.', true);
      return;
    }
    try {
      const updated = MMS_AUTH.updateCurrentUser({
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        dateOfBirth: form.dateOfBirth.value,
        emergencyContact: form.emergencyContact.value.trim()
      });
      document.getElementById('account-name').textContent = updated.name;
      authMessage(message, 'Profile updated successfully.');
    } catch (error) {
      authMessage(message, error.message, true);
    }
  });
}

document.getElementById('logout-button')?.addEventListener('click', MMS_AUTH.logout);
