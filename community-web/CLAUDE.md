# CommUnity Web Dashboard (CLAUDE.md)

> This file describes the entire React web project so Claude can understand it without re-exploration.

---

## Project Overview

**CommUnity Web Dashboard** is a React app for barangay officials and system admins in Dagupan City, Philippines. It provides:
- **Officials portal**: Manage reports, document requests, announcements, residents, rewards, permissions
- **Admin portal**: System-wide management, user bans, official approvals, system settings

**Backend**: Supabase (Auth, Database, Storage, Realtime)
**Framework**: React (no Redux/Zustand — Context API + useState)
**Deployment**: Vercel (`vercel.json` present)
**Styling**: Custom CSS (`officials.css`, `App.css`, `index.css`)

---

## Folder Structure

```
src/
├── App.js                          # Main routing + public landing page
├── index.js                        # React root
├── supabaseClient.js               # Supabase JS client init
├── index.css / App.css / officials.css
├── components/
│   ├── OfficialSidebar.js          # Officials nav (Permissions hidden for non-captains)
│   ├── OfficialTopbar.js           # Officials header
│   ├── AdminSidebar.js             # Admin nav
│   ├── AdminTopbar.js              # Admin header
│   ├── ProtectedRoute.js           # Role-based route guard
│   └── Pagination.js               # Reusable table pagination
├── contexts/
│   └── OfficialProfileContext.js   # Real-time official profile + can_manage state
├── hooks/
│   ├── useOfficialProfile.js       # Hook for OfficialProfileContext
│   └── useSessionTimeout.js        # 10-min inactivity auto-logout
└── pages/
    ├── Login.js                    # Officials login
    ├── Signup.js                   # Officials registration (OTP + ID upload)
    ├── ForgotPassword.js
    ├── ResetPassword.js
    ├── admin/
    │   ├── AdminPortal.js          # Admin login (separate from officials)
    │   ├── AdminDashboard.js       # System KPIs + activity
    │   ├── UserManagement.js       # Ban/unban residents, manage officials, approve pending residents
    │   ├── AdminReports.js         # View all reports system-wide
    │   ├── AdminRequests.js        # View all requests system-wide
    │   ├── AdminAnalytics.js       # Cross-barangay analytics
    │   ├── AdminRewards.js         # Global reward catalog + tier management
    │   ├── AdminSettings.js        # Maintenance mode, admin accounts, system config
    │   └── AdminProfile.js
    └── officials/
        ├── Dashboard.js            # Post announcements, view stats
        ├── Reports.js              # Manage barangay reports + Google Maps
        ├── Requests.js             # Process document requests
        ├── Residents.js            # View residents; approve/reject pending sign-ups
        ├── Rewards.js              # Award points, leaderboard, confirm redemptions
        ├── Analytics.js            # Barangay-specific charts
        ├── Permissions.js          # Captain-only: toggle can_manage for other officials
        └── Profile.js
```

---

## Routing Structure

```
/                     → Public landing page (hero, features, contact form)
/login                → Officials login
/signup               → Officials registration
/forgot-password      → Password reset request
/reset-password       → Password reset completion
/admin-portal         → Admin login

/officials/*          → ProtectedRoute (role='official') + OfficialProfileProvider
  /dashboard
  /reports
  /requests
  /analytics
  /rewards
  /residents
  /permissions        (Barangay Captain only — hidden in sidebar for others)
  /profile

/admin/*              → ProtectedRoute (role='admin')
  /dashboard
  /user-management
  /reports
  /requests
  /analytics
  /rewards
  /settings
  /profile
```

**ProtectedRoute logic**:
- Officials: query `officials` table where `auth_id` matches session + `status='approved'`
- Admins: query `admins` table where `auth_id` matches session
- Redirect to `/login` on failure

---

## Roles & Permissions

### Role Types

| Role | Table | Login URL | Approval |
|------|-------|-----------|----------|
| **Admin** | `admins` | `/admin-portal` | No approval needed |
| **Official** | `officials` | `/login` | Must be approved by admin |
| **Resident** | `users` | Mobile app only | Approved by barangay official |

### Official Positions

Barangay Captain, Councilor, Secretary, Treasurer, Health Worker, Tanod, SK positions

### Permission Matrix

| Action | Admin | Captain | Officer (can_manage=true) | Officer (can_manage=false) |
|--------|-------|---------|--------------------------|--------------------------|
| Change report status | ✓ (all barangays) | ✓ (own) | ✓ | ✗ |
| Process requests | ✓ (all) | ✓ (own) | ✓ | ✗ |
| Award points | ✓ (all) | ✓ (own) | ✓ | ✗ |
| Post announcements | ✗ | ✓ | ✓ | ✓ (if can_manage) |
| Manage permissions | ✗ | ✓ (own barangay only) | ✗ | ✗ |
| Ban residents | ✓ (global) | ✗ | ✗ | ✗ |
| Approve officials | ✓ | ✗ | ✗ | ✗ |
| Approve pending residents | ✗ | ✓ | ✓ (if can_manage) | ✗ |
| Revoke officials | ✓ | ✗ | ✗ | ✗ |

