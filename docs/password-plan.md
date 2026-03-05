# Passphrase Recovery Feature — Full Technical Plan

## 1. Security Analysis

### Is storing the passphrase locally safe?

Since this app runs **100% locally** (no cloud, no network calls, localhost only), the threat model is narrow:

| Threat | Risk Level | Notes |
|---|---|---|
| Remote attacker | ✅ None | App is not internet-exposed |
| Same-machine multi-user | 🟡 Low | File permissions protect `~/.plakar-dashboard/` |
| Malware on local machine | 🟡 Medium | Any malware already has full access to Plakar data anyway |
| Physical access by another person | 🟡 Medium | OS login protects this; same risk as any local file |
| Developer accidentally committing the file | ✅ None | Stored in `~/.plakar-dashboard/`, not inside the codebase/repo |

**Conclusion:** For a local-only tool, storing the passphrase locally (with proper encryption) is an acceptable security tradeoff — far better than losing backup data permanently.

---

## 2. Storage Mechanism Comparison

| Option | Security | Recovery | Complexity |
|---|---|---|---|
| **Plaintext file** | ❌ Weakest | ✅ Easy | ✅ Simple |
| **Passphrase hint** (previous plan) | ✅ Safe (no secret stored) | ❌ Not a real recovery | ✅ Simple |
| **AES-256 encrypted file** (machine-derived key) | ✅ Strong | ✅ Easy | 🟡 Medium |
| **OS Keychain** (keytar) | ✅ Strongest | ✅ Easy | ❌ Native addon complexity |
| **Downloadable backup file** | 🟡 Only as safe as where user saves it | ✅ User-controlled | ✅ Simple |

> **Recommended approach: AES-256 encrypted local file (Option A) + Downloadable JSON file (Option B).**
> OS Keychain via `keytar` is the gold standard but introduces native binary build complexity for a Next.js dev server. The AES-256 encrypted file using a machine-derived key gives 95% of the security with zero build friction.

---

## 3. Recommended Implementation — How Encryption Works

**Machine-derived key (no master password needed):**

```
Key = SHA-256( hostname + os.platform() + os.homedir() )
```

This key is unique per machine, automatically available, and never stored anywhere. The passphrase is encrypted with AES-256-GCM using this key and stored in:

```
~/.plakar-dashboard/recovery.json
```

```json
{
  "repos": [
    {
      "path": "/Volumes/backup/myrepo",
      "name": "myrepo",
      "createdAt": "2026-03-05T...",
      "iv": "base64-encoded-IV",
      "encryptedPassphrase": "base64-encoded-ciphertext",
      "authTag": "base64-encoded-GCM-tag"
    }
  ]
}
```

> **Note:** AES-256-GCM is built into Node.js `crypto` module — **zero new dependencies needed**.

---

## 4. UI/UX Flow — One-Time Popup

```
User enters passphrase → clicks "Run Backup" or "Create Repository"
        ↓
Check localStorage: 'passphrase-recovery-dismissed-<repoPath>' === true?
   ┌─── YES ───┐          ┌─── NO ───┐
   ▼                       ▼
Proceed (normal)       Show ONE-TIME modal popup:
                       ┌─────────────────────────────────┐
                       │  🔐 Save Passphrase Recovery?   │
                       │                                 │
                       │  Your passphrase can be saved   │
                       │  locally so you can recover it  │
                       │  if forgotten. This popup will  │
                       │  not appear again.              │
                       │                                 │
                       │  ⚠ If you skip this and forget  │
                       │  your passphrase, your backup   │
                       │  data CANNOT be recovered.      │
                       │  Plakar's encryption makes this │
                       │  cryptographically impossible.  │
                       │                                 │
                       │  [Option A: Save Locally 🔒]    │
                       │  [Option B: Download File  ⬇]   │
                       │  [Skip — I'll remember it]      │
                       └─────────────────────────────────┘
        ↓                       ↓                    ↓
 AES-encrypt + save    Download .json file     Set dismissed flag
 to recovery.json       to user's machine         → proceed
 → set dismissed flag
```

- Popup shown **only once per repository path** (tracked in `localStorage`)
- **Option A and Option B are not mutually exclusive** — users can do both
- Clicking "Skip" sets the `localStorage` flag so it never shows again for that repo

---

## 5. Proposed File Changes

### Zero New Dependencies
Uses Node.js built-in `crypto` module — no extra npm packages required.

---

### Backend

#### [NEW] `src/app/api/plakar/passphrase-recovery/route.ts`

- **`POST`** — `{ repository, passphrase }` → AES-256-GCM encrypt and save to `~/.plakar-dashboard/recovery.json`
- **`GET`** — `?repo=<path>` → decrypt and return the passphrase for a given repo (local retrieval only)
- **`DELETE`** — `{ repository }` → remove a repo's stored passphrase from the file

---

### Frontend

#### [MODIFY] `src/app/backup/page.tsx`
- After a **successful** backup, check `localStorage` for the dismissed flag for that repo path
- If not dismissed → show the **one-time recovery popup modal**
- Option A → `POST /api/plakar/passphrase-recovery` → shows green "Saved securely ✓"
- Option B → triggers browser download of a `.json` file with repo metadata + passphrase
- Skip → sets `localStorage` flag, no API call

#### [MODIFY] `src/app/settings/page.tsx`
- Add **"Passphrase Recovery"** card listing all repos in `recovery.json`
- Each row: repo name + "Reveal passphrase" button → masked input with show/hide toggle
- Delete button → calls `DELETE` to remove from local storage

---

## 6. Verification Plan

**Test 1 — One-time popup appears on first backup:**
1. Run a backup for a new repo
2. ✅ Recovery popup appears after success

**Test 2 — Option A (local encrypted save):**
1. Click "Save Locally" → ✅ success indicator shown
2. Check `~/.plakar-dashboard/recovery.json` → ✅ encrypted blob (not plaintext)
3. Settings → Reveal passphrase → ✅ correct passphrase shown

**Test 3 — Option B (download file):**
1. Click "Download File" → ✅ `.json` file downloads
2. Open file → ✅ contains repo path, passphrase, date, system info

**Test 4 — Popup never shows again:**
1. Run another backup for the same repo
2. ✅ Popup does NOT appear again

**Test 5 — Delete recovery entry:**
1. Settings → delete a repo's saved passphrase
2. ✅ Entry removed from `recovery.json`, "Reveal" no longer available
