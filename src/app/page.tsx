'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StatusInfo {
  installed: boolean;
  version: string | null;
  path: string | null;
}

export default function DashboardPage() {
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
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome to Plakar Dashboard — your visual interface for managing
          encrypted backups.
        </p>
      </div>

      {/* Status Card */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="card-title">Plakar CLI Status</div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="spinner" />
                <span style={{ color: 'var(--text-muted)' }}>
                  Detecting plakar...
                </span>
              </div>
            ) : status?.installed ? (
              <div>
                <span
                  className="status-badge connected"
                  style={{ marginRight: 12 }}
                >
                  <span className="status-dot" />
                  Connected
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Version{' '}
                  <span className="mono">{status.version || 'unknown'}</span>
                </span>
              </div>
            ) : (
              <span className="status-badge disconnected">
                <span className="status-dot" />
                Not Found
              </span>
            )}
          </div>
          {status?.path && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
              }}
            >
              {status.path}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 20,
          color: 'var(--text-primary)',
        }}
      >
        Quick Actions
      </h2>

      <div className="grid-3">
        <Link href="/backup" className="stat-card">
          <div className="stat-icon purple">🔒</div>
          <div>
            <div className="stat-label">Create</div>
            <div className="stat-value">New Backup</div>
          </div>
        </Link>

        <Link href="/snapshots" className="stat-card">
          <div className="stat-icon green">📸</div>
          <div>
            <div className="stat-label">Browse</div>
            <div className="stat-value">Snapshots</div>
          </div>
        </Link>

        <Link href="/restore" className="stat-card">
          <div className="stat-icon blue">♻️</div>
          <div>
            <div className="stat-label">Recover</div>
            <div className="stat-value">Restore Files</div>
          </div>
        </Link>
      </div>

      {/* Overview */}
      <div className="card">
        <div className="card-title">How It Works</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          <div style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6,
                color: 'var(--text-primary)',
              }}
            >
              1. Select Source
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Choose the folder you want to protect.
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6,
                color: 'var(--text-primary)',
              }}
            >
              2. Encrypt & Push
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Plakar shreds, encrypts, and stores your data.
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6,
                color: 'var(--text-primary)',
              }}
            >
              3. Restore Anytime
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Recover your files from any snapshot point.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
