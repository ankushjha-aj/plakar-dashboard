// Persistent Activity Log — stored in localStorage, survives page reloads and navigation
// Max 50 entries. Newest entries at the top (index 0).

export type ActivityType = 'repo_created' | 'backup' | 'restore' | 'repo_archived' | 'repo_restored';

export interface ActivityEntry {
    id: string;
    type: ActivityType;
    title: string;
    detail: string;
    timestamp: string; // ISO string
}

const STORAGE_KEY = 'plakar_activity_log';
const MAX_ENTRIES = 50;

export function getActivityLog(): ActivityEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
    } catch {
        return [];
    }
}

export function addActivityEntry(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): void {
    if (typeof window === 'undefined') return;
    try {
        const existing = getActivityLog();
        const newEntry: ActivityEntry = {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: new Date().toISOString(),
        };
        const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* ignore storage errors */ }
}

export function clearActivityLog(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
}
