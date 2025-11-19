"use client";
import React from 'react';
import { collection, doc, getDocs, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { observeAuth, hasAnyRole } from '@/lib/auth';

export default function UsersPage() {
  const [auth, setAuth] = React.useState<any>({ user: null, loading: true, claims: {} });
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = observeAuth((s) => setAuth({ user: s.user, loading: s.loading, claims: s.claims }));
    return () => unsub();
  }, []);

  const canAdmin = hasAnyRole(auth.claims, ['super_admin', 'admin']);

  React.useEffect(() => {
    if (!canAdmin) return;
    (async () => {
      const q = query(collection(firestore(), 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, [auth.claims]);

  if (auth.loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!canAdmin) return <div style={{ padding: 24 }}>Access denied.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Users</h2>
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid || u.id}>
                <td>{u.email}</td>
                <td>{u.displayName || '-'}</td>
                <td>{u.role || u.claims?.role || 'unknown'}</td>
                <td>
                  <RoleSelect user={u} onChanged={(role) => setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, role } : x)))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RoleSelect({ user, onChanged }: { user: any; onChanged: (role: string) => void }) {
  const [role, setRole] = React.useState(user.role || 'job_seeker');

  const save = async () => {
    const ref = doc(firestore(), 'users', user.id || user.uid);
    await setDoc(ref, { email: user.email, displayName: user.displayName || '', role, updatedAt: Date.now(), createdAt: user.createdAt || Date.now() }, { merge: true });
    // Optional: call a callable function to set custom claims on server
    onChanged(role);
  };

  return (
    <div className="row">
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="super_admin">Super Admin</option>
        <option value="admin">Admin</option>
        <option value="recruiter">Recruiter</option>
        <option value="job_seeker">Job Seeker</option>
      </select>
      <button onClick={save}>Save</button>
    </div>
  );
}
