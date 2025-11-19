"use client";
import React from 'react';
import { observeAuth, googleSignIn, emailPasswordSignIn, logout, hasAnyRole } from '@/lib/auth';

export default function HomePage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [state, setState] = React.useState({ user: null as any, loading: true, claims: {} as any });

  React.useEffect(() => {
    const unsub = observeAuth((s) => setState({ user: s.user as any, loading: s.loading, claims: s.claims as any }));
    return () => unsub();
  }, []);

  if (state.loading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (!state.user) {
    return (
      <div className="auth">
        <h1>WorkFlicks CMS</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            emailPasswordSignIn(email, password).catch((err) => alert(err.message));
          }}
        >
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Sign in</button>
        </form>
        <button onClick={() => googleSignIn().catch((e) => alert(e.message))}>Sign in with Google</button>
      </div>
    );
  }

  const canAdmin = hasAnyRole(state.claims, ['super_admin', 'admin']);
  const canRecruiter = hasAnyRole(state.claims, ['recruiter']);

  return (
    <div className="dashboard">
      <div className="topbar">
        <div>Signed in as {state.user.email}</div>
        <div className="spacer" />
        <button onClick={() => logout()}>Logout</button>
      </div>
      <div className="cards">
        {canAdmin && (
          <a className="card" href="/users">Manage Users</a>
        )}
        {(canAdmin || canRecruiter) && (
          <a className="card" href="/companies">Companies</a>
        )}
        {(canAdmin || canRecruiter) && (
          <a className="card" href="/jobs">Jobs</a>
        )}
        {!canAdmin && !canRecruiter && (
          <div className="card disabled">No CMS permissions for your role.</div>
        )}
      </div>
    </div>
  );
}
