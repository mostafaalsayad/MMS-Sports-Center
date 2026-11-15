# MMS Sports Center — Software Requirements Specification

## 1. Purpose
MMS Sports Center is an accessible web application prototype that integrates membership management, sports-session booking, healthy-product ordering, membership-freeze requests, and administration.

## 2. User roles
- **Visitor:** views facilities, memberships, sessions, products, and accessibility information.
- **Member:** manages a profile, membership, accessibility preferences, bookings, orders, and freeze requests.
- **Administrator:** manages members, sessions, bookings, orders, and freeze requests.

## 3. Functional requirements
| ID | Requirement |
|---|---|
| FR-01 | Visitors can register and sign in. |
| FR-02 | Authenticated members can edit their profile. |
| FR-03 | Members can select and view a membership plan. |
| FR-04 | Members can save accessibility preferences. |
| FR-05 | Users can browse and filter sports sessions. |
| FR-06 | Members can book available sessions. |
| FR-07 | The system prevents duplicate active bookings. |
| FR-08 | Members can cancel bookings and view history. |
| FR-09 | Members can submit one pending freeze request at a time. |
| FR-10 | Users can browse products and manage a shopping cart. |
| FR-11 | Members can place payment-at-reception orders. |
| FR-12 | Administrators can view and manage operational records. |
| FR-13 | Administrators can approve or reject freeze requests. |
| FR-14 | The interface provides text-size, dark, and high-contrast controls. |

## 4. Non-functional requirements
- **Accessibility:** semantic HTML, keyboard navigation, visible focus, labels, contrast controls, reduced-motion support, and responsive text.
- **Security:** authentication, role checks, validation, least-privilege Firestore rules, and no storage of payment-card data.
- **Usability:** consistent navigation, clear feedback, readable forms, and responsive layouts.
- **Reliability:** persistent records, validation of dates and quantities, and graceful empty states.
- **Maintainability:** modular JavaScript, shared CSS, documented folders, and reusable data helpers.
- **Compatibility:** current desktop and mobile browsers.

## 5. Constraints
The downloadable prototype supports direct opening through `index.html` using browser storage. Real multi-device persistence and server-enforced security require Firebase setup and web hosting as described in `DATABASE_SETUP.md`.

## 6. Acceptance summary
The prototype is accepted when its public pages open without missing files; member and administrator routes enforce roles; booking, freeze, cart, checkout, and management workflows function; and automated project validation reports no broken local references or JavaScript syntax errors.