### `can_manage` Flag
- Boolean on `officials` table
- Only Barangay Captain can toggle it via `/officials/permissions`
- When `false`: official is view-only (cannot change statuses, award points, etc.)
- Changes propagate in real-time via Supabase subscription
- In code: `canAct = isCapitan || canManage` guards all action buttons

---

## OfficialProfileContext

Provides across all officials pages:
```javascript
{
  profile: {
    barangay: string,
    barangay_name: string,
    avatar_url: string | null,
    position: string,
    can_manage: boolean,
  },
  loading: boolean
}
```

Hook: `useOfficialProfile()` returns `{ profile, loading, isCapitan, canManage }`

Subscribes to `officials` table changes via Supabase Realtime so permission changes by Captain are instant.

---

## Supabase Tables

| Table | Key Columns | Notes |
|-------|-------------|-------|
| **officials** | id, auth_id, barangay, position, full_name, email, status (pending/approved/rejected/banned), can_manage, ban_reason, avatar_url, id_image_url | Main officials table |
| **admins** | id, auth_id, email, created_at | Admin accounts |
| **users** | id, auth_id, email, first_name, last_name, barangay, avatar_url, account_status (active/banned/deleted), **status** (active/pending/banned), **id_image_url** | Residents |
| **reports** | id, user_id, barangay, problem, description, image_url, location_lat, location_lng, status (pending/in_progress/resolved/rejected), created_at, updated_at | Reports |
| **requests** | id, user_id, barangay, document_type, purpose, reference_number, status (pending/ready_for_pickup/claimed/rejected), payment_method, rating, created_at | Document requests |
| **announcements** | id, barangay, title, body, image_url, expires_at, is_published, published_at, posted_by, created_at | Barangay announcements |
| **rewards** | id, category, name, points_required, quantity, description | Reward catalog |
| **reward_ledger** | id, user_id, barangay, points, type (award/deduct), reason, created_at | Point transactions |
| **redemptions** | id, user_id, reward_id, status (pending/claimed/cancelled), created_at, claimed_at | Reward redemptions |
| **system_settings** | key, value | `maintenance_mode`, `email_notifications`, `backup_frequency` |

---

## Supabase Edge Functions

| Function | Purpose | Called From |
|----------|---------|-------------|
| `delete-auth-user` | Deletes user from Supabase Auth using service role | UserManagement.js (revoke official), Residents.js (reject pending resident) |
| `send-email` | Sends email via Brevo API | Multiple pages |

### `send-email` Email Types

| type | Subject | Triggered When |
|------|---------|----------------|
| `resident_approved` | "Your CommUnity Account Has Been Approved" | Official approves pending resident |
| `resident_rejected` | "Account Not Approved" | Official rejects pending resident (includes reason, asks to re-register) |
| `revoked` | "Your CommUnity Official Account Has Been Revoked" | Admin revokes an official |
| `rejection` | Officials sign-up rejection | Admin rejects pending official |
| `approval` | Officials sign-up approval | Admin approves pending official |

### `delete-auth-user` Edge Function Notes
- Has CORS headers (`Access-Control-Allow-Origin: *`) and OPTIONS preflight handler
- Called with `body: { auth_id: '...' }`
- Returns `{ data, error }` — always check BOTH `delErr` AND `delData?.error`
- Does NOT throw on function-level success but auth deletion failure

---

## Officials Pages — Feature Details

### Dashboard (`/officials/dashboard`)
- Post announcements (title, body, image, expiry: 3/7/10/30 days)
- Max 10 active announcements per barangay
- View barangay stats

### Reports (`/officials/reports`)
- View reports scoped to official's barangay
- Filter by status
- Change status: pending → in_progress → resolved / rejected
- Map modal showing report location (Google Maps + OSRM routing to barangay hall)
- Only `canAct` officials can change status

### Requests (`/officials/requests`)
- Process document requests: pending → ready_for_pickup → claimed / rejected
- Resident ratings on completion
- Auto-generated reference numbers

### Residents (`/officials/residents`)
- **Tabs**: Pending Approval | Current Residents | Deleted Accounts
- **Default tab**: Pending Approval
- **Pending tab**: shows residents awaiting approval (status='pending' in users table)
  - `canAct` officials see Approve/Reject buttons
  - Non-canAct officials see read-only notice
  - View Government ID image in fullscreen modal (`IdImageModal`)
  - Approve → sets `status='active'`, sends `resident_approved` email
  - Reject → sends `resident_rejected` email, calls `delete-auth-user`, deletes users row
- Stats: Pending Approval (amber), Total Residents, Banned, Deleted
- Filter pills include "Pending" (amber)

