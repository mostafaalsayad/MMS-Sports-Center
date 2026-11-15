# Developer Guide

## Architecture
The project is a static multi-page frontend written in HTML, CSS, and JavaScript. Browser storage supports direct-file demonstration. Firebase modules and Firestore rules are included for migration to cloud persistence.

## Important folders
- `admin/`: protected administrator pages.
- `member/`: protected member pages.
- `css/`: shared visual, responsive, and accessibility styles.
- `js/`: authentication, domain workflows, navigation, validation, and Firebase services.
- `docs/`: requirements, diagrams, testing, security, and manuals.
- `scripts/`: automated project validation.

## JavaScript responsibilities
- `auth.js`: registration, login, sessions, roles, and logout.
- `bookings.js`: session catalogue, capacity, booking, cancellation, and history.
- `freeze.js`: freeze-request validation and lifecycle.
- `store.js`: products, cart, checkout, and orders.
- `member.js`, `profile.js`, `membership.js`, `preferences.js`: member-area data and presentation.
- `admin.js`: administrator statistics and management actions.
- `firebase-service.js`: cloud-service abstraction.

## Data integrity rules
- Email addresses are normalized before comparison.
- Duplicate active session bookings are rejected.
- Session capacity cannot be exceeded.
- Freeze dates and duration are validated.
- Only one pending freeze request is allowed per member.
- Cart quantities are bounded.
- Administrative routes and actions verify the user role.

## Validation
Run:

```bash
python scripts/validate_project.py
```

The script checks local links, duplicate element IDs, image alt text, form labels, and JavaScript syntax when Node.js is available.

## Firebase deployment
Follow `DATABASE_SETUP.md`, copy `js/firebase-config.example.js` to the configured filename, add project credentials, enable Email/Password Authentication and Firestore, deploy the included rules, and host the project over HTTPS.
