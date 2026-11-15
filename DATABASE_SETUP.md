# MMS Sports Center — Firebase setup

## Firebase project

Project ID: `mms-sports-center`

Authentication: **Email/Password enabled**

Firestore: **Cloud Firestore enabled**

## 1. Run the website correctly

Firebase Authentication and Firestore require an HTTP/HTTPS origin. Do not test the application by double-clicking `index.html` with a `file://` URL.

From the project directory, use Firebase Hosting locally:

```bash
firebase serve
```

Then open the local URL displayed by Firebase.

For deployment:

```bash
firebase deploy
```

## 2. Authentication

In Firebase Console:

1. Authentication → Sign-in method.
2. Enable Email/Password.
3. Add your administrator account under Authentication → Users.

## 3. Create the administrator role

After creating the administrator account, open Firestore → `users` → the administrator's UID document and change:

```text
role = admin
```

The normal registration flow always creates `role = member` and cannot create an administrator account.

## 4. Firestore collections

The application uses:

- `users`
- `membershipPlans`
- `memberships`
- `facilities`
- `sessions`
- `bookings`
- `products`
- `orders`
- `freezeRequests`

The current browser UI also contains demonstration session/product data. The Firebase-backed authentication and user profile layer is ready for these collections to be populated by the later data-management stages.

## 5. Security

`firestore.rules` is included in the project. Deploy it with:

```bash
firebase deploy --only firestore:rules
```

Never put passwords, service-account private keys, or Firebase Admin SDK credentials in the website.


## 6. If login shows `Missing or insufficient permissions`

Deploy the included rules after changing them or after creating the project:

```bash
firebase deploy --only firestore:rules
```

Then confirm that the administrator's Authentication UID has a matching
Firestore document at `users/{UID}` with `role` set to `admin`.
