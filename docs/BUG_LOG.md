# Bug and Fix Log

| ID | Issue | Cause | Fix | Retest |
|---|---|---|---|---|
| BUG-01 | Renamed branding was inconsistent across early pages | Static text existed in several files | Replaced branding and checked all pages | Pass |
| BUG-02 | Protected pages could be opened without a valid session | Missing centralized guard on early pages | Added member/admin route checks | Pass |
| BUG-03 | A member could attempt the same booking repeatedly | Duplicate lookup was absent | Added active-booking duplicate validation | Pass |
| BUG-04 | Capacity could be exceeded | Booking creation did not consistently count active records | Added capacity check before confirmation | Pass |
| BUG-05 | Multiple pending freeze requests were possible | Pending-state uniqueness was not checked | Added one-pending-request rule | Pass |
| BUG-06 | Invalid freeze date ranges could be submitted | Incomplete date validation | Added future-date, ordering, and 7–60 day checks | Pass |
| BUG-07 | Empty carts could reach checkout | Missing checkout guard | Added empty-cart redirect/error | Pass |
| BUG-08 | Administrator script packaging produced a syntax problem | Generated module content was malformed | Corrected module structure and reran syntax checks | Pass |
| BUG-09 | Display preferences did not persist consistently | Preferences were not initialized globally | Added shared initialization and browser persistence | Pass |
| BUG-10 | Stage documentation did not describe security limitations clearly | Prototype/cloud modes were conflated | Added explicit offline-prototype and Firebase guidance | Pass |

## Final production-readiness review

| Bug ID | Issue | Cause | Fix | Retest result |
|---|---|---|---|---|
| BUG-014 | Hosted users received the browser's generic missing-page screen | No custom hosting error document existed | Added an accessible `404.html` page | Passed |
| BUG-015 | Hosted application had no offline fallback | No web manifest or service worker existed | Added a manifest, icon, service worker and `offline.html`; registration is restricted to HTTP/HTTPS | Passed |
| BUG-016 | README still identified the cumulative package as Stage 8 | Documentation version was not updated after later stages | Replaced README with a final production-readiness edition | Passed |
| BUG-017 | Service-worker registration could resolve the wrong path on nested member/admin pages | Relative paths depend on the current page location | Resolve the worker URL from the loaded `js/main.js` script URL | Passed |

| BUG-018 | Dark-mode hero text and benefit checklist became unreadable | Dark mode and high contrast could remain active together, while hero elements relied on inherited colours | Made the themes mutually exclusive and added explicit dark-theme colours for hero text, buttons, lists and panels | Passed |
| BUG-019 | Dark-mode icon disappeared inside the floating accessibility toolbar | The toolbar retained a white background while the icon inherited a white foreground | Added dark toolbar/button surfaces, active-state contrast, and a moon/sun icon that changes with the selected theme | Passed |
| BUG-020 | Hosted installations could continue showing the previous theme CSS | The service worker retained the original cache name | Bumped the service-worker cache version so old theme files are removed during activation | Passed |
