import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import sanitizeHtml from 'sanitize-html';

admin.initializeApp();
const db = admin.firestore();

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const defaultRole = 'job_seeker';
  await db.doc(`users/${user.uid}`).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    role: defaultRole,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, { merge: true });
  await admin.auth().setCustomUserClaims(user.uid, { role: defaultRole });
});

export const setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  const callerToken = await admin.auth().getUser(context.auth.uid);
  const callerClaims = (callerToken.customClaims || {}) as Record<string, unknown>;
  const callerRole = callerClaims['role'];
  if (!(callerRole === 'super_admin' || callerRole === 'admin')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient privileges');
  }
  const { uid, role } = data as { uid: string; role: string };
  if (!uid || !role) throw new functions.https.HttpsError('invalid-argument', 'uid and role required');
  await admin.auth().setCustomUserClaims(uid, { role });
  await db.doc(`users/${uid}`).set({ role, updatedAt: Date.now() }, { merge: true });
  return { ok: true };
});

export const sanitizeJob = functions.firestore.document('jobs/{jobId}').onWrite(async (change, context) => {
  const after = change.after.exists ? change.after.data() : null;
  if (!after) return; // deleted
  const sanitized = {
    ...after,
    title: sanitizeHtml(after.title || '', { allowedTags: [], allowedAttributes: {} }),
    description: sanitizeHtml(after.description || '', { allowedTags: ['b','i','em','strong','a','ul','ol','li','p','br'], allowedAttributes: { 'a': ['href', 'target', 'rel'] } }),
    location: sanitizeHtml(after.location || '', { allowedTags: [], allowedAttributes: {} }),
    updatedAt: Date.now(),
  };
  await change.after.ref.set(sanitized, { merge: true });
});
