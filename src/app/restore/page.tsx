'use client';

import { useState } from 'react';

export default function RestorePage() {
    const [repository, setRepository] = useState('');
    const [snapshotId, setSnapshotId] = useState('');
    const [destination, setDestination] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [browsing, setBrowsing] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const openNativePicker = async (target: 'repo' | 'dest') => {
        setBrowsing(true);
        try {
            const res = await fetch('/api/plakar/pick-folder');
            const data = await res.json();
            if (data.success && data.path) {
                if (target === 'repo') setRepository(data.path);
                else setDestination(data.path);
            }
        } catch {
            // user cancelled or error
        }
        setBrowsing(false);
    };

    const handleRestore = async () => {
        if (!repository || !snapshotId || !destination || !passphrase) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/plakar/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, snapshotId, destination, passphrase }),
            });
            const data = await res.json();
            setResult({ success: data.success, message: data.message || data.error });
        } catch {
            setResult({ success: false, message: 'Network error.' });
        }
        setLoading(false);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Restore</h1>
                <p className="page-subtitle">
                    Recover your files from any backup snapshot. Enter the Snapshot ID
                    from the Snapshots page and choose where to restore.
                </p>
            </div>

            {result && (
                <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
                    {result.success ? '✅' : '❌'} {result.message}
                </div>
            )}

            <div className="card">
                <div className="card-title">Restore from Snapshot</div>

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
                                onClick={() => openNativePicker('repo')}
                                disabled={browsing}
                            >
                                {browsing ? '⏳' : '📂'} Browse
                            </button>
                        </div>
                        <div className="form-hint">
                            The backup repository folder (the Safe).
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Snapshot ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 63b957c7"
                            value={snapshotId}
                            onChange={(e) => setSnapshotId(e.target.value)}
                        />
                        <div className="form-hint">
                            Copy this from the Snapshots page.
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Restore Destination Path</label>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. C:\Users\You\Desktop\RestoredFiles"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                        />
                        <button
                            className="btn-browse"
                            onClick={() => openNativePicker('dest')}
                            disabled={browsing}
                        >
                            {browsing ? '⏳' : '📂'} Browse
                        </button>
                    </div>
                    <div className="form-hint">
                        Where the decrypted files will be placed. Use a new, empty folder to avoid overwrites.
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Passphrase</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="Enter your repository passphrase"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                    />
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleRestore}
                    disabled={loading || !repository || !snapshotId || !destination || !passphrase}
                >
                    {loading && <span className="spinner" />}
                    {loading ? 'Restoring...' : '♻️ Restore Now'}
                </button>
            </div>
        </div>
    );
}
