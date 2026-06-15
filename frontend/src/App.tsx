import React, { useState, useEffect } from 'react';
import { FirearmApplication, StatusResult } from './types';

const API_BASE = 'http://localhost:3001/api'; 

export default function App() {
  const [isSiteUp, setIsSiteUp] = useState<boolean | null>(null);
  const [savedApps, setSavedApps] = useState<FirearmApplication[]>(() => {
    const saved = localStorage.getItem('saps_apps');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeResult, setActiveResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [alias, setAlias] = useState('');
  const [fsref, setFsref] = useState('');
  const [fserial, setFserial] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/healthcheck`)
      .then(res => res.json())
      .then(data => setIsSiteUp(data.isUp))
      .catch(() => setIsSiteUp(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('saps_apps', JSON.stringify(savedApps));
  }, [savedApps]);

  const addApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: FirearmApplication = {
      id: crypto.randomUUID(),
      alias,
      fsref,
      fserial
    };
    setSavedApps([...savedApps, newApp]);
    setAlias(''); setFsref(''); setFserial('');
  };

  const removeApplication = (id: string) => {
    setSavedApps(savedApps.filter(app => app.id !== id));
  };

  const checkStatus = async (app: FirearmApplication) => {
    setLoading(true);
    setError('');
    setActiveResult(null);

    try {
      const res = await fetch(`${API_BASE}/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fsref: app.fsref, fserial: app.fserial })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch");
      }

      const data: StatusResult = await res.json();
      setActiveResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Firearm Status Tracker</h1>
        <div>
          SAPS Portal: {isSiteUp === null ? 'Checking...' : isSiteUp ? '✅ Online' : '❌ Offline'}
        </div>
      </header>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Left Side: Form & Saved List */}
        <section style={{ flex: 1 }}>
          <h3>Add New Application</h3>
          <form onSubmit={addApplication} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
            <input placeholder="Alias (e.g. Glock 19)" value={alias} onChange={e => setAlias(e.target.value)} required style={{ padding: '8px' }}/>
            <input placeholder="Ref Number (e.g. 10550740)" value={fsref} onChange={e => setFsref(e.target.value)} required style={{ padding: '8px' }}/>
            <input placeholder="Serial Number (e.g. AX008490)" value={fserial} onChange={e => setFserial(e.target.value)} required style={{ padding: '8px' }}/>
            <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Save Details</button>
          </form>

          <h3>Saved Applications</h3>
          {savedApps.length === 0 && <p>No applications saved.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {savedApps.map(app => (
              <div key={app.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                <strong>{app.alias}</strong>
                <p style={{ fontSize: '12px', margin: '5px 0' }}>Ref: {app.fsref} | SN: {app.fserial}</p>
                <button onClick={() => checkStatus(app)} disabled={loading} style={{ marginRight: '10px' }}>
                  Check Status
                </button>
                <button onClick={() => removeApplication(app.id)}>Remove</button>
              </div>
            ))}
          </div>
        </section>

        {/* Right Side: Results */}
        <section style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '5px', border: '1px solid #eee' }}>
          <h3>Latest Result</h3>
          {loading && <p>Contacting SAPS database...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          
          {activeResult && !loading && !error && (
            <div>
              <h2 style={{ color: '#2563eb', margin: '0 0 10px 0' }}>{activeResult.status}</h2>
              <p><strong>Date:</strong> {activeResult.statusDate}</p>
              <p><strong>Description:</strong> {activeResult.statusDescription}</p>
              <p><strong>Next Step:</strong> {activeResult.nextStep}</p>
              <hr style={{ margin: '15px 0' }} />
              <p><strong>Make:</strong> {activeResult.make}</p>
              <p><strong>Calibre:</strong> {activeResult.calibre}</p>
            </div>
          )}
          {!activeResult && !loading && !error && <p>Click "Check Status" to fetch data.</p>}
        </section>
      </div>
    </div>
  );
}
