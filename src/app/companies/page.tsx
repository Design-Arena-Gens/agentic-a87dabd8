"use client";
import React from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { observeAuth, hasAnyRole } from '@/lib/auth';

export default function CompaniesPage() {
  const [auth, setAuth] = React.useState<any>({ user: null, loading: true, claims: {} });
  const [companies, setCompanies] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [website, setWebsite] = React.useState('');

  React.useEffect(() => observeAuth((s) => setAuth({ user: s.user, loading: s.loading, claims: s.claims })), []);

  const canManage = hasAnyRole(auth.claims, ['super_admin', 'admin', 'recruiter']);

  const load = async () => {
    const q = query(collection(firestore(), 'companies'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  React.useEffect(() => { if (canManage) load(); }, [canManage]);

  if (auth.loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24 }}>Access denied.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Companies</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        await addDoc(collection(firestore(), 'companies'), { name: name.trim(), website: website.trim(), createdAt: Date.now(), updatedAt: Date.now() });
        setName(''); setWebsite('');
        await load();
      }} className="row">
        <input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Website</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.website || '-'}</td>
              <td>
                <button onClick={async () => { await deleteDoc(doc(firestore(), 'companies', c.id)); await load(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
