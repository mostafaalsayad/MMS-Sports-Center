# Test Plan and Results

## Automated checks
| Test | Expected result | Result |
|---|---|---|
| Local HTML references | Every referenced local page, script, and stylesheet exists | Pass |
| JavaScript syntax | All JavaScript parses without syntax errors | Pass |
| Duplicate HTML IDs | No page contains duplicate element IDs | Pass |
| Image alternatives | Meaningful images include `alt` attributes | Pass |
| Form labelling | Form controls are labelled or explicitly accessible | Pass |

## Functional test cases
| ID | Scenario | Expected result |
|---|---|---|
| FT-01 | Register with valid unique details | Account is created and can sign in |
| FT-02 | Register with duplicate email | Registration is rejected with feedback |
| FT-03 | Open member page while signed out | User is redirected to login |
| FT-04 | Member opens administrator page | Access is denied or redirected |
| FT-05 | Book an available session | Confirmed booking appears in history |
| FT-06 | Book the same session twice | Duplicate active booking is prevented |
| FT-07 | Book a full session | Booking is prevented |
| FT-08 | Cancel a confirmed booking | Status changes to cancelled |
| FT-09 | Submit invalid freeze dates | Form explains the validation error |
| FT-10 | Submit a second pending freeze request | Request is prevented |
| FT-11 | Add, update, and remove cart items | Totals and quantities update correctly |
| FT-12 | Check out with an empty cart | Checkout is prevented |
| FT-13 | Place a valid order | Order appears in member and admin views |
| FT-14 | Admin changes request/order status | Updated status is displayed persistently |
| FT-15 | Toggle accessibility preferences | Selected display preference persists |

## Browser and responsive tests
Test at common widths near 375 px, 768 px, 1024 px, and 1440 px. Verify navigation, cards, tables, forms, and floating accessibility controls do not overlap or cause inaccessible horizontal scrolling.

## Regression checklist
After each change, repeat login, member route protection, booking, freeze, cart, checkout, administrator access, navigation, and accessibility-control tests.
