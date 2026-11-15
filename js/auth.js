'use strict';

/*
 * MMS Sports Center
 * Firebase Authentication + Firestore profile layer.
 *
 * Firebase Authentication and Cloud Firestore are the source of truth.
 * sessionStorage/localStorage are used only as UI caches.
 */

(function () {

  const SESSION_KEY = 'mms-firebase-session-v1';
  const PROFILE_KEY = 'mms-profile-cache-v1';
  const USERS_CACHE_KEY = 'mms-users-cache-v2';


  /* =========================================================
     FIREBASE INITIALISATION
     ========================================================= */

  function configError() {
    return new Error(
      'Firebase is not configured. Check js/firebase-config.js.'
    );
  }

  function firebaseReady() {
    return (
      typeof window.firebase !== 'undefined' &&
      Array.isArray(window.firebase.apps) &&
      window.firebase.apps.length > 0
    );
  }

  function ensureFirebase() {
    if (!window.MMS_FIREBASE_CONFIG || !window.firebase) {
      throw configError();
    }

    if (!firebaseReady()) {
      window.firebase.initializeApp(
        window.MMS_FIREBASE_CONFIG
      );
    }

    return window.firebase;
  }

  function auth() {
    return ensureFirebase().auth();
  }

  function db() {
    return ensureFirebase().firestore();
  }


  /* =========================================================
     HELPERS
     ========================================================= */

  function normaliseEmail(value) {
    return String(value || '')
      .trim()
      .toLowerCase();
  }

  function clean(value) {
    return typeof value === 'string'
      ? value.trim()
      : value;
  }

  function passwordScore(value) {
    value = String(value || '');

    let score = 0;

    if (value.length >= 8) score++;

    if (
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value)
    ) {
      score++;
    }

    if (/\d/.test(value)) {
      score++;
    }

    if (/[^A-Za-z0-9]/.test(value)) {
      score++;
    }

    return score;
  }

  function friendlyError(error) {

    const code = error?.code || '';

    const map = {
      'auth/email-already-in-use':
        'An account with this email already exists.',

      'auth/invalid-email':
        'Please enter a valid email address.',

      'auth/weak-password':
        'Choose a stronger password.',

      'auth/user-not-found':
        'Incorrect email or password.',

      'auth/wrong-password':
        'Incorrect email or password.',

      'auth/invalid-credential':
        'Incorrect email or password.',

      'auth/too-many-requests':
        'Too many attempts. Please wait and try again.',

      'auth/network-request-failed':
        'Network error. Check your internet connection and try again.',

      'auth/operation-not-allowed':
        'Email/password authentication is not enabled in Firebase.',

      'permission-denied':
        'Firebase denied this operation.',

      'not-found':
        'The requested Firestore document could not be found.'
    };

    return new Error(
      map[code] ||
      error?.message ||
      'An unexpected error occurred.'
    );
  }


  /* =========================================================
     FIREBASE AUTH STATE
     ========================================================= */

  function waitForFirebaseUser() {
    return new Promise((resolve, reject) => {

      try {

        const current = auth().currentUser;

        if (current) {
          resolve(current);
          return;
        }

        let unsubscribe = null;

        const timeout = setTimeout(() => {
          if (unsubscribe) unsubscribe();

          resolve(null);
        }, 5000);

        unsubscribe = auth().onAuthStateChanged(
          user => {
            clearTimeout(timeout);

            if (unsubscribe) unsubscribe();

            resolve(user || null);
          },
          error => {
            clearTimeout(timeout);

            if (unsubscribe) unsubscribe();

            reject(error);
          }
        );

      } catch (error) {
        reject(error);
      }
    });
  }


  /* =========================================================
     CACHE
     ========================================================= */

  function cacheUsers(users) {
    try {
      localStorage.setItem(
        USERS_CACHE_KEY,
        JSON.stringify(users || [])
      );
    } catch (error) {
      console.warn(
        'Unable to cache users:',
        error
      );
    }
  }

  function allUsers() {
    try {
      return JSON.parse(
        localStorage.getItem(
          USERS_CACHE_KEY
        ) || '[]'
      );
    } catch (_) {
      return [];
    }
  }

  function updateCachedUser(profile) {
    if (!profile) return;

    try {
      const users = allUsers();

      const index = users.findIndex(
        user =>
          user.id === profile.id ||
          user.uid === profile.uid
      );

      if (index >= 0) {
        users[index] = profile;
      } else {
        users.push(profile);
      }

      cacheUsers(users);

    } catch (error) {
      console.warn(
        'Unable to update cached user:',
        error
      );
    }
  }

  function saveSession(user, profile) {

    const safeProfile = profile
      ? { ...profile }
      : null;

    try {

      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          emailVerified:
            Boolean(user.emailVerified),
          profile: safeProfile,
          loggedInAt:
            new Date().toISOString()
        })
      );

      if (safeProfile) {

        localStorage.setItem(
          PROFILE_KEY,
          JSON.stringify(safeProfile)
        );

        updateCachedUser(safeProfile);
      }

    } catch (error) {
      console.warn(
        'Unable to save session:',
        error
      );
    }
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(
        SESSION_KEY
      );
    } catch (_) {}
  }

  function cachedUser() {
    try {

      const raw =
        sessionStorage.getItem(
          SESSION_KEY
        );

      if (!raw) {
        return null;
      }

      const session =
        JSON.parse(raw);

      return {
        ...(session.profile || {}),
        id: session.uid,
        uid: session.uid,
        email: session.email,
        emailVerified:
          Boolean(session.emailVerified)
      };

    } catch (_) {
      return null;
    }
  }


  /* =========================================================
     FIRESTORE PROFILES
     ========================================================= */

  async function readProfile(uid) {

    if (!uid) {
      return null;
    }

    const snapshot =
      await db()
        .collection('users')
        .doc(uid)
        .get();

    if (!snapshot.exists) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  }

  async function loadAllUsers() {

    const firebaseUser =
      await waitForFirebaseUser();

    if (!firebaseUser) {
      throw new Error(
        'Your Firebase login session has expired. Please log in again.'
      );
    }

    const adminProfile =
      await readProfile(
        firebaseUser.uid
      );

    if (
      !adminProfile ||
      adminProfile.role !== 'admin'
    ) {
      throw new Error(
        'Administrator access is required.'
      );
    }

    try {

      const snapshot =
        await db()
          .collection('users')
          .get();

      const users =
        snapshot.docs.map(
          documentSnapshot => ({
            id: documentSnapshot.id,
            ...documentSnapshot.data()
          })
        );

      cacheUsers(users);

      return users;

    } catch (error) {

      console.error(
        'Unable to load users from Firestore:',
        error
      );

      if (
        error?.code ===
        'permission-denied'
      ) {
        throw new Error(
          'Firestore denied access to the member list. Check the published Firestore rules.'
        );
      }

      throw friendlyError(error);
    }
  }


  /* =========================================================
     REGISTER
     ========================================================= */

  async function register({
    name,
    email,
    password,
    plan
  }) {

    if (
      passwordScore(password) < 2
    ) {
      throw new Error(
        'Use at least 8 characters with letters and a number.'
      );
    }

    let firebaseUser = null;

    try {

      const credentials =
        await auth()
          .createUserWithEmailAndPassword(
            normaliseEmail(email),
            password
          );

      firebaseUser =
        credentials.user;

      const profile = {
        uid: firebaseUser.uid,
        email:
          normaliseEmail(email),
        name:
          clean(name),
        role:
          'member',
        plan:
          clean(plan),
        phone:
          '',
        dateOfBirth:
          '',
        emergencyContact:
          '',
        membershipStatus:
          'Pending',
        membershipStart:
          null,
        membershipEnd:
          null,

        accessibility: {
          stepFree: false,
          wheelchair: false,
          visualSupport: false,
          hearingSupport: false,
          beginnerFriendly: false,
          staffAssistance: false,
          notes: ''
        },

        createdAt:
          window.firebase
            .firestore
            .FieldValue
            .serverTimestamp(),

        updatedAt:
          window.firebase
            .firestore
            .FieldValue
            .serverTimestamp()
      };

      await db()
        .collection('users')
        .doc(firebaseUser.uid)
        .set(profile);

      await firebaseUser
        .sendEmailVerification();

      await auth().signOut();

      clearSession();

      return firebaseUser;

    } catch (error) {

      if (
        firebaseUser &&
        !error?.code?.startsWith(
          'auth/'
        )
      ) {
        try {
          await firebaseUser.delete();
        } catch (_) {}
      }

      throw friendlyError(error);
    }
  }


  /* =========================================================
     LOGIN
     ========================================================= */

  async function login(
    email,
    password
  ) {

    try {

      const credentials =
        await auth()
          .signInWithEmailAndPassword(
            normaliseEmail(email),
            password
          );

      const firebaseUser =
        credentials.user;

      if (
        !firebaseUser.emailVerified
      ) {

        await auth().signOut();

        throw new Error(
          'Please verify your email before logging in. Check your inbox for the verification message.'
        );
      }

      const profile =
        await readProfile(
          firebaseUser.uid
        );

      if (!profile) {

        await auth().signOut();

        throw new Error(
          'Your account profile could not be found. Please contact the administrator.'
        );
      }

      saveSession(
        firebaseUser,
        profile
      );

      return {
        ...profile,
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        emailVerified: true
      };

    } catch (error) {

      if (
        error?.message?.startsWith(
          'Please verify'
        ) ||
        error?.message?.startsWith(
          'Your account profile'
        )
      ) {
        throw error;
      }

      throw friendlyError(error);
    }
  }


  /* =========================================================
     EMAIL VERIFICATION
     ========================================================= */

  async function resendVerification() {

    const firebaseUser =
      await waitForFirebaseUser();

    if (!firebaseUser) {
      throw new Error(
        'Please log in first.'
      );
    }

    await firebaseUser
      .sendEmailVerification();
  }


  /* =========================================================
     RESET PASSWORD
     ========================================================= */

  async function resetPassword(email) {

    try {

      await auth()
        .sendPasswordResetEmail(
          normaliseEmail(email)
        );

    } catch (error) {
      throw friendlyError(error);
    }
  }


  /* =========================================================
     UPDATE CURRENT MEMBER
     ========================================================= */

  async function updateCurrentUser(
    changes
  ) {

    const firebaseUser =
      await waitForFirebaseUser();

    if (!firebaseUser) {
      throw new Error(
        'Your session has expired. Please log in again.'
      );
    }

    const allowed = [
      'name',
      'phone',
      'dateOfBirth',
      'emergencyContact',
      'plan',
      'accessibility'
    ];

    const safe =
      Object.fromEntries(
        Object.entries(
          changes || {}
        ).filter(
          ([key]) =>
            allowed.includes(key)
        )
      );

    safe.updatedAt =
      window.firebase
        .firestore
        .FieldValue
        .serverTimestamp();

    try {

      await db()
        .collection('users')
        .doc(firebaseUser.uid)
        .update(safe);

      const updated =
        await readProfile(
          firebaseUser.uid
        );

      if (!updated) {
        throw new Error(
          'Your updated profile could not be loaded.'
        );
      }

      saveSession(
        firebaseUser,
        updated
      );

      return updated;

    } catch (error) {

      console.error(
        'Member profile update failed:',
        error
      );

      throw friendlyError(error);
    }
  }


  /* =========================================================
     ADMIN UPDATE MEMBER
     ========================================================= */

  async function updateUserByAdmin(
    userId,
    changes
  ) {

    const firebaseUser =
      await waitForFirebaseUser();

    if (!firebaseUser) {
      throw new Error(
        'Your Firebase login session has expired. Please log in again.'
      );
    }

    /*
     * Read the administrator directly from Firestore.
     * Do not trust only the browser cache.
     */
    const adminProfile =
      await readProfile(
        firebaseUser.uid
      );

    if (!adminProfile) {
      throw new Error(
        'Your administrator Firestore profile could not be found.'
      );
    }

    if (
      adminProfile.role !== 'admin'
    ) {
      throw new Error(
        'This Firebase account does not have administrator permission.'
      );
    }

    if (!userId) {
      throw new Error(
        'Member ID is missing.'
      );
    }

    const allowed = [
      'name',
      'phone',
      'plan',
      'membershipStatus',
      'membershipStart',
      'membershipEnd'
    ];

    const safe =
      Object.fromEntries(
        Object.entries(
          changes || {}
        ).filter(
          ([key]) =>
            allowed.includes(key)
        )
      );

    if (
      Object.keys(safe).length === 0
    ) {
      throw new Error(
        'No valid member changes were provided.'
      );
    }

    safe.updatedAt =
      window.firebase
        .firestore
        .FieldValue
        .serverTimestamp();

    try {

      /*
       * Direct Firestore update.
       */
      await db()
        .collection('users')
        .doc(userId)
        .update(safe);

      /*
       * Read the member back from Firestore.
       */
      const updated =
        await readProfile(userId);

      if (!updated) {
        throw new Error(
          'The member was updated but could not be loaded again.'
        );
      }

      /*
       * Verify persistence.
       */
      if (
        safe.membershipStatus !==
          undefined &&
        updated.membershipStatus !==
          safe.membershipStatus
      ) {
        throw new Error(
          'Firestore did not save the requested membership status.'
        );
      }

      updateCachedUser(updated);

      return updated;

    } catch (error) {

      console.error(
        'ADMIN FIRESTORE UPDATE ERROR:',
        error
      );

      if (
        error?.code ===
        'permission-denied'
      ) {

        throw new Error(
          'Firestore rejected the admin update. The JavaScript is correct, but the published Firestore Rules are not allowing this operation.'
        );
      }

      if (
        error?.code ===
        'not-found'
      ) {

        throw new Error(
          'The selected member does not exist in Firestore.'
        );
      }

      throw friendlyError(error);
    }
  }


  /* =========================================================
     CURRENT USER / ADMIN
     ========================================================= */

  function currentUser() {
    return cachedUser();
  }

  function isAdmin() {
    const user =
      cachedUser();

    return Boolean(
      user &&
      user.role === 'admin'
    );
  }


  /* =========================================================
     LOGOUT
     ========================================================= */

  async function logout() {

    try {
      await auth().signOut();
    } catch (_) {}

    clearSession();

    const prefix =
      (
        window.location.pathname
          .includes('/member/') ||
        window.location.pathname
          .includes('/admin/')
      )
        ? '../'
        : '';

    window.location.href =
      `${prefix}login.html`;
  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.MMS_AUTH = {
    register,
    login,
    currentUser,
    updateCurrentUser,
    updateUserByAdmin,
    loadAllUsers,
    logout,
    resetPassword,
    resendVerification,
    passwordScore,
    isAdmin,
    allUsers
  };

  window.MMS_FIREBASE = {
    auth,
    db,
    readProfile,
    waitForFirebaseUser
  };


  /* =========================================================
     FORM MESSAGES
     ========================================================= */

  function authMessage(
    element,
    text,
    isError = false
  ) {

    if (!element) return;

    element.textContent =
      text;

    element.className =
      isError
        ? 'form-message error'
        : 'form-message success';
  }

  window.authMessage =
    authMessage;


  /* =========================================================
     REGISTER FORM
     ========================================================= */

  const registerForm =
    document.getElementById(
      'register-form'
    );

  if (registerForm) {

    const passwordInput =
      document.getElementById(
        'password'
      );

    const meter =
      document.querySelector(
        '.password-meter span'
      );

    const strengthText =
      document.getElementById(
        'password-strength'
      );

    passwordInput?.addEventListener(
      'input',
      () => {

        const score =
          passwordScore(
            passwordInput.value
          );

        if (meter) {
          meter.style.width =
            `${score * 25}%`;
        }

        if (strengthText) {
          strengthText.textContent =
            [
              'Very weak',
              'Weak',
              'Fair',
              'Strong',
              'Very strong'
            ][score];
        }
      }
    );

    registerForm.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        const message =
          registerForm.querySelector(
            '.form-message'
          );

        if (
          !registerForm.checkValidity()
        ) {

          registerForm.reportValidity();

          authMessage(
            message,
            'Please correct the highlighted fields.',
            true
          );

          return;
        }

        const password =
          registerForm.password.value;

        if (
          password !==
          registerForm.confirmPassword.value
        ) {

          authMessage(
            message,
            'The passwords do not match.',
            true
          );

          return;
        }

        const button =
          registerForm.querySelector(
            'button[type="submit"]'
          );

        button.disabled = true;

        try {

          await register({
            name:
              registerForm.name.value,
            email:
              registerForm.email.value,
            password,
            plan:
              registerForm.plan.value
          });

          authMessage(
            message,
            'Account created. Check your email, verify your address, then log in.'
          );

          setTimeout(
            () => {
              window.location.href =
                'login.html?registered=1';
            },
            900
          );

        } catch (error) {

          authMessage(
            message,
            error.message,
            true
          );

          button.disabled =
            false;
        }
      }
    );
  }


  /* =========================================================
     LOGIN FORM
     ========================================================= */

  const loginForm =
    document.getElementById(
      'login-form'
    );

  if (loginForm) {

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get('registered') ===
      '1'
    ) {

      authMessage(
        loginForm.querySelector(
          '.form-message'
        ),
        'Registration successful. Check your email, verify your account, then log in.'
      );
    }

    if (
      params.get('required') ===
      '1'
    ) {

      authMessage(
        loginForm.querySelector(
          '.form-message'
        ),
        'Please log in to access this area.',
        true
      );
    }

    loginForm.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        const message =
          loginForm.querySelector(
            '.form-message'
          );

        if (
          !loginForm.checkValidity()
        ) {

          loginForm.reportValidity();

          authMessage(
            message,
            'Enter a valid email and password.',
            true
          );

          return;
        }

        const button =
          loginForm.querySelector(
            'button[type="submit"]'
          );

        button.disabled =
          true;

        try {

          const user =
            await login(
              loginForm.email.value,
              loginForm.password.value
            );

          authMessage(
            message,
            'Login successful. Opening your dashboard…'
          );

          setTimeout(
            () => {

              window.location.href =
                user.role === 'admin'
                  ? 'admin/dashboard.html'
                  : 'member/dashboard.html';

            },
            350
          );

        } catch (error) {

          authMessage(
            message,
            error.message,
            true
          );

          button.disabled =
            false;
        }
      }
    );
  }


  /* =========================================================
     PASSWORD RESET FORM
     ========================================================= */

  const resetForm =
    document.getElementById(
      'reset-password-form'
    );

  if (resetForm) {

    resetForm.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        const message =
          resetForm.querySelector(
            '.form-message'
          );

        if (
          !resetForm.checkValidity()
        ) {

          resetForm.reportValidity();

          return;
        }

        const button =
          resetForm.querySelector(
            'button[type="submit"]'
          );

        button.disabled =
          true;

        try {

          await resetPassword(
            resetForm.email.value
          );

          authMessage(
            message,
            'If the email is registered, a password-reset message has been sent. Check your inbox.'
          );

        } catch (error) {

          authMessage(
            message,
            error.message,
            true
          );

          button.disabled =
            false;
        }
      }
    );
  }

})();