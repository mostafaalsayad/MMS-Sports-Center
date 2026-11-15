/**
 * MMS Sports Center Firebase service.
 * Firebase SDK: browser-module CDN build. The application should be served over HTTP/HTTPS for Firebase Authentication and Firestore.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection,
  query, where, orderBy, getDocs, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const clean = value => typeof value === 'string' ? value.trim() : value;
const memberProfile = ({ uid, email, name, plan }) => ({
  uid,
  email: clean(email).toLowerCase(),
  name: clean(name),
  role: 'member',
  plan: clean(plan),
  phone: '',
  dateOfBirth: '',
  emergencyContact: '',
  membershipStatus: 'Pending',
  membershipStart: null,
  membershipEnd: null,
  accessibility: {
    stepFree: false,
    wheelchair: false,
    visualSupport: false,
    hearingSupport: false,
    beginnerFriendly: false,
    staffAssistance: false,
    notes: ''
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

export async function registerMember({ name, email, password, plan }) {
  const credential = await createUserWithEmailAndPassword(auth, clean(email).toLowerCase(), password);
  await setDoc(doc(db, 'users', credential.user.uid), memberProfile({
    uid: credential.user.uid,
    email,
    name,
    plan
  }));
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, clean(email).toLowerCase(), password);
}

export async function logoutUser() { return signOut(auth); }
export async function resetPassword(email) { return sendPasswordResetEmail(auth, clean(email).toLowerCase()); }
export function watchAuth(callback) { return onAuthStateChanged(auth, callback); }

export async function getMyProfile() {
  if (!auth.currentUser) return null;
  const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function updateMyProfile(changes) {
  if (!auth.currentUser) throw new Error('Authentication is required.');
  const allowed = ['name', 'phone', 'dateOfBirth', 'emergencyContact', 'plan', 'accessibility'];
  const safeChanges = Object.fromEntries(Object.entries(changes).filter(([key]) => allowed.includes(key)));
  await updateDoc(doc(db, 'users', auth.currentUser.uid), {
    ...safeChanges,
    updatedAt: serverTimestamp()
  });
}

export async function createBooking(sessionId) {
  if (!auth.currentUser) throw new Error('Authentication is required.');
  const existing = query(
    collection(db, 'bookings'),
    where('userId', '==', auth.currentUser.uid),
    where('sessionId', '==', sessionId),
    where('status', '==', 'confirmed')
  );
  if (!(await getDocs(existing)).empty) throw new Error('You already booked this session.');
  return addDoc(collection(db, 'bookings'), {
    userId: auth.currentUser.uid,
    sessionId,
    status: 'confirmed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function createFreezeRequest(data) {
  if (!auth.currentUser) throw new Error('Authentication is required.');
  return addDoc(collection(db, 'freezeRequests'), {
    userId: auth.currentUser.uid,
    startDate: clean(data.startDate),
    endDate: clean(data.endDate),
    reason: clean(data.reason || ''),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function createOrder(data) {
  if (!auth.currentUser) throw new Error('Authentication is required.');
  return addDoc(collection(db, 'orders'), {
    userId: auth.currentUser.uid,
    items: data.items,
    total: Number(data.total),
    collectionMethod: clean(data.collectionMethod),
    notes: clean(data.notes || ''),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function listMyRecords(collectionName) {
  if (!auth.currentUser) throw new Error('Authentication is required.');
  const recordsQuery = query(
    collection(db, collectionName),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(recordsQuery);
  return snapshot.docs.map(record => ({ id: record.id, ...record.data() }));
}
