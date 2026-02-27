'use client';

import { useEffect, useState } from 'react';

interface StatusInfo {
    installed: boolean;
    version: string | null;
    path: string | null;
}

export default function SettingsPage() {
    const [status, setStatus] = useState<StatusInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/plakar/status')
            .then((res) => res.json())
            .then((data) => {
                setStatus(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">
                    View system information and Plakar CLI configuration.
                </p>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title">Plakar CLI Information</div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="spinner" />
                        <span style={{ color: 'var(--text-muted)' }}>Detecting...</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: '1px solid var(--border-color)',
                            }}
                        >
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                Status
                            </span>
                            <span
                                className={`status-badge ${status?.installed ? 'connected' : 'disconnected'
                                    }`}
                            >
                                <span className="status-dot" />
                                {status?.installed ? 'Detected' : 'Not Found'}
                            </span>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: '1px solid var(--border-color)',
                            }}
                        >
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                Version
                            </span>
                            <span className="mono">
                                {status?.version || 'N/A'}
                            </span>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                            }}
                        >
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                Executable Path
                            </span>
                            <span
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 13,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {status?.path || 'N/A'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-title">About</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
                    <strong>Plakar Dashboard</strong> is a custom GUI built with Next.js
                    that wraps the Plakar CLI tool. It allows you to perform backup,
                    restore, snapshot management, and repository operations through a
                    visual interface instead of typing terminal commands.
                </p>
                <p
                    style={{
                        color: 'var(--text-muted)',
                        marginTop: 12,
                        fontSize: 13,
                    }}
                >
                    Plakar is an open-source project by PlakarKorp. Visit{' '}
                    <a
                        href="https://plakar.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-primary)' }}
                    >
                        plakar.io
                    </a>{' '}
                    for official documentation.
                </p>
            </div>
        </div>
    );
}
