# CanineLink System - Persistent Project Context

Build **CanineLink**, a canine blood donor matching and emergency transfusion coordination platform for veterinary clinics and registered dog owners.

## Architecture

- Frontend: React + Tailwind CSS, one responsive web app for admins, clinic staff, and dog owners
- Backend: Laravel REST API
- Database: MySQL or PostgreSQL through Laravel Eloquent, centralized with clinic-level isolation
- Authentication: Laravel Sanctum SPA/token authentication with RBAC middleware and policies
- Architecture: Cloud-hosted client-server application with one shared database
- The system coordinates live donor matching, verification, and emergency requests. It is not a blood bank or blood inventory system. Final medical decisions remain with licensed veterinarians.

Never let a lower tier access functionality or data belonging to a higher or sibling tier without an explicit, approved permission grant.

## Access Tiers

### Tier 1: `super_admin`

Use one modular `super_admin` role for provincial veterinary oversight and system/developer administration. Do not split it unless explicitly requested, but keep permissions modular so they can be split later.

Capabilities:

- Onboard, suspend, and remove veterinary clinics
- Create and manage clinic admin accounts
- View and search all clinics' donors, requests, and donation history
- Approve or override disputed clinic-to-clinic data-sharing requests
- Configure eligibility rules, relay response windows, blood compatibility rules, and notification templates
- View system-wide analytics for emergency response, donor participation, clinic activity, and relay escalation
- Manage AI donor recommendation weights for compatibility, distance, availability, and donation interval
- Access the complete audit log
- Manage feature flags, API keys, and mapping/notification integrations
- Use admin-only schema health, backup, and export endpoints; never expose raw database access to the frontend

Guardrails:

- Every admin endpoint requires `role == 'super_admin'`.
- Every admin action touching another clinic's data writes to `audit_log`.
- Never expose raw clinic impersonation without a logged audit reason.

### Tier 2: Clinic Admin

A licensed veterinarian or clinic manager account belongs to exactly one clinic. `clinic_id` is fixed at account creation.

Capabilities:

- Manage staff accounts within the user's clinic
- Review and verify owner-submitted donor dog registrations
- Create emergency blood requests
- View AI donor recommendations for active requests
- Monitor relay status: contacted, accepted, declined, or timed out
- Confirm arriving donors with a QR code or emergency verification code
- Update donation records and donor eligibility/availability
- Manage only the clinic's own donor and request records by default
- Request access to another clinic's donor pool or records through `access_requests`
- Approve or deny incoming access requests targeting the user's own clinic
- View a coordination dashboard containing full local data plus granted external data, clearly labeled as shared/external

Guardrails:

- Clinic queries filter by `clinic_id = current_user.clinic_id` unless a live, unexpired, unrevoked `access_grants` row permits the requested resource.
- A clinic admin cannot approve self-access or approve on behalf of another clinic.
- UI must distinguish local clinic data from shared data and identify the source clinic.

### Tier 3: Registered Dog Owner

This is a responsive web role in the same React + Tailwind application. Users may manage only their own account, dogs, and records.

Capabilities:

- Register an account and one or more potential donor dogs
- Track each dog's veterinary verification status: pending, verified, or rejected with reason
- Receive emergency requests through email/SMS and in-app alerts
- Accept or decline requests within the veterinarian-approved response window
- Grant approximate location and ETA per request; never expose an exact address before acceptance
- View a QR code or emergency verification code after accepting
- View donation history and next eligible donation date for owned dogs
- View and edit profile and contact information
- Receive relay notifications

Guardrails:

- Users may query or mutate only rows where `dogs.owner_user_id == current_user.id`.
- Never expose clinic lists, other owners' dogs, other donors' records, or system settings.
- Exact location/address fields are excluded from this role's API responses except in an accepted, active emergency request context.

## Database and API Requirements

Reuse the schema shape for `clinics`, `users`, `dogs`, `blood_types`, `access_requests`, `access_grants`, and `audit_log`. Add:

- `emergency_requests`
- `donor_responses`
- `donation_history`
- `verification_codes`

Translate the schema into Laravel migrations and Eloquent models. Enforce clinic isolation with Laravel global query scopes on models such as `Dog`, `BloodUnit`, and `EmergencyRequest`, plus an explicit bypass path for rows covered by a live `access_grants` record. `super_admin` requests may skip the scope only behind an explicit role check, never by default.

Use Laravel Policies such as `DogPolicy`, `EmergencyRequestPolicy`, and `AccessRequestPolicy` to centralize authorization rules instead of scattering checks through controllers. Use Laravel Sanctum for SPA auth; middleware must resolve the authenticated user's role and `clinic_id` for scopes and policies on every request.

Every write to a cross-clinic-visible resource, every access-request approval or denial, and every admin override must create an `AuditLog` entry, using a model observer or dedicated `AuditLogService`.

## Implementation Order

1. Laravel Sanctum auth, role/clinic middleware, and base policies
2. Database migrations and Eloquent models with global scopes
3. Admin API routes/controllers and React admin dashboard shell
4. Clinic-admin API routes/controllers and React clinic dashboard shell
5. User API routes/controllers and React dog-owner screens with role-gated routes
6. Access-request/grant workflow with both clinic-admin UIs
7. Smart Emergency Donor Relay System Laravel queued job, scheduler, and notifications

## Existing Workspace Note

The current repository is a React/Electron client and does not yet contain the Laravel backend. Before adding backend infrastructure, inspect the repository and preserve existing functionality. Keep authentication contracts and role names consistent across the React client and Laravel API. Prefer focused, incremental changes with tests and migrations for every new contract.
