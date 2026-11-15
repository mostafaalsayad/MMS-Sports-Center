# Security and Privacy Notes

## Implemented controls
- Member and administrator route checks.
- Password-strength and form validation in the prototype.
- Role-based Firestore rules for the cloud design.
- Ownership checks for bookings, orders, profiles, and freeze requests.
- Restricted administrator-only status changes.
- No real card details collected or stored.
- Output is rendered using controlled DOM operations where applicable.

## Important limitation
Browser local storage is suitable only for an offline academic demonstration. It is not a secure replacement for a server-side identity system because users can inspect and edit data stored on their own device. The Firebase mode must be used for a deployed demonstration requiring real authentication and server-enforced authorization.

## Recommended production improvements
- Use Firebase Authentication exclusively and remove local password storage.
- Assign administrator roles through trusted backend tooling or custom claims.
- Enable App Check and security monitoring.
- Add rate limiting through backend endpoints where relevant.
- Add consent, retention, privacy notice, account deletion, and audit logging.
- Perform dependency, penetration, and accessibility testing before public release.
