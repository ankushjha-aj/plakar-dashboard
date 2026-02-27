'use client';

import { useState } from 'react';

export default function BackupPage() {
    const [repository, setRepository] = useState('');
    const [source, setSource] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [loading, setLoading] = useState(false);
    const [browsing, setBrowsing] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        snapshotId?: string;
    } | null>(null);
    const [initMode, setInitMode] = useState(false);

    const openNativePicker = async (target: 'repo' | 'source') => {
        setBrowsing(true);
        try {
            const res = await fetch('/api/plakar/pick-folder');
            const data = await res.json();
            if (data.success && data.path) {
                if (target === 'repo') setRepository(data.path);
                else setSource(data.path);
            }
        } catch {
            // user cancelled or error
        }
        setBrowsing(false);
    };

    const handleCreateRepo = async () => {
        if (!repository || !passphrase) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/plakar/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, passphrase }),
            });
            const data = await res.json();
            setResult({ success: data.success, message: data.message || data.error });
        } catch {
            setResult({ success: false, message: 'Network error.' });
        }
        setLoading(false);
    };

    const handleBackup = async () => {
        if (!repository || !source || !passphrase) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/plakar/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, source, passphrase }),
            });
            const data = await res.json();
            setResult({
                success: data.success,
                message: data.message || data.error,
                snapshotId: data.snapshotId,
            });
        } catch {
            setResult({ success: false, message: 'Network error.' });
        }
        setLoading(false);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Backup</h1>
                <p className="page-subtitle">
                    Create encrypted, immutable snapshots of your important files and
                    folders.
                </p>
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <button
                    className={`btn ${!initMode ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setInitMode(false)}
                >
                    🔒 Run Backup
                </button>
                <button
                    className={`btn ${initMode ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setInitMode(true)}
                >
                    🆕 Initialize New Repository
                </button>
            </div>

            {result && (
                <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
                    {result.success ? '✅' : '❌'} {result.message}
                    {result.snapshotId && (
                        <span>
                            {' '}
                            — Snapshot ID: <span className="mono">{result.snapshotId}</span>
                        </span>
                    )}
                </div>
            )}

            <div className="card">
                <div className="card-title">
                    {initMode ? 'Initialize New Repository (Kloset)' : 'Push Backup'}
                </div>

                <div className="form-group">
                    <label className="form-label">Repository (Destination) Path</label>
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
                        The folder where encrypted backup data will be stored.
                    </div>
                </div>

                {!initMode && (
                    <div className="form-group">
                        <label className="form-label">Source Folder Path</label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. C:\Users\You\Desktop\ImportantFiles"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                            />
                            <button
                                className="btn-browse"
                                onClick={() => openNativePicker('source')}
                                disabled={browsing}
                            >
                                {browsing ? '⏳' : '📂'} Browse
                            </button>
                        </div>
                        <div className="form-hint">
                            The folder containing the files you want to back up.
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Passphrase</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="Enter your secure passphrase"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                    />
                    <div className="form-hint">
                        {initMode
                            ? 'Create a strong passphrase. You will need it for all future operations!'
                            : 'The passphrase you set when you initialized this repository.'}
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={initMode ? handleCreateRepo : handleBackup}
                    disabled={
                        loading ||
                        !repository ||
                        !passphrase ||
                        (!initMode && !source)
                    }
                >
                    {loading && <span className="spinner" />}
                    {initMode
                        ? loading
                            ? 'Initializing...'
                            : '🆕 Create Repository'
                        : loading
                            ? 'Backing up...'
                            : '🔒 Run Backup'}
                </button>
            </div>
        </div>
    );
}