### Rewards (`/officials/rewards`)
- Award points to residents
- View leaderboard / top contributors
- Tier system: Starter (0-99) → Red → Blue → Green → Silver → Gold (1500+)
- Confirm redemptions (pending → claimed/cancelled)

### Permissions (`/officials/permissions`)
- **Captain only** — hidden from sidebar for non-captains
- Toggle `can_manage` per official
- Real-time updates via Supabase subscription

---

## Admin Pages — Feature Details

### UserManagement (`/admin/user-management`)
- Two sections: Officials + Residents
- **Officials**: Approve/reject pending sign-ups, revoke approved officials
  - RevokeModal quick reasons: "No longer in position", "Resigned or removed from office", "Misconduct or violation of community guidelines", "Position transferred to another official", "Account registered under wrong barangay"
  - Revoke flow: sends `revoked` email, calls `delete-auth-user`, deletes officials row
  - Error check: `if (delErr) throw ...` AND `if (delData?.error) throw ...`
- **Residents**: Ban/unban, view status. Filter includes "Pending" pill (amber).
  - Pending residents show "Reviewed by officials" label (no ban buttons — pending approval is officials' job)
  - Resident status badge: amber "Pending", green "Active", red "Banned"

### AdminSettings (`/admin/settings`)
- Maintenance mode toggle → updates `system_settings` key `maintenance_mode`
- Email notifications toggle
- Backup frequency setting
- Admin account management (create/edit/delete admins)

---

## Login Page Business Rules

- Check `system_settings.maintenance_mode = 'true'` BEFORE auth → block with maintenance message
- After auth, query `officials` table for `auth_id`
- If not found: show **"No official account found for this email. Please sign up to register as a barangay official."**
  (NOT "Access denied. This portal is for barangay officials only.")
- If `status !== 'approved'`: appropriate error (pending/rejected/banned)

---

## Resident Sign-Up Approval System

**Sign-up flow (Android)**:
1. Resident picks barangay → app checks `officials` table for `status='approved'` in that barangay
2. If no officials → blocks sign-up with error
3. Resident uploads Government ID during sign-up
4. After OTP verification → `status='pending'` in users table; ID uploaded to `resident-ids` bucket
5. Resident cannot log in while `status='pending'`

**Approval flow (Web)**:
1. Officials see pending residents on Residents page (default tab)
2. Can view Government ID fullscreen
3. **Approve**: `UPDATE users SET status='active'` + send `resident_approved` email
4. **Reject**: send `resident_rejected` email + call `delete-auth-user` + delete users row (so they can re-register)

**Admin view**:
- Admin sees pending residents in UserManagement with amber "Pending" filter
- Admin can only VIEW pending residents (no approve/reject — that's officials' role)

---

## Session Management

- `useSessionTimeout` hook: warns at 9 min inactivity, auto-logout at 10 min
- "Stay Logged In" button resets timer
- Session stored by Supabase JS SDK in localStorage
- `supabase.auth.onAuthStateChange()` used in ProtectedRoute

---

## External APIs

| API | Purpose | Used In |
|-----|---------|---------|
| **Supabase Realtime** | Real-time permission updates | OfficialProfileContext.js |
| **Google Maps API** | Display report locations | Reports.js, AdminReports.js |
| **OSRM** | Route calculation from barangay hall to report | Reports.js |
| **EmailJS** | Public contact form on landing page | App.js |
| **Brevo** | Transactional emails via `send-email` edge function | Multiple pages |

---

## Business Rules

1. **Maintenance Mode**: blocks officials login; admin portal still accessible
2. **Official Approval**: new officials need email OTP + govt ID + admin approval before login
3. **Barangay Scoping**: all officials data (reports, requests, residents, announcements) filtered to `officials.barangay`
4. **Announcement Limit**: max 10 active per barangay
5. **Report Status Flow**: pending → in_progress → resolved/rejected
6. **Request Status Flow**: pending → ready_for_pickup → claimed/rejected
7. **Redemption Flow**: pending → claimed/cancelled
8. **can_manage**: false = view only, true = full access (except Permissions page which is Captain-only)
9. **Resident Pending**: officials approve/reject; admins view-only
10. **Revoke = delete auth**: revoke must call `delete-auth-user` edge function AND check both `delErr` and `delData?.error` — function call success ≠ auth deletion success
11. **Reject pending resident = delete auth + delete users row**: so resident can re-register with same email

---

## Barangay List (33 barangays, Dagupan City)

Bacayao Norte, Bacayao Sur, Barangay I (Pob.), Barangay II (Pob.), Barangay III (Pob.), Barangay IV (Pob.), Bolosan, Bonuan Binloc, Bonuan Boquig, Bonuan Gueset, Calmay, Carael, Caranglaan, Herrero, Lasip Chico, Lasip Grande, Lomboy, Lucao, Malued, Mamalingling, Mangin, Mayombo, Pantal, Poblacion Oeste, Pogo Chico, Pogo Grande, Pugaro Suit, Quezon, San Jose, San Lázaro, Salapingao, Taloy, Tebeng
