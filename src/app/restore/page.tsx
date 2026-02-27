'use client';
import { useState } from 'react';

export default function RestorePage() {
    const [repo, setRepo] = useState('');
    const [snapId, setSnapId] = useState('');
    const [dest, setDest] = useState('');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [browsing, setBrowsing] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const browse = async (t: 'repo' | 'dest') => {
        setBrowsing(true);
        try {
            const r = await fetch('/api/plakar/pick-folder'); const d = await r.json();
            if (d.success && d.path) { if (t === 'repo') setRepo(d.path); else setDest(d.path); }
        } catch { }
        setBrowsing(false);
    };

    const restore = async () => {
        if (!repo || !snapId || !dest || !pass) return;
        setLoading(true); setResult(null);
        try {
            const r = await fetch('/api/plakar/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository: repo, snapshotId: snapId, destination: dest, passphrase: pass }) });
            const d = await r.json(); setResult({ ok: d.success, msg: d.message || d.error });
        } catch { setResult({ ok: false, msg: 'Network error.' }); }
        setLoading(false);
    };

    const InputRow = ({ label, icon, val, set, placeholder, mono, browseTarget }: { label: string; icon: string; val: string; set: (v: string) => void; placeholder: string; mono?: boolean; browseTarget?: 'repo' | 'dest' }) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
            <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons-round text-slate-400 text-lg">{icon}</span>
                </div>
                <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                    className={`block w-full pl-10 ${browseTarget ? 'pr-24' : ''} py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500 ${mono ? 'font-mono' : ''}`} />
                {browseTarget && <button onClick={() => browse(browseTarget)} disabled={browsing}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded border border-slate-200 dark:border-slate-600 transition-colors">Browse</button>}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-up max-w-3xl mx-auto">
            <div className="text-center space-y-2 mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Restore Data</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">Recover files from your encrypted snapshots. Select a source repository and define your destination.</p>
            </div>

            {result && (
                <div className={`rounded-md p-4 border shadow-sm mb-6 flex items-start gap-3 ${result.ok ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'}`}>
                    <span className={`material-icons-round ${result.ok ? 'text-green-500' : 'text-red-500'}`}>{result.ok ? 'check_circle' : 'error'}</span>
                    <p className={`text-sm ${result.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{result.msg}</p>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-glow rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                        <span className="material-icons-round text-blue-600 dark:text-blue-400 mt-0.5">info</span>
                        <div><h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Destination Tip</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400/80 mt-1">We recommend restoring to a new empty folder to avoid overwriting existing files.</p></div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Source Configuration</h3>
                        </div>
                        <InputRow label="Repository Path" icon="folder_open" val={repo} set={setRepo} placeholder="C:\Users\You\Desktop\MyBackups" browseTarget="repo" />
                        <InputRow label="Snapshot ID" icon="qr_code_2" val={snapId} set={setSnapId} placeholder="e.g. 8f4a2b1c" mono />
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">2</div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Destination &amp; Security</h3>
                        </div>
                        <InputRow label="Restore Destination Path" icon="drive_file_move" val={dest} set={setDest} placeholder="C:\Users\You\Desktop\Restored" browseTarget="dest" />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Repository Passphrase</label>
                            <div className="relative flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="material-icons-round text-slate-400 text-lg">vpn_key</span></div>
                                <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter passphrase to decrypt"
                                    className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <span className="material-icons-round text-lg">{showPass ? 'visibility' : 'visibility_off'}</span></button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button onClick={restore} disabled={loading || !repo || !snapId || !dest || !pass}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50">
                            {loading ? <><span className="spinner" />Restoring...</> : <><span className="material-icons-round text-lg">download</span>Restore Now</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
