'use client';

import { useState, useEffect } from 'react';

interface FolderEntry {
    name: string;
    path: string;
    isDirectory: boolean;
}

interface FolderPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
    title?: string;
}

export default function FolderPicker({
    isOpen,
    onClose,
    onSelect,
    title = 'Select Folder',
}: FolderPickerProps) {
    const [currentPath, setCurrentPath] = useState('');
    const [parentPath, setParentPath] = useState('');
    const [entries, setEntries] = useState<FolderEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [manualPath, setManualPath] = useState('');

    const browse = async (targetPath?: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/plakar/browse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPath: targetPath || '' }),
            });
            const data = await res.json();
            if (data.success) {
                setCurrentPath(data.currentPath);
                setParentPath(data.parentPath);
                setEntries(data.entries);
                setManualPath(data.currentPath);
            }
        } catch {
            // ignore
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            browse();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="picker-overlay" onClick={onClose}>
            <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="picker-header">
                    <h3 className="picker-title">{title}</h3>
                    <button className="picker-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Manual path input */}
                <div className="picker-path-bar">
                    <input
                        type="text"
                        className="form-input"
                        value={manualPath}
                        onChange={(e) => setManualPath(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') browse(manualPath);
                        }}
                        placeholder="Type a path and press Enter"
                        style={{ fontSize: 13 }}
                    />
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => browse(manualPath)}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        Go
                    </button>
                </div>

                {/* Current path breadcrumb */}
                <div className="picker-breadcrumb">
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        📂 {currentPath}
                    </span>
                </div>

                {/* Navigation */}
                <div className="picker-nav">
                    {currentPath !== parentPath && (
                        <button
                            className="picker-entry picker-back"
                            onClick={() => browse(parentPath)}
                        >
                            <span className="picker-entry-icon">⬆️</span>
                            <span>.. (Go Up)</span>
                        </button>
                    )}
                </div>

                {/* Directory listing */}
                <div className="picker-list">
                    {loading ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 32,
                                gap: 10,
                            }}
                        >
                            <div className="spinner" />
                            <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
                        </div>
                    ) : entries.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: 32,
                                color: 'var(--text-muted)',
                            }}
                        >
                            No subfolders found.
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <button
                                key={entry.path}
                                className="picker-entry"
                                onClick={() => browse(entry.path)}
                            >
                                <span className="picker-entry-icon">📁</span>
                                <span>{entry.name}</span>
                            </button>
                        ))
                    )}
                </div>

                {/* Action buttons */}
                <div className="picker-footer">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            onSelect(currentPath);
                            onClose();
                        }}
                    >
                        ✅ Select This Folder
                    </button>
                </div>
            </div>
        </div>
    );
}
