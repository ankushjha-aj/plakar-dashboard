'use client';

import { useState } from 'react';

interface Snapshot {
    timestamp: string;
    snapshotId: string;
    size: string;
    duration: string;
    path: string;
}

export default function SnapshotsPage() {
    const [repository, setRepository] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [browsing, setBrowsing] = useState(false);
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState('');
    const [deleteMsg, setDeleteMsg] = useState('');

    const openNativePicker = async () => {
        setBrowsing(true);
        try {
            const res = await fetch('/api/plakar/pick-folder');
            const data = await res.json();
            if (data.success && data.path) {
                setRepository(data.path);
            }
        } catch {
            // user cancelled or error
        }
        setBrowsing(false);
    };

    const loadSnapshots = async () => {
        if (!repository || !passphrase) return;
        setLoading(true);
        setError('');
        setDeleteMsg('');

        try {
            const res = await fetch('/api/plakar/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, passphrase }),
            });
            const data = await res.json();
            if (data.success) {
                setSnapshots(data.snapshots);
                setLoaded(true);
            } else {
                setError('Failed to load snapshots. Check your path and passphrase.');
            }
        } catch {
            setError('Network error.');
        }
        setLoading(false);
    };

    const handleDelete = async (snapshotId: string) => {
        if (!confirm(`Are you sure you want to delete snapshot ${snapshotId}?`))
            return;

        try {
            const res = await fetch('/api/plakar/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, snapshotId, passphrase }),
            });
            const data = await res.json();
            if (data.success) {
                setDeleteMsg(`Snapshot ${snapshotId} deleted.`);
                loadSnapshots();
            } else {
                setDeleteMsg(`Failed to delete: ${data.message}`);
            }
        } catch {
            setDeleteMsg('Network error while deleting.');
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Snapshots</h1>
                <p className="page-subtitle">
                    View all backup snapshots stored in a repository. Each snapshot is a
                    complete, immutable copy of your data at a specific point in time.
                </p>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title">Load Repository</div>
                <div className="grid-2">
                    <div className="form-group">
                        <label className="form-label">Repository Path</label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. C:\Users\You\Desktop\MyBackups"
                                value={repository}
                                onChange={(e) => setRepository(e.target.value)}
                            />
                            <button
                                className="btn-browse"
                                onClick={openNativePicker}
                                disabled={browsing}
                            >
                                {browsing ? '⏳' : '📂'} Browse
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Passphrase</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your passphrase"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={loadSnapshots}
                    disabled={loading || !repository || !passphrase}
                >
                    {loading && <span className="spinner" />}
                    {loading ? 'Loading...' : '📸 Load Snapshots'}
                </button>
            </div>

            {error && <div className="alert alert-error">❌ {error}</div>}
            {deleteMsg && <div className="alert alert-info">ℹ️ {deleteMsg}</div>}

            {loaded && (
                <div className="card">
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <div className="card-title" style={{ marginBottom: 0 }}>
                            {snapshots.length} Snapshot{snapshots.length !== 1 ? 's' : ''}{' '}
                            Found
                        </div>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={loadSnapshots}
                            disabled={loading}
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {snapshots.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <div className="empty-state-text">
                                No snapshots found in this repository.
                            </div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Snapshot ID</th>
                                        <th>Size</th>
                                        <th>Source Path</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {snapshots.map((snap) => (
                                        <tr key={snap.snapshotId}>
                                            <td>
                                                {new Date(snap.timestamp).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className="mono">{snap.snapshotId}</span>
                                            </td>
                                            <td>{snap.size}</td>
                                            <td
                                                style={{
                                                    maxWidth: 300,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {snap.path}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(snap.snapshotId)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
