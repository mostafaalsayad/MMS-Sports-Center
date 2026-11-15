# MMS Sports Center

MMS Sports Center is an academic sports-centre web application built with HTML, CSS and JavaScript and connected to Firebase Authentication and Cloud Firestore.

## Main Features

- Responsive public website
- Gym, swimming, basketball and tennis information
- Membership plans
- Member registration and login
- Firebase Email/Password Authentication
- Email verification
- Password reset
- Firestore member profiles
- Member dashboard
- Facility/session booking prototype
- Membership freeze requests
- Product store and orders prototype
- Administrator area
- Accessibility preferences
- Responsive design
- Dark mode and accessibility styling

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

The project intentionally avoids React/Vite and does not require a development framework.

---

# How to Run the Project

## Requirements

To run the application locally, you need:

- Python 3
- A modern web browser such as Google Chrome, Microsoft Edge or Firefox
- An active internet connection for Firebase Authentication and Cloud Firestore

Firebase CLI and Firebase login are **not required** to run and test the application.

---

## Step 1: Extract the Project

Extract the submitted project archive to a folder on your computer.

For example:

```text
C:\Users\YourName\Downloads\MMS-Sports-Center
```

---

## Step 2: Open Command Prompt in the Project Folder

Open the extracted project folder in File Explorer.

Click the address bar, type:

```text
cmd
```

and press **Enter**.

This will open Command Prompt directly inside the project directory.

Alternatively, open Command Prompt manually and navigate to the project folder using:

```bash
cd "C:\Users\YourName\Downloads\MMS-Sports-Center"
```

---

## Step 3: Start the Local Web Server

Run:

```bash
python -m http.server 8000
```

If `python` is not recognised on Windows, try:

```bash
py -m http.server 8000
```

A message similar to the following should appear:

```text
Serving HTTP on 0.0.0.0 port 8000 ...
```

Keep this Command Prompt window open while using the application.

---

## Step 4: Open the Application

Open a web browser and go to:

```text
http://localhost:8000
```

The MMS Sports Center homepage should now appear.

---

## Important: Do Not Open index.html Directly

The application should be accessed through the local HTTP server.

Do **not** run the application by double-clicking `index.html` and opening it using a `file://` address.

Use:

```text
http://localhost:8000
```

This ensures that the application is served correctly and can communicate with Firebase Authentication and Cloud Firestore.

---

## Firebase and Database

The application is already configured to connect to its Firebase project.

Firebase Authentication and Cloud Firestore are cloud-based services, so **no local database installation is required**.

The user does not need to:

- Install MySQL or PostgreSQL
- Create a local database
- Run `firebase login`
- Have access to the project owner's Google account
- Use the Firebase CLI for normal application testing

An internet connection is required for Firebase Authentication and Cloud Firestore functionality.

---

## Testing Member Registration

To create and test a member account:

1. Open the application.
2. Select **Register**.
3. Complete the registration form.
4. Submit the form.
5. Check the registered email address for the verification email.
6. Verify the email address.
7. Return to the application.
8. Log in using the registered email and password.
9. The member dashboard will open after successful authentication.

New accounts are created with:

```text
role: member
membershipStatus: Pending
```

The public registration process cannot create administrator accounts.

---

## Administrator

Administrator accounts use the same Firebase Authentication system but must have:

```text
role: admin
```

in the corresponding Firestore user document.

The public registration form intentionally creates member accounts only.

If administrator demonstration credentials are supplied with the submitted project, they can be used to access the administrator area.

See `DATABASE_SETUP.md` for additional Firebase database and security information.

---

## Browser Storage

Some prototype functionality, including selected booking, order and freeze-request operations, may use browser `localStorage`.

This means locally stored prototype data is associated with the browser in which the application is being tested.

Firebase-backed user accounts, profiles and integrated membership information use the project's cloud-connected Firebase services.

---

## Stopping the Application

When finished testing the project:

1. Return to the Command Prompt window.
2. Press:

```text
Ctrl + C
```

3. The local Python web server will stop.

---

## Troubleshooting

### Python is not recognised

If:

```bash
python -m http.server 8000
```

does not work, try:

```bash
py -m http.server 8000
```

If neither command works, Python 3 must be installed and made available through the system PATH.

### Port 8000 is already in use

Use another port, for example:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

### Firebase features are not working

Check that:

- The computer has an active internet connection.
- The website is being accessed through `http://localhost:8000`.
- JavaScript is enabled in the browser.
- The Firebase configuration files included with the project have not been modified.

---

# Quick Start

For users familiar with Python:

```bash
cd "path-to-MMS-Sports-Center"
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

No Firebase CLI login or local database setup is required for normal application testing.

---

## Optional Firebase Deployment

Firebase CLI is only required if the authorised project owner wants to manage or deploy the Firebase Hosting project.

For example:

```bash
firebase login
firebase deploy
```

These commands are **not required to run the submitted application locally**.

---

## Project Information

**Project:** MMS Sports Center  
**Type:** Master's Computer Science Project  
**Application:** Sports Center Web Application with Membership Management and Inclusive Access Features