import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';
import { firebaseAuth, googleProvider } from '@/lib/firebase';

export type AuthState = { user: User | null; loading: boolean; claims?: Record<string, unknown> };

export function observeAuth(callback: (state: AuthState) => void) {
  const auth = firebaseAuth();
  callback({ user: auth.currentUser, loading: true });
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdTokenResult(true);
      callback({ user, loading: false, claims: token.claims });
    } else {
      callback({ user: null, loading: false });
    }
  });
}

export async function emailPasswordSignIn(email: string, password: string) {
  const auth = firebaseAuth();
  await signInWithEmailAndPassword(auth, email, password);
}

export async function googleSignIn() {
  const auth = firebaseAuth();
  await signInWithPopup(auth, googleProvider);
}

export async function logout() {
  await signOut(firebaseAuth());
}

export function hasAnyRole(claims: Record<string, unknown> | undefined, roles: string[]): boolean {
  if (!claims) return false;
  const role = (claims['role'] as string) || '';
  return roles.includes(role);
}
