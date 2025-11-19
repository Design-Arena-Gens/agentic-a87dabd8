"use client";
import React from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { observeAuth, hasAnyRole } from '@/lib/auth';

export default function JobsPage() {
  const [auth, setAuth] = React.useState<any>({ user: null, loading: true, claims: {} });
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [companyId, setCompanyId] = React.useState('');
  const [type, setType] = React.useState('full_time');

  React.useEffect(() => observeAuth((s) => setAuth({ user: s.user, loading: s.loading, claims: s.claims })), []);
  const canManage = hasAnyRole(auth.claims, ['super_admin', 'admin', 'recruiter']);

  const load = async () => {
    const q = query(collection(firestore(), 'jobs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  React.useEffect(() => { if (canManage) load(); }, [canManage]);

  if (auth.loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24 }}>Access denied.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Jobs</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim() || !location.trim()) return;
        await addDoc(collection(firestore(), 'jobs'), { title: title.trim(), location: location.trim(), type, companyId: companyId.trim() || 'unknown', createdAt: Date.now(), updatedAt: Date.now(), isActive: true });
        setTitle(''); setLocation(''); setCompanyId(''); setType('full_time');
        await load();
      }} className="row">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input placeholder="Company ID" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <button type="submit">Add</button>
      </form>
      <table className="table">
        <thead>
          <tr><th>Title</th><th>Location</th><th>Type</th><th>Active</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td>{j.title}</td>
              <td>{j.location}</td>
              <td>{j.type}</td>
              <td>{j.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={async () => { await deleteDoc(doc(firestore(), 'jobs', j.id)); await load(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
